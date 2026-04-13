'use client';

import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  downloadAdminSiteBasicMaterial,
  exportAdminWorkbook,
} from '@/lib/admin/exportClient';
import { normalizeSiteStatusForDisplay, formatCurrencyValue, getSiteStatusLabel } from '@/lib/admin';
import {
  EMPTY_FORM,
  buildSitePayload,
  buildSiteSortComparator,
  createEditForm,
  isCreateReady,
  type SiteAssignmentFilter,
  type SitesSectionProps,
} from './siteSectionHelpers';
import type { TableSortState } from '@/types/admin';
import type { SafetyAssignment, SafetySiteInput, SafetySiteStatus, SafetySiteUpdateInput } from '@/types/controller';
import type { SafetySite, SafetyUser } from '@/types/backend';

export function useSitesSectionState({
  assignments,
  autoEditSiteId = null,
  busy,
  headquarters,
  initialStatusFilter = 'all',
  lockedHeadquarterId = null,
  onCreate,
  onDelete,
  onSelectSiteEntry,
  onUpdate,
  sites,
  users,
}: Pick<
  SitesSectionProps,
  | 'assignments'
  | 'autoEditSiteId'
  | 'busy'
  | 'headquarters'
  | 'initialStatusFilter'
  | 'lockedHeadquarterId'
  | 'onCreate'
  | 'onDelete'
  | 'onSelectSiteEntry'
  | 'onUpdate'
  | 'sites'
  | 'users'
>) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignmentSiteId, setAssignmentSiteId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SafetySiteStatus>(initialStatusFilter);
  const [sort, setSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'contract_signed_date',
  });
  const [assignmentFilter, setAssignmentFilter] = useState<SiteAssignmentFilter>('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [lastAutoEditSiteId, setLastAutoEditSiteId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const activeAssignmentsBySiteId = useMemo(() => {
    const next = new Map<string, SafetyAssignment[]>();
    assignments.forEach((assignment) => {
      if (!assignment.is_active) return;
      const current = next.get(assignment.site_id) ?? [];
      current.push(assignment);
      next.set(assignment.site_id, current);
    });
    return next;
  }, [assignments]);
  const assignmentSite = sites.find((site) => site.id === assignmentSiteId) || null;
  const currentAssignments = assignmentSiteId ? activeAssignmentsBySiteId.get(assignmentSiteId) ?? [] : [];
  const isOpen = editingId !== null;

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (assignmentFilter !== 'all' ? 1 : 0);

  const filteredSites = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return sites.filter((site) => {
      const siteAssignments = activeAssignmentsBySiteId.get(site.id) ?? [];
      const assignedUsers = siteAssignments
        .map((assignment) => usersById.get(assignment.user_id))
        .filter((user): user is SafetyUser => Boolean(user));
      const fallbackAssignedUser =
        assignedUsers.length === 0 && site.assigned_user
          ? usersById.get(site.assigned_user.id) ?? null
          : null;
      const allAssignedNames = assignedUsers.map((user) => user.name);

      if (fallbackAssignedUser) allAssignedNames.push(fallbackAssignedUser.name);
      const normalizedStatus = normalizeSiteStatusForDisplay(site.status);
      if (statusFilter !== 'all' && normalizedStatus !== statusFilter) return false;
      if (assignmentFilter === 'unassigned' && siteAssignments.length > 0) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        site.site_name,
        site.headquarter_detail?.management_number ?? site.management_number ?? '',
        site.headquarter_detail?.opening_number ?? site.site_code ?? '',
        site.site_address ?? '',
        site.site_contact_email ?? '',
        site.manager_name ?? '',
        site.labor_office ?? '',
        site.guidance_officer_name ?? '',
        site.client_management_number ?? '',
        site.client_business_name ?? '',
        site.headquarter_detail?.name ?? site.headquarter?.name ?? '',
        allAssignedNames.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeAssignmentsBySiteId, assignmentFilter, deferredQuery, sites, statusFilter, usersById]);

  const sortedSites = useMemo(
    () => [...filteredSites].sort(buildSiteSortComparator(sort, activeAssignmentsBySiteId, usersById)),
    [activeAssignmentsBySiteId, filteredSites, sort, usersById],
  );

  const openCreate = () => {
    setEditingId('create');
    setForm({
      ...EMPTY_FORM,
      headquarter_id: lockedHeadquarterId ?? '',
    });
  };

  const openEdit = (site: SafetySite) => {
    setEditingId(site.id);
    setForm(createEditForm(site));
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  useEffect(() => {
    if (!autoEditSiteId || busy || lastAutoEditSiteId === autoEditSiteId) return;
    const matchedSite = sites.find((site) => site.id === autoEditSiteId);
    if (!matchedSite) return;
    openEdit(matchedSite);
    setLastAutoEditSiteId(autoEditSiteId);
  }, [autoEditSiteId, busy, lastAutoEditSiteId, sites]);

  const submit = async () => {
    const payload = buildSitePayload(form, lockedHeadquarterId);
    if (editingId === 'create' && !isCreateReady(form, lockedHeadquarterId)) return;
    if (editingId !== 'create' && (!payload.headquarter_id || !payload.site_name)) return;
    if (editingId === 'create') await onCreate(payload as SafetySiteInput);
    else if (editingId) await onUpdate(editingId, payload as SafetySiteUpdateInput);
    closeModal();
  };

  const deleteSite = async (site: SafetySite) => {
    const confirmed = window.confirm(
      `'${site.site_name}' 현장을 삭제하시겠습니까?\n연결된 현장 배정 정보도 함께 정리되며, 이 작업은 되돌릴 수 없습니다.`,
    );
    if (!confirmed) return;
    await onDelete(site.id);
  };

  const openSiteEntry = (site: SafetySite) => {
    if (onSelectSiteEntry) {
      onSelectSiteEntry(site);
      return;
    }
    router.push(`/sites/${encodeURIComponent(site.id)}`);
  };

  const downloadBasicMaterial = async (site: SafetySite) => {
    try {
      await downloadAdminSiteBasicMaterial(site.id, `${site.site_name}-기초자료.xlsx`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '기초자료 출력에 실패했습니다.');
    }
  };

  const exportSites = () =>
    void exportAdminWorkbook('sites', [
      {
        name: '현장',
        columns: [
          { key: 'site_name', label: '현장명' },
          { key: 'headquarter_name', label: '사업장' },
          { key: 'headquarter_management_number', label: '사업장관리번호' },
          { key: 'headquarter_opening_number', label: '사업장개시번호' },
          { key: 'labor_office', label: '노동관서' },
          { key: 'guidance_officer_name', label: '지도원' },
          { key: 'site_address', label: '소재지' },
          { key: 'site_contact_email', label: '현장대리인 메일' },
          { key: 'is_high_risk_site', label: '고위험 사업장' },
          { key: 'project_amount', label: '공사금액' },
          { key: 'project_start_date', label: '공사시작일' },
          { key: 'project_end_date', label: '공사종료일' },
          { key: 'project_scale', label: '공사규모' },
          { key: 'project_kind', label: '공사종류' },
          { key: 'client_management_number', label: '발주자 사업장관리번호' },
          { key: 'client_business_name', label: '발주자 사업자명' },
          { key: 'client_representative_name', label: '발주자 대표자' },
          { key: 'client_corporate_registration_no', label: '발주자 법인등록번호' },
          { key: 'client_business_registration_no', label: '발주자 사업자등록번호' },
          { key: 'order_type_division', label: '발주유형구분' },
          { key: 'technical_guidance_kind', label: '기술지도 구분' },
          { key: 'total_contract_amount', label: '기술지도 대가' },
          { key: 'total_rounds', label: '기술지도 횟수' },
          { key: 'contract_start_date', label: '계약시작일' },
          { key: 'contract_end_date', label: '계약종료일' },
          { key: 'contract_signed_date', label: '계약 체결일' },
          { key: 'contract_contact_name', label: '계약담당자' },
          { key: 'inspector_name', label: '점검자' },
          { key: 'manager_name', label: '현장책임자명' },
          { key: 'assigned_users', label: '배정 요원' },
          { key: 'status', label: '현장 상태' },
        ],
        rows: sortedSites.map((site) => {
          const siteAssignments = activeAssignmentsBySiteId.get(site.id) ?? [];
          const assignedUsers = siteAssignments
            .map((assignment) => usersById.get(assignment.user_id))
            .filter((user): user is SafetyUser => Boolean(user));

          return {
            assigned_users:
              assignedUsers.length > 0
                ? assignedUsers.map((user) => user.name).join(', ')
                : site.assigned_user?.name || '',
            headquarter_name: site.headquarter_detail?.name || site.headquarter?.name || '',
            headquarter_management_number:
              site.headquarter_detail?.management_number || site.management_number || '',
            headquarter_opening_number:
              site.headquarter_detail?.opening_number || site.site_code || '',
            labor_office: site.labor_office || '',
            guidance_officer_name: site.guidance_officer_name || '',
            site_address: site.site_address || '',
            site_contact_email: site.site_contact_email || '',
            is_high_risk_site: site.is_high_risk_site ? '예' : '아니오',
            project_amount: formatCurrencyValue(site.project_amount),
            project_start_date: site.project_start_date || '',
            project_end_date: site.project_end_date || '',
            project_scale: site.project_scale || '',
            project_kind: site.project_kind || '',
            client_management_number: site.client_management_number || '',
            client_business_name: site.client_business_name || '',
            client_representative_name: site.client_representative_name || '',
            client_corporate_registration_no: site.client_corporate_registration_no || '',
            client_business_registration_no: site.client_business_registration_no || '',
            order_type_division: site.order_type_division || '',
            technical_guidance_kind: site.technical_guidance_kind || '',
            total_contract_amount: formatCurrencyValue(site.total_contract_amount),
            total_rounds: site.total_rounds ?? '',
            contract_start_date: site.contract_start_date || '',
            contract_end_date: site.contract_end_date || '',
            contract_signed_date: site.contract_signed_date || site.contract_date || '',
            contract_contact_name: site.contract_contact_name || '',
            inspector_name: site.inspector_name || '',
            manager_name: site.manager_name || '',
            site_name: site.site_name,
            status: getSiteStatusLabel(site.status),
          };
        }),
      },
    ]);

  const resetHeaderFilters = () => {
    setStatusFilter(initialStatusFilter);
    setAssignmentFilter('all');
  };

  return {
    activeAssignmentsBySiteId,
    activeFilterCount,
    assignmentFilter,
    assignmentSite,
    closeModal,
    currentAssignments,
    deleteSite,
    downloadBasicMaterial,
    editingId,
    exportSites,
    form,
    headquarters,
    isCreateReady: isCreateReady(form, lockedHeadquarterId),
    isOpen,
    lockedHeadquarterId,
    openAssignmentModal: setAssignmentSiteId,
    openCreate,
    openEdit,
    openSiteEntry,
    query,
    resetHeaderFilters,
    setAssignmentFilter,
    setAssignmentSiteId,
    setForm,
    setQuery,
    setSort,
    setStatusFilter,
    sortedSites,
    sort,
    statusFilter,
    submit,
    updateStatus: (site: SafetySite, status: SafetySiteStatus) => onUpdate(site.id, { status }),
    users,
    usersById,
  };
}
