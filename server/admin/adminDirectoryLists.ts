import { normalizeSiteStatusForDisplay } from '@/lib/admin';
import type {
  SafetyAdminDirectoryLookupsResponse,
  SafetyAdminHeadquarterListResponse,
  SafetyAdminSiteListResponse,
  SafetyAdminUserListResponse,
  SafetyAdminUserListRow,
} from '@/types/admin';
import type { SafetySite, SafetyUserSummary } from '@/types/backend';
import type { SafetyAssignment, SafetyHeadquarter } from '@/types/controller';

interface AdminDirectoryData {
  assignments: SafetyAssignment[];
  headquarters: SafetyHeadquarter[];
  refreshedAt: string;
  sites: SafetySite[];
  users: import('@/types/backend').SafetyUser[];
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

function sortText(left: string, right: string, direction: 'asc' | 'desc') {
  const compared = left.localeCompare(right, 'ko');
  return direction === 'asc' ? compared : -compared;
}

function sortNumber(left: number, right: number, direction: 'asc' | 'desc') {
  return direction === 'asc' ? left - right : right - left;
}

function clampPaging(limit?: number, offset?: number) {
  return {
    limit: Math.max(1, Math.min(500, limit ?? 50)),
    offset: Math.max(0, offset ?? 0),
  };
}

function buildSiteAssignedUsers(
  siteId: string,
  assignments: SafetyAssignment[],
  usersById: Map<string, import('@/types/backend').SafetyUser>,
): SafetyUserSummary[] {
  return assignments
    .filter((assignment) => assignment.site_id === siteId && assignment.is_active)
    .map((assignment) => usersById.get(assignment.user_id))
    .filter((user): user is import('@/types/backend').SafetyUser => Boolean(user))
    .map((user) => ({
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
    }));
}

function enrichSiteRows(
  sites: SafetySite[],
  assignments: SafetyAssignment[],
  usersById: Map<string, import('@/types/backend').SafetyUser>,
) {
  return sites.map((site) => {
    const assignedUsers = buildSiteAssignedUsers(site.id, assignments, usersById);
    return {
      ...site,
      active_assignment_count: assignedUsers.length,
      assigned_user: assignedUsers[0] ?? site.assigned_user,
      assigned_users: assignedUsers,
    };
  });
}

export function buildAdminDirectoryLookupsResponse(
  snapshot: AdminDirectoryData,
): SafetyAdminDirectoryLookupsResponse {
  return {
    headquarters: snapshot.headquarters.map((headquarter) => ({
      id: headquarter.id,
      name: headquarter.name,
    })),
    sites: snapshot.sites.map((site) => ({
      headquarterId: site.headquarter_id,
      id: site.id,
      name: site.site_name,
    })),
    users: snapshot.users.map((user) => ({
      email: user.email,
      id: user.id,
      isActive: user.is_active,
      name: user.name,
      organizationName: user.organization_name ?? null,
      phone: user.phone ?? null,
      position: user.position ?? null,
      role: user.role,
    })),
  };
}

export function buildAdminUsersListResponse(
  snapshot: AdminDirectoryData,
  filters: {
    limit?: number;
    offset?: number;
    query?: string;
    role?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    status?: string;
  },
): SafetyAdminUserListResponse {
  const { limit, offset } = clampPaging(filters.limit, filters.offset);
  const direction = filters.sortDir === 'desc' ? 'desc' : 'asc';
  const query = normalizeText(filters.query);
  const assignmentsByUserId = new Map<string, SafetyAssignment[]>();
  const sitesById = new Map(snapshot.sites.map((site) => [site.id, site]));

  snapshot.assignments
    .filter((assignment) => assignment.is_active)
    .forEach((assignment) => {
      assignmentsByUserId.set(assignment.user_id, [
        ...(assignmentsByUserId.get(assignment.user_id) ?? []),
        assignment,
      ]);
    });

  const rows = snapshot.users
    .filter((user) => {
      if (filters.role && filters.role !== 'all' && user.role !== filters.role) return false;
      if (filters.status === 'active' && !user.is_active) return false;
      if (filters.status === 'inactive' && user.is_active) return false;
      if (!query) return true;
      const haystack = [
        user.name,
        user.email,
        user.phone ?? '',
        user.position ?? '',
        user.organization_name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    })
    .map((user) => {
      const assignedSites = (assignmentsByUserId.get(user.id) ?? [])
        .map((assignment) => sitesById.get(assignment.site_id))
        .filter((site): site is SafetySite => Boolean(site))
        .map((site) => ({ id: site.id, siteName: site.site_name }));
      return {
        ...user,
        assignedSites,
      } satisfies SafetyAdminUserListRow;
    })
    .sort((left, right) => {
      switch (filters.sortBy) {
        case 'last_login_at':
          return sortText(left.last_login_at ?? '', right.last_login_at ?? '', direction);
        case 'role':
          return sortText(left.role, right.role, direction);
        case 'reportCount':
          return sortNumber(left.assignedSites.length, right.assignedSites.length, direction);
        case 'name':
        default:
          return sortText(left.name, right.name, direction);
      }
    });

  return {
    limit,
    offset,
    refreshedAt: snapshot.refreshedAt,
    rows: rows.slice(offset, offset + limit),
    total: rows.length,
  };
}

function getHeadquarterMissingFields(item: SafetyHeadquarter) {
  return [
    item.management_number,
    item.opening_number,
    item.business_registration_no,
    item.corporate_registration_no,
    item.license_no,
    item.contact_name,
    item.contact_phone,
    item.address,
  ].filter((value) => !String(value ?? '').trim()).length;
}

export function buildAdminHeadquartersListResponse(
  snapshot: AdminDirectoryData,
  filters: {
    id?: string;
    limit?: number;
    offset?: number;
    query?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  },
): SafetyAdminHeadquarterListResponse {
  const { limit, offset } = clampPaging(filters.limit, filters.offset);
  const direction = filters.sortDir === 'desc' ? 'desc' : 'asc';
  const query = normalizeText(filters.query);

  const filteredRows = snapshot.headquarters
    .filter((item) => {
      if (filters.id && item.id !== filters.id) return false;
      if (!query) return true;
      const haystack = [
        item.name,
        item.management_number ?? '',
        item.opening_number ?? '',
        item.business_registration_no ?? '',
        item.corporate_registration_no ?? '',
        item.license_no ?? '',
        item.contact_name ?? '',
        item.contact_phone ?? '',
        item.address ?? '',
        item.memo ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    })
    .sort((left, right) => {
      switch (filters.sortBy) {
        case 'updated_at':
          return sortText(left.updated_at, right.updated_at, direction);
        case 'contact_phone':
          return sortText(left.contact_phone ?? '', right.contact_phone ?? '', direction);
        case 'name':
        default:
          return sortText(left.name, right.name, direction);
      }
    });

  return {
    limit,
    offset,
    refreshedAt: snapshot.refreshedAt,
    rows: filteredRows.slice(offset, offset + limit),
    summary: {
      completedCount: filteredRows.filter((item) => getHeadquarterMissingFields(item) === 0).length,
      contactGapCount: filteredRows.filter((item) =>
        [item.contact_name, item.contact_phone, item.address].some(
          (value) => !String(value ?? '').trim(),
        ),
      ).length,
      memoGapCount: filteredRows.filter((item) => !String(item.memo ?? '').trim()).length,
      registrationGapCount: filteredRows.filter((item) =>
        [item.management_number, item.opening_number, item.business_registration_no].some(
          (value) => !String(value ?? '').trim(),
        ),
      ).length,
    },
    total: filteredRows.length,
  };
}

export function buildAdminSitesListResponse(
  snapshot: AdminDirectoryData,
  filters: {
    assignment?: string;
    headquarterId?: string;
    limit?: number;
    offset?: number;
    query?: string;
    siteId?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    status?: string;
  },
): SafetyAdminSiteListResponse {
  const { limit, offset } = clampPaging(filters.limit, filters.offset);
  const direction = filters.sortDir === 'asc' ? 'asc' : 'desc';
  const query = normalizeText(filters.query);
  const usersById = new Map(snapshot.users.map((user) => [user.id, user]));

  const rows = enrichSiteRows(snapshot.sites, snapshot.assignments, usersById)
    .filter((site) => {
      const normalizedStatus = normalizeSiteStatusForDisplay(site.status);
      const assignedNames = (site.assigned_users ?? []).map((user) => user.name).join(' ');
      if (filters.siteId && site.id !== filters.siteId) return false;
      if (filters.headquarterId && site.headquarter_id !== filters.headquarterId) return false;
      if (filters.status && filters.status !== 'all' && normalizedStatus !== filters.status) return false;
      if (filters.assignment === 'unassigned' && (site.active_assignment_count ?? 0) > 0) return false;
      if (!query) return true;

      const haystack = [
        site.site_name,
        site.headquarter_detail?.management_number ?? '',
        site.project_kind ?? '',
        site.site_address ?? '',
        site.headquarter_detail?.name ?? site.headquarter?.name ?? '',
        site.inspector_name ?? '',
        site.guidance_officer_name ?? '',
        assignedNames,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    })
    .sort((left, right) => {
      switch (filters.sortBy) {
        case 'headquarter_name':
          return sortText(
            left.headquarter_detail?.management_number ?? '',
            right.headquarter_detail?.management_number ?? '',
            direction,
          );
        case 'project_kind':
          return sortText(left.project_kind ?? '', right.project_kind ?? '', direction);
        case 'site_address':
          return sortText(left.site_address ?? '', right.site_address ?? '', direction);
        case 'project_amount':
          return sortNumber(left.project_amount ?? 0, right.project_amount ?? 0, direction);
        case 'status':
          return sortText(
            normalizeSiteStatusForDisplay(left.status),
            normalizeSiteStatusForDisplay(right.status),
            direction,
          );
        case 'last_visit_date':
          return sortText(left.last_visit_date ?? '', right.last_visit_date ?? '', direction);
        case 'site_name':
        default:
          return sortText(left.site_name, right.site_name, direction);
      }
    });

  return {
    limit,
    offset,
    refreshedAt: snapshot.refreshedAt,
    rows: rows.slice(offset, offset + limit),
    total: rows.length,
  };
}
