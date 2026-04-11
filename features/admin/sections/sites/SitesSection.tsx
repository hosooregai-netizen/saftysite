'use client';

import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import ActionMenu from '@/components/ui/ActionMenu';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  getSiteStatusLabel,
  normalizeSiteStatusForDisplay,
  SITE_STATUS_OPTIONS,
  formatCurrencyValue,
  formatTimestamp,
  getAdminSectionHref,
  parseOptionalNumber,
  toNullableText,
} from '@/lib/admin';
import {
  downloadAdminSiteBasicMaterial,
  exportAdminWorkbook,
} from '@/lib/admin/exportClient';
import { parseSiteRequiredCompletionFields } from '@/lib/admin/siteContractProfile';
import type { TableSortState } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type {
  SafetyAssignment,
  SafetyHeadquarter,
  SafetySiteInput,
  SafetySiteStatus,
  SafetySiteUpdateInput,
} from '@/types/controller';
import { SiteAssignmentModal } from './SiteAssignmentModal';

interface SitesSectionProps {
  busy: boolean;
  assignments: SafetyAssignment[];
  headquarters: SafetyHeadquarter[];
  sites: SafetySite[];
  users: SafetyUser[];
  canDelete: boolean;
  onCreate: (input: SafetySiteInput) => Promise<void>;
  onUpdate: (id: string, input: SafetySiteUpdateInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAssignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  onUnassignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  title?: string;
  emptyMessage?: string;
  showHeader?: boolean;
  showHeadquarterColumn?: boolean;
  lockedHeadquarterId?: string | null;
  onSelectSiteEntry?: (site: SafetySite) => void;
  initialStatusFilter?: 'all' | SafetySiteStatus;
  autoEditSiteId?: string | null;
}

interface SiteFormState {
  headquarter_id: string;
  site_name: string;
  status: SafetySiteStatus;
  labor_office: string;
  guidance_officer_name: string;
  site_address: string;
  site_contact_email: string;
  is_high_risk_site: boolean;
  project_amount: string;
  project_start_date: string;
  project_end_date: string;
  project_scale: string;
  project_kind: string;
  client_management_number: string;
  client_business_name: string;
  client_representative_name: string;
  client_corporate_registration_no: string;
  client_business_registration_no: string;
  order_type_division: string;
  technical_guidance_kind: string;
  total_contract_amount: string;
  total_rounds: string;
  contract_start_date: string;
  contract_end_date: string;
  contract_signed_date: string;
  contract_contact_name: string;
  inspector_name: string;
  manager_name: string;
}

const EMPTY_FORM: SiteFormState = {
  headquarter_id: '',
  site_name: '',
  status: 'planned',
  labor_office: '',
  guidance_officer_name: '',
  site_address: '',
  site_contact_email: '',
  is_high_risk_site: false,
  project_amount: '',
  project_start_date: '',
  project_end_date: '',
  project_scale: '',
  project_kind: '',
  client_management_number: '',
  client_business_name: '',
  client_representative_name: '',
  client_corporate_registration_no: '',
  client_business_registration_no: '',
  order_type_division: '',
  technical_guidance_kind: '',
  total_contract_amount: '',
  total_rounds: '',
  contract_start_date: '',
  contract_end_date: '',
  contract_signed_date: '',
  contract_contact_name: '',
  inspector_name: '',
  manager_name: '',
};

function formatAssignedUsers(users: SafetyUser[]) {
  if (users.length === 0) return '-';
  return users.map((user) => user.name).join(', ');
}

function shouldIgnoreRowClick(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'a, button, input, select, textarea, [role="button"], [role="menu"], [role="menuitem"]',
      ),
    )
  );
}

function isPinnedTestSite(site: SafetySite) {
  const labels = [
    site.site_name,
    site.headquarter_detail?.name,
    site.headquarter?.name,
  ]
    .filter(Boolean)
    .join(' ');
  return labels.includes('테스트');
}

type SiteAssignmentFilter = 'all' | 'unassigned';

export function SitesSection(props: SitesSectionProps) {
  const {
    assignments,
    busy,
    headquarters,
    sites,
    users,
    canDelete,
    onCreate,
    onUpdate,
    onDelete,
    onAssignFieldAgent,
    onUnassignFieldAgent,
    showHeader = true,
    title = '현장 목록',
    emptyMessage = '등록된 현장이 없습니다.',
    showHeadquarterColumn = true,
    lockedHeadquarterId = null,
    onSelectSiteEntry,
    initialStatusFilter = 'all',
    autoEditSiteId = null,
  } = props;
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
  const isOpen = editingId !== null;
  const assignmentSite = sites.find((site) => site.id === assignmentSiteId) || null;
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
  const currentAssignments = assignmentSiteId
    ? activeAssignmentsBySiteId.get(assignmentSiteId) ?? []
    : [];
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (assignmentFilter !== 'all' ? 1 : 0);
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
  const sortedSites = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1;

    return [...filteredSites].sort((left, right) => {
      const leftPinned = isPinnedTestSite(left);
      const rightPinned = isPinnedTestSite(right);
      if (leftPinned !== rightPinned) {
        return leftPinned ? -1 : 1;
      }

      if (sort.key === 'headquarter_name') {
        return (
          (left.headquarter_detail?.name || left.headquarter?.name || '').localeCompare(
            right.headquarter_detail?.name || right.headquarter?.name || '',
            'ko',
          ) * direction
        );
      }

      if (sort.key === 'manager_name') {
        return (left.manager_name ?? '').localeCompare(right.manager_name ?? '', 'ko') * direction;
      }

      if (sort.key === 'assigned_users') {
        const getAssignedLabel = (site: SafetySite) => {
          const assignmentsForSite = activeAssignmentsBySiteId.get(site.id) ?? [];
          const assignedUsers = assignmentsForSite
            .map((assignment) => usersById.get(assignment.user_id)?.name || '')
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, 'ko'));
          if (assignedUsers.length > 0) {
            return assignedUsers.join(', ');
          }
          return site.assigned_user?.name || '';
        };
        return getAssignedLabel(left).localeCompare(getAssignedLabel(right), 'ko') * direction;
      }

      if (sort.key === 'status') {
        return left.status.localeCompare(right.status, 'ko') * direction;
      }

      if (sort.key === 'project_end_date') {
        return (left.project_end_date ?? '').localeCompare(right.project_end_date ?? '') * direction;
      }

      if (sort.key === 'contract_end_date') {
        return (left.contract_end_date ?? '').localeCompare(right.contract_end_date ?? '') * direction;
      }

      if (sort.key === 'contract_signed_date') {
        const leftValue = left.contract_signed_date ?? left.contract_date ?? '';
        const rightValue = right.contract_signed_date ?? right.contract_date ?? '';
        return leftValue.localeCompare(rightValue) * direction;
      }

      if (sort.key === 'updated_at') {
        return (left.updated_at ?? '').localeCompare(right.updated_at ?? '') * direction;
      }

      if (sort.key === 'project_amount') {
        return ((left.project_amount ?? 0) - (right.project_amount ?? 0)) * direction;
      }

      return left.site_name.localeCompare(right.site_name, 'ko') * direction;
    });
  }, [activeAssignmentsBySiteId, filteredSites, sort.direction, sort.key, usersById]);

  const openCreate = () => {
    setEditingId('create');
    setForm({
      ...EMPTY_FORM,
      headquarter_id: lockedHeadquarterId ?? '',
    });
  };

  const openEdit = (site: SafetySite) => {
    setEditingId(site.id);
    setForm({
      headquarter_id: site.headquarter_id,
      site_name: site.site_name,
      status: normalizeSiteStatusForDisplay(site.status),
      labor_office: site.labor_office ?? '',
      guidance_officer_name: site.guidance_officer_name ?? '',
      site_address: site.site_address ?? '',
      project_amount: site.project_amount ? String(site.project_amount) : '',
      project_start_date: site.project_start_date ?? '',
      project_end_date: site.project_end_date ?? '',
      project_scale: site.project_scale ?? '',
      project_kind: site.project_kind ?? '',
      site_contact_email: site.site_contact_email ?? '',
      is_high_risk_site: Boolean(site.is_high_risk_site),
      client_management_number: site.client_management_number ?? '',
      client_business_name: site.client_business_name ?? '',
      client_representative_name: site.client_representative_name ?? '',
      client_corporate_registration_no: site.client_corporate_registration_no ?? '',
      client_business_registration_no: site.client_business_registration_no ?? '',
      order_type_division: site.order_type_division ?? '',
      technical_guidance_kind: site.technical_guidance_kind ?? '',
      total_contract_amount:
        site.total_contract_amount != null ? String(site.total_contract_amount) : '',
      total_rounds: site.total_rounds != null ? String(site.total_rounds) : '',
      contract_start_date: site.contract_start_date ?? '',
      contract_end_date: site.contract_end_date ?? '',
      contract_signed_date: site.contract_signed_date ?? site.contract_date ?? '',
      contract_contact_name: site.contract_contact_name ?? '',
      inspector_name: site.inspector_name ?? '',
      manager_name: site.manager_name ?? '',
    });
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

  const buildPayload = () => {
    return {
      headquarter_id: lockedHeadquarterId ?? form.headquarter_id,
      site_name: form.site_name.trim(),
      status: form.status,
      labor_office: toNullableText(form.labor_office),
      guidance_officer_name: toNullableText(form.guidance_officer_name),
      site_address: toNullableText(form.site_address),
      site_contact_email: toNullableText(form.site_contact_email),
      is_high_risk_site: form.is_high_risk_site,
      project_amount: parseOptionalNumber(form.project_amount),
      project_start_date: toNullableText(form.project_start_date),
      project_end_date: toNullableText(form.project_end_date),
      project_scale: toNullableText(form.project_scale),
      project_kind: toNullableText(form.project_kind),
      client_management_number: toNullableText(form.client_management_number),
      client_business_name: toNullableText(form.client_business_name),
      client_representative_name: toNullableText(form.client_representative_name),
      client_corporate_registration_no: toNullableText(form.client_corporate_registration_no),
      client_business_registration_no: toNullableText(form.client_business_registration_no),
      order_type_division: toNullableText(form.order_type_division),
      technical_guidance_kind: toNullableText(form.technical_guidance_kind),
      manager_name: toNullableText(form.manager_name),
      inspector_name: toNullableText(form.inspector_name),
      contract_contact_name: toNullableText(form.contract_contact_name),
      contract_start_date: toNullableText(form.contract_start_date),
      contract_end_date: toNullableText(form.contract_end_date),
      contract_signed_date: toNullableText(form.contract_signed_date),
      total_rounds: (() => {
        const parsed = parseOptionalNumber(form.total_rounds);
        return typeof parsed === 'number' && Number.isFinite(parsed) ? Math.trunc(parsed) : null;
      })(),
      total_contract_amount: parseOptionalNumber(form.total_contract_amount),
    };
  };

  const isCreateReady = Boolean(
    (lockedHeadquarterId ?? form.headquarter_id).trim() &&
      form.site_name.trim(),
  );

  const submit = async () => {
    const payload = buildPayload();
    if (editingId === 'create' && !isCreateReady) return;
    if (editingId !== 'create' && (!payload.headquarter_id || !payload.site_name)) return;
    if (editingId === 'create') await onCreate(payload);
    else if (editingId) await onUpdate(editingId, payload);
    closeModal();
  };

  const handleDeleteSite = async (site: SafetySite) => {
    const confirmed = window.confirm(
      `'${site.site_name}' 현장을 삭제하시겠습니까?\n연결된 현장 배정 정보도 함께 정리되며, 이 작업은 되돌릴 수 없습니다.`,
    );

    if (!confirmed) return;
    await onDelete(site.id);
  };

  const handleOpenSiteEntry = (site: SafetySite) => {
    if (onSelectSiteEntry) {
      onSelectSiteEntry(site);
      return;
    }

    router.push(`/sites/${encodeURIComponent(site.id)}`);
  };
  const handleDownloadBasicMaterial = async (site: SafetySite) => {
    try {
      await downloadAdminSiteBasicMaterial(site.id, `${site.site_name}-기초자료.xlsx`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '기초자료 출력에 실패했습니다.');
    }
  };
  const handleExport = () =>
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
            headquarter_name:
              site.headquarter_detail?.name || site.headquarter?.name || '',
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

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        {showHeader ? (
          <div className={styles.sectionHeaderTitleBlock}>
            <h2 className={styles.sectionTitle}>{title}</h2>
          </div>
        ) : (
          <div className={styles.sectionHeaderSpacer} />
        )}
        <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
          <input
            className={`app-input ${styles.sectionHeaderSearch} ${styles.sectionHeaderToolbarSearch}`}
            placeholder="현장명, 사업장명, 노동관서, 지도원, 발주자명, 계약담당자, 점검자로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <SectionHeaderFilterMenu
            activeCount={activeFilterCount}
            ariaLabel="현장 목록 필터"
            onReset={resetHeaderFilters}
          >
            <div className={styles.sectionHeaderMenuGrid}>
              <div className={styles.sectionHeaderMenuField}>
                <label htmlFor="site-filter-status">현장 상태</label>
                <select
                  id="site-filter-status"
                  className="app-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'all' | SafetySiteStatus)}
                >
                  <option value="all">전체 상태</option>
                  {SITE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.sectionHeaderMenuField}>
                <label htmlFor="site-filter-assignment">배정 상태</label>
                <select
                  id="site-filter-assignment"
                  className="app-select"
                  value={assignmentFilter}
                  onChange={(event) =>
                    setAssignmentFilter(event.target.value as SiteAssignmentFilter)
                  }
                >
                  <option value="all">전체 배정</option>
                  <option value="unassigned">미배정만</option>
                </select>
              </div>
            </div>
          </SectionHeaderFilterMenu>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={handleExport}
            disabled={busy}
          >
            엑셀 내보내기
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={openCreate}
            disabled={busy}
          >
            현장 추가
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {sortedSites.length === 0 ? (
            <div className={styles.tableEmpty}>{emptyMessage}</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <SortableHeaderCell
                      column={{ key: 'site_name' }}
                      current={sort}
                      label="현장명"
                      onChange={setSort}
                      sortMenuOptions={buildSortMenuOptions('site_name', {
                        asc: '현장 가나다순',
                        desc: '현장 역순',
                      })}
                    />
                    {showHeadquarterColumn ? (
                      <SortableHeaderCell
                        column={{ key: 'headquarter_name' }}
                        current={sort}
                        label="사업장"
                        onChange={setSort}
                        sortMenuOptions={buildSortMenuOptions('headquarter_name', {
                          asc: '사업장 가나다순',
                          desc: '사업장 역순',
                        })}
                      />
                    ) : null}
                    <SortableHeaderCell
                      column={{ key: 'contract_signed_date' }}
                      current={sort}
                      defaultDirection="desc"
                      label="계약 / 기술지도"
                      onChange={setSort}
                      sortMenuOptions={buildSortMenuOptions('contract_signed_date', {
                        asc: '계약 체결일 오래된순',
                        desc: '계약 체결일 최신순',
                      })}
                    />
                    <SortableHeaderCell
                      column={{ key: 'manager_name' }}
                      current={sort}
                      label="운영 담당"
                      onChange={setSort}
                      sortMenuOptions={buildSortMenuOptions('manager_name', {
                        asc: '운영 담당 가나다순',
                        desc: '운영 담당 역순',
                      })}
                    />
                    <SortableHeaderCell
                      column={{ key: 'updated_at' }}
                      current={sort}
                      defaultDirection="desc"
                      label="수정일"
                      onChange={setSort}
                    />
                    <SortableHeaderCell
                      column={{ key: 'status' }}
                      current={sort}
                      label="상태"
                      onChange={setSort}
                      sortMenuOptions={buildSortMenuOptions('status', {
                        asc: '상태 오름차순',
                        desc: '상태 내림차순',
                      })}
                    />
                    <th>메뉴</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSites.map((site) => {
                    const siteAssignments = activeAssignmentsBySiteId.get(site.id) ?? [];
                    const requiredCompletionFields =
                      site.required_completion_fields?.length
                        ? site.required_completion_fields
                        : parseSiteRequiredCompletionFields(site);
                    const assignedUsers = siteAssignments
                      .map((assignment) => usersById.get(assignment.user_id))
                      .filter((user): user is SafetyUser => Boolean(user));
                    const fallbackAssignedUsers =
                      assignedUsers.length === 0 && site.assigned_user
                        ? [usersById.get(site.assigned_user.id) ?? site.assigned_user].filter(Boolean)
                        : [];

                    return (
                      <tr
                        key={site.id}
                        className={styles.tableClickableRow}
                        tabIndex={busy ? -1 : 0}
                        role="link"
                        onClick={(event) => {
                          if (busy || shouldIgnoreRowClick(event.target)) return;
                          handleOpenSiteEntry(site);
                        }}
                        onKeyDown={(event) => {
                          if (busy || shouldIgnoreRowClick(event.target)) return;
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          handleOpenSiteEntry(site);
                        }}
                      >
                        <td>
                          <div className={styles.tablePrimary}>{site.site_name}</div>
                          <div className={styles.tableSecondary}>
                            {site.site_address || '주소 미입력'}
                          </div>
                          <div className={styles.tableSecondary}>
                            현장대리인 메일 {site.site_contact_email || '미등록'}
                            {site.is_high_risk_site ? ' / 고위험 사업장' : ''}
                          </div>
                          {requiredCompletionFields.length ? (
                            <div className={styles.tableSecondary}>
                              <span className="app-chip">
                                보완 필요 {requiredCompletionFields.length}건
                              </span>
                              {' '}
                              {requiredCompletionFields.join(', ')}
                            </div>
                          ) : null}
                        </td>
                        {showHeadquarterColumn ? (
                          <td>
                            <div className={styles.tablePrimary}>
                              {site.headquarter_detail?.name || site.headquarter?.name || '-'}
                            </div>
                            <div className={styles.tableSecondary}>
                              관리번호 {site.headquarter_detail?.management_number || site.management_number || '-'}
                            </div>
                            <div className={styles.tableSecondary}>
                              개시번호 {site.headquarter_detail?.opening_number || site.site_code || '-'}
                            </div>
                          </td>
                        ) : null}
                        <td>
                          <div className={styles.tablePrimary}>
                            계약 {site.contract_start_date || '-'} ~ {site.contract_end_date || '-'}
                          </div>
                          <div className={styles.tableSecondary}>
                            체결일 {site.contract_signed_date || site.contract_date || '-'}
                          </div>
                          <div className={styles.tableSecondary}>
                            기술지도 대가 {formatCurrencyValue(site.total_contract_amount)} / 횟수 {site.total_rounds ?? '-'}
                          </div>
                          <div className={styles.tableSecondary}>
                            구분 {site.technical_guidance_kind || '-'} / 공사금액 {formatCurrencyValue(site.project_amount)}
                          </div>
                        </td>
                        <td>
                          <div className={styles.tablePrimary}>
                            지도원 {site.guidance_officer_name || '-'} / 노동관서 {site.labor_office || '-'}
                          </div>
                          <div className={styles.tableSecondary}>
                            점검자 {site.inspector_name || '-'} / 계약담당자 {site.contract_contact_name || '-'}
                          </div>
                          <div className={styles.tableSecondary}>
                            현장책임자 {site.manager_name || '-'} / 배정요원{' '}
                            {assignedUsers.length > 0
                              ? formatAssignedUsers(assignedUsers)
                              : fallbackAssignedUsers.length > 0
                                ? fallbackAssignedUsers.map((user) => user.name).join(', ')
                                : '-'}
                          </div>
                          <div className={styles.tableSecondary}>
                            현장대리인 메일 {site.site_contact_email || '미등록'}
                          </div>
                          <div className={styles.tableSecondary}>
                            발주자 {site.client_business_name || '-'} / 대표 {site.client_representative_name || '-'}
                          </div>
                        </td>
                        <td>
                          {formatTimestamp(site.updated_at)}
                        </td>
                        <td>
                          {getSiteStatusLabel(site.status)}
                        </td>
                        <td>
                          <div
                            className={styles.tableActionMenuWrap}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <ActionMenu
                              label={`${site.site_name} 현장 작업 메뉴 열기`}
                              items={[
                                ...(onSelectSiteEntry
                                  ? [
                                      {
                                        label: '현장 메인',
                                        onSelect: () => handleOpenSiteEntry(site),
                                      },
                                    ]
                                  : [
                                      {
                                        label: '보고서',
                                        href: `/sites/${encodeURIComponent(site.id)}`,
                                      },
                                    ]),
                                {
                                  label: '지도요원 배정',
                                  onSelect: () => {
                                    if (!busy) setAssignmentSiteId(site.id);
                                  },
                                },
                                {
                                  label: '사진첩 보기',
                                  href: getAdminSectionHref('photos', {
                                    headquarterId: site.headquarter_id,
                                    siteId: site.id,
                                  }),
                                },
                                {
                                  label: '기초자료 출력',
                                  onSelect: () => {
                                    if (!busy) void handleDownloadBasicMaterial(site);
                                  },
                                },
                                {
                                  label: '수정',
                                  onSelect: () => {
                                    if (!busy) openEdit(site);
                                  },
                                },
                                ...SITE_STATUS_OPTIONS.filter(
                                  (option) =>
                                    option.value !== normalizeSiteStatusForDisplay(site.status),
                                ).map((option) => ({
                                  label: `상태 변경: ${option.label}`,
                                  onSelect: () => {
                                    if (!busy) void onUpdate(site.id, { status: option.value });
                                  },
                                })),
                                ...(canDelete
                                  ? [
                                      {
                                        label: '삭제',
                                        tone: 'danger' as const,
                                        onSelect: () => {
                                          if (!busy) void handleDeleteSite(site);
                                        },
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AppModal
        open={isOpen}
        title={editingId === 'create' ? '현장 추가' : '현장 수정'}
        size="large"
        onClose={closeModal}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeModal}
              disabled={busy}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void submit()}
              disabled={busy || (editingId === 'create' && !isCreateReady)}
            >
              {editingId === 'create' ? '생성' : '저장'}
            </button>
          </>
        }
      >
        <div className={styles.modalGrid}>
          <label className={styles.modalField}>
            <span className={styles.label}>사업장</span>
            <select
              className="app-select"
              value={lockedHeadquarterId ?? form.headquarter_id}
              onChange={(e) => setForm({ ...form, headquarter_id: e.target.value })}
              disabled={busy || Boolean(lockedHeadquarterId)}
            >
              <option value="">선택</option>
              {headquarters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>현장명</span>
            <input
              className="app-input"
              value={form.site_name}
              onChange={(e) => setForm({ ...form, site_name: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>현장 상태</span>
            <select
              className="app-select"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as SafetySiteStatus })
              }
              disabled={busy}
            >
              {SITE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>노동관서</span>
            <input
              className="app-input"
              value={form.labor_office}
              onChange={(e) => setForm({ ...form, labor_office: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>지도원</span>
            <input
              className="app-input"
              value={form.guidance_officer_name}
              onChange={(e) => setForm({ ...form, guidance_officer_name: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalFieldWide}>
            <span className={styles.label}>소재지</span>
            <input
              className="app-input"
              value={form.site_address}
              onChange={(e) => setForm({ ...form, site_address: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>현장대리인 메일</span>
            <input
              className="app-input"
              type="email"
              value={form.site_contact_email}
              onChange={(e) => setForm({ ...form, site_contact_email: e.target.value })}
              disabled={busy}
              placeholder="site@example.com"
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>고위험 사업장</span>
            <select
              className="app-select"
              value={form.is_high_risk_site ? 'yes' : 'no'}
              onChange={(e) =>
                setForm({ ...form, is_high_risk_site: e.target.value === 'yes' })
              }
              disabled={busy}
            >
              <option value="no">일반</option>
              <option value="yes">고위험</option>
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>공사금액</span>
            <input
              className="app-input"
              value={form.project_amount}
              onChange={(e) => setForm({ ...form, project_amount: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>공사시작일</span>
            <input
              className="app-input"
              type="date"
              value={form.project_start_date}
              onChange={(e) => setForm({ ...form, project_start_date: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>공사종료일</span>
            <input
              className="app-input"
              type="date"
              value={form.project_end_date}
              onChange={(e) => setForm({ ...form, project_end_date: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>공사규모</span>
            <input
              className="app-input"
              value={form.project_scale}
              onChange={(e) => setForm({ ...form, project_scale: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>공사종류</span>
            <input
              className="app-input"
              value={form.project_kind}
              onChange={(e) => setForm({ ...form, project_kind: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>발주자 사업장관리번호</span>
            <input
              className="app-input"
              value={form.client_management_number}
              onChange={(e) => setForm({ ...form, client_management_number: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>발주자 사업자명</span>
            <input
              className="app-input"
              value={form.client_business_name}
              onChange={(e) => setForm({ ...form, client_business_name: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>발주자 대표자</span>
            <input
              className="app-input"
              value={form.client_representative_name}
              onChange={(e) => setForm({ ...form, client_representative_name: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>발주자법인등록번호</span>
            <input
              className="app-input"
              value={form.client_corporate_registration_no}
              onChange={(e) =>
                setForm({ ...form, client_corporate_registration_no: e.target.value })
              }
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>발주자 사업자등록번호</span>
            <input
              className="app-input"
              value={form.client_business_registration_no}
              onChange={(e) =>
                setForm({ ...form, client_business_registration_no: e.target.value })
              }
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>발주유형구분</span>
            <input
              className="app-input"
              value={form.order_type_division}
              onChange={(e) => setForm({ ...form, order_type_division: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>기술지도 구분</span>
            <input
              className="app-input"
              value={form.technical_guidance_kind}
              onChange={(e) => setForm({ ...form, technical_guidance_kind: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>기술지도 대가</span>
            <input
              className="app-input"
              value={form.total_contract_amount}
              onChange={(e) => setForm({ ...form, total_contract_amount: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>기술지도 횟수</span>
            <input
              className="app-input"
              value={form.total_rounds}
              onChange={(e) => setForm({ ...form, total_rounds: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>계약시작일</span>
            <input
              className="app-input"
              type="date"
              value={form.contract_start_date}
              onChange={(e) => setForm({ ...form, contract_start_date: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>계약종료일</span>
            <input
              className="app-input"
              type="date"
              value={form.contract_end_date}
              onChange={(e) => setForm({ ...form, contract_end_date: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>계약 체결일</span>
            <input
              className="app-input"
              type="date"
              value={form.contract_signed_date}
              onChange={(e) => setForm({ ...form, contract_signed_date: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>계약담당자</span>
            <input
              className="app-input"
              value={form.contract_contact_name}
              onChange={(e) => setForm({ ...form, contract_contact_name: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>점검자</span>
            <input
              className="app-input"
              value={form.inspector_name}
              onChange={(e) => setForm({ ...form, inspector_name: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>현장책임자명</span>
            <input
              className="app-input"
              value={form.manager_name}
              onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
              disabled={busy}
            />
          </label>
        </div>
      </AppModal>

      <SiteAssignmentModal
        open={Boolean(assignmentSite)}
        busy={busy}
        site={assignmentSite}
        users={users}
        currentAssignments={currentAssignments}
        onClose={() => setAssignmentSiteId(null)}
        onAssign={async (siteId, userId) => {
          await onAssignFieldAgent(siteId, userId);
        }}
        onClear={async (siteId, userId) => {
          await onUnassignFieldAgent(siteId, userId);
        }}
      />
    </section>
  );
}
