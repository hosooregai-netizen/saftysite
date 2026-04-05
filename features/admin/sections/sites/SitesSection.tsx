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
  SITE_CONTRACT_STATUS_LABELS,
  SITE_CONTRACT_STATUS_OPTIONS,
  SITE_CONTRACT_TYPE_LABELS,
  SITE_CONTRACT_TYPE_OPTIONS,
  SITE_STATUS_LABELS,
  SITE_STATUS_OPTIONS,
  formatCurrencyValue,
  getAdminSectionHref,
  parseOptionalNumber,
  toNullableText,
} from '@/lib/admin';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import {
  buildSiteMemoWithContractProfile,
  parseSiteContractProfile,
  parseSiteRequiredCompletionFields,
  parseSiteMemoNote,
} from '@/lib/admin/siteContractProfile';
import type {
  SiteContractStatus,
  SiteContractType,
  TableSortState,
} from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SafetyAssignment, SafetyHeadquarter, SafetySiteStatus } from '@/types/controller';
import { SiteAssignmentModal } from './SiteAssignmentModal';

interface SitesSectionProps {
  busy: boolean;
  assignments: SafetyAssignment[];
  headquarters: SafetyHeadquarter[];
  sites: SafetySite[];
  users: SafetyUser[];
  canDelete: boolean;
  onCreate: (input: {
    headquarter_id: string;
    site_name: string;
    site_code?: string | null;
    management_number?: string | null;
    project_start_date?: string | null;
    project_end_date?: string | null;
    project_amount?: number | null;
    manager_name?: string | null;
    manager_phone?: string | null;
    site_address?: string | null;
    memo?: string | null;
    status?: 'planned' | 'active' | 'closed';
  }) => Promise<void>;
  onUpdate: (id: string, input: Partial<{
    headquarter_id: string;
    site_name: string;
    site_code?: string | null;
    management_number?: string | null;
    project_start_date?: string | null;
    project_end_date?: string | null;
    project_amount?: number | null;
    manager_name?: string | null;
    manager_phone?: string | null;
    site_address?: string | null;
    memo?: string | null;
    status?: SafetySiteStatus;
  }>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAssignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  onUnassignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  onExcelUploadRequest?: (context?: {
    headquarterId?: string | null;
    siteId?: string | null;
  }) => void;
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
  project_start_date: string;
  project_end_date: string;
  project_amount: string;
  manager_name: string;
  manager_phone: string;
  memo_note: string;
  contract_date: string;
  contract_type: SiteContractType;
  contract_status: SiteContractStatus;
  total_rounds: string;
  per_visit_amount: string;
  total_contract_amount: string;
  site_number: string;
  site_address: string;
}

const EMPTY_FORM: SiteFormState = {
  headquarter_id: '',
  site_name: '',
  status: 'planned',
  project_start_date: '',
  project_end_date: '',
  project_amount: '',
  manager_name: '',
  manager_phone: '',
  memo_note: '',
  contract_date: '',
  contract_type: '',
  contract_status: '',
  total_rounds: '',
  per_visit_amount: '',
  total_contract_amount: '',
  site_number: '',
  site_address: '',
};

function formatAssignedUsers(users: SafetyUser[]) {
  if (users.length === 0) return '-';
  return users.map((user) => user.name).join(', ');
}

function formatAssignedUserDetails(users: SafetyUser[]) {
  if (users.length === 0) return '배정 정보 없음';
  return users
    .map((user) => [user.position || '직책 미입력', user.organization_name || '소속 미입력'].join(' · '))
    .join(' / ');
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

function normalizeSiteStatus(value: string | null | undefined): SafetySiteStatus {
  return value === 'planned' || value === 'active' || value === 'closed' ? value : 'active';
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
    onExcelUploadRequest,
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
    direction: 'asc',
    key: 'site_name',
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
      if (statusFilter !== 'all' && site.status !== statusFilter) return false;
      if (assignmentFilter === 'unassigned' && siteAssignments.length > 0) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        site.site_name,
        site.site_code ?? '',
        site.management_number ?? '',
        site.site_address ?? '',
        site.manager_name ?? '',
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
    const contractProfile = parseSiteContractProfile(site);
    setEditingId(site.id);
    setForm({
      headquarter_id: site.headquarter_id,
      site_name: site.site_name,
      status: normalizeSiteStatus(site.status),
      project_start_date: site.project_start_date ?? '',
      project_end_date: site.project_end_date ?? '',
      project_amount: site.project_amount ? String(site.project_amount) : '',
      manager_name: site.manager_name ?? '',
      manager_phone: site.manager_phone ?? '',
      memo_note: parseSiteMemoNote(site.memo),
      contract_date: contractProfile.contractDate,
      contract_type: contractProfile.contractType,
      contract_status: contractProfile.contractStatus,
      total_rounds:
        contractProfile.totalRounds != null ? String(contractProfile.totalRounds) : '',
      per_visit_amount:
        contractProfile.perVisitAmount != null
          ? String(contractProfile.perVisitAmount)
          : '',
      total_contract_amount:
        contractProfile.totalContractAmount != null
          ? String(contractProfile.totalContractAmount)
          : '',
      site_number: site.management_number ?? site.site_code ?? '',
      site_address: site.site_address ?? '',
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
    const currentSite = editingId ? sites.find((site) => site.id === editingId) ?? null : null;

    return {
      headquarter_id: lockedHeadquarterId ?? form.headquarter_id,
      site_name: form.site_name.trim(),
      status: form.status,
      site_code: toNullableText(form.site_number),
      management_number: toNullableText(form.site_number),
      project_start_date: toNullableText(form.project_start_date),
      project_end_date: toNullableText(form.project_end_date),
      project_amount: parseOptionalNumber(form.project_amount),
      manager_name: toNullableText(form.manager_name),
      manager_phone: toNullableText(form.manager_phone),
      site_address: toNullableText(form.site_address),
      memo: buildSiteMemoWithContractProfile(
        form.memo_note,
        {
          contractDate: form.contract_date.trim(),
          contractStatus: form.contract_status,
          contractType: form.contract_type,
          perVisitAmount: parseOptionalNumber(form.per_visit_amount),
          totalContractAmount: parseOptionalNumber(form.total_contract_amount),
          totalRounds: (() => {
            const parsed = parseOptionalNumber(form.total_rounds);
            return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0
              ? Math.trunc(parsed)
              : null;
          })(),
        },
        {
          existingMemo: currentSite?.memo ?? null,
        },
      ),
    };
  };

  const isCreateReady = Boolean(
    (lockedHeadquarterId ?? form.headquarter_id).trim() &&
      form.site_name.trim() &&
      form.site_number.trim() &&
      form.project_start_date.trim() &&
      form.project_amount.trim() &&
      form.project_end_date.trim() &&
      form.manager_name.trim() &&
      form.manager_phone.trim() &&
      form.site_address.trim(),
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
  const handleExport = () =>
    void exportAdminWorkbook('sites', [
      {
        name: '현장',
        columns: [
          { key: 'site_name', label: '현장명' },
          { key: 'headquarter_name', label: '사업장' },
          { key: 'manager_name', label: '책임자' },
          { key: 'manager_phone', label: '책임자 연락처' },
          { key: 'assigned_users', label: '배정 요원' },
          { key: 'project_period', label: '공사기간' },
          { key: 'project_amount', label: '공사금액' },
          { key: 'contract_type', label: '계약유형' },
          { key: 'contract_status', label: '계약상태' },
          { key: 'contract_date', label: '계약일' },
          { key: 'total_rounds', label: '총 회차' },
          { key: 'per_visit_amount', label: '회차당 단가' },
          { key: 'total_contract_amount', label: '총 계약금액' },
          { key: 'status', label: '현장 상태' },
        ],
        rows: sortedSites.map((site) => {
          const contractProfile = parseSiteContractProfile(site);
          const siteAssignments = activeAssignmentsBySiteId.get(site.id) ?? [];
          const assignedUsers = siteAssignments
            .map((assignment) => usersById.get(assignment.user_id))
            .filter((user): user is SafetyUser => Boolean(user));

          return {
            assigned_users:
              assignedUsers.length > 0
                ? assignedUsers.map((user) => user.name).join(', ')
                : site.assigned_user?.name || '',
            contract_date: contractProfile.contractDate,
            contract_status:
              SITE_CONTRACT_STATUS_LABELS[contractProfile.contractStatus] || '',
            contract_type:
              SITE_CONTRACT_TYPE_LABELS[contractProfile.contractType] || '',
            headquarter_name:
              site.headquarter_detail?.name || site.headquarter?.name || '',
            manager_name: site.manager_name || '',
            manager_phone: site.manager_phone || '',
            per_visit_amount: formatCurrencyValue(contractProfile.perVisitAmount),
            project_amount: formatCurrencyValue(site.project_amount),
            project_period: `${site.project_start_date || '-'} ~ ${site.project_end_date || '-'}`,
            site_name: site.site_name,
            status:
              SITE_STATUS_LABELS[site.status as keyof typeof SITE_STATUS_LABELS] ||
              site.status,
            total_contract_amount: formatCurrencyValue(
              contractProfile.totalContractAmount,
            ),
            total_rounds: contractProfile.totalRounds ?? '',
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
            placeholder="현장명, 사업장명, 책임자, 배정 요원으로 검색"
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
          {onExcelUploadRequest ? (
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() =>
                onExcelUploadRequest({
                  headquarterId: lockedHeadquarterId,
                  siteId: null,
                })
              }
              disabled={busy}
            >
              엑셀 업로드
            </button>
          ) : null}
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
                      column={{ key: 'manager_name' }}
                      current={sort}
                      label="책임자"
                      onChange={setSort}
                      sortMenuOptions={buildSortMenuOptions('manager_name', {
                        asc: '책임자 가나다순',
                        desc: '책임자 역순',
                      })}
                    />
                    <SortableHeaderCell
                      column={{ key: 'assigned_users' }}
                      current={sort}
                      label="배정 요원"
                      onChange={setSort}
                      sortMenuOptions={buildSortMenuOptions('assigned_users', {
                        asc: '배정 요원 가나다순',
                        desc: '배정 요원 역순',
                      })}
                    />
                    <SortableHeaderCell
                      column={{ key: 'project_end_date' }}
                      current={sort}
                      defaultDirection="desc"
                      label="기간"
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
                    const contractProfile = parseSiteContractProfile(site);
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
                          <td>{site.headquarter_detail?.name || site.headquarter?.name || '-'}</td>
                        ) : null}
                        <td>
                          <div className={styles.tablePrimary}>{site.manager_name || '-'}</div>
                          <div className={styles.tableSecondary}>
                            {site.manager_phone || '연락처 미입력'}
                          </div>
                        </td>
                        <td>
                          <div className={styles.tablePrimary}>
                            {assignedUsers.length > 0
                              ? formatAssignedUsers(assignedUsers)
                              : fallbackAssignedUsers.length > 0
                                ? fallbackAssignedUsers.map((user) => user.name).join(', ')
                                : '-'}
                          </div>
                          <div className={styles.tableSecondary}>
                            {assignedUsers.length > 0
                              ? formatAssignedUserDetails(assignedUsers)
                              : '배정 정보 없음'}
                          </div>
                        </td>
                        <td>
                          {site.project_start_date || '-'} ~ {site.project_end_date || '-'}
                          <div className={styles.tableSecondary}>
                            계약 {SITE_CONTRACT_TYPE_LABELS[contractProfile.contractType] || '미입력'} / 회차 {contractProfile.totalRounds ?? '-'}
                          </div>
                        </td>
                        <td>
                          {SITE_STATUS_LABELS[site.status as keyof typeof SITE_STATUS_LABELS] ||
                            site.status}
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
                                ...(onExcelUploadRequest
                                  ? [
                                      {
                                        label: '엑셀 업로드',
                                        onSelect: () =>
                                          onExcelUploadRequest({
                                            headquarterId: lockedHeadquarterId,
                                            siteId: null,
                                          }),
                                      },
                                    ]
                                  : []),
                                {
                                  label: '수정',
                                  onSelect: () => {
                                    if (!busy) openEdit(site);
                                  },
                                },
                                ...SITE_STATUS_OPTIONS.filter((option) => option.value !== site.status).map((option) => ({
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
          <span className={styles.label}>사업장관리번호(사업개시번호)</span>
          <input
            className="app-input"
            value={form.site_number}
            onChange={(e) => setForm({ ...form, site_number: e.target.value })}
            disabled={busy}
          />
        </label>
          <label className={styles.modalField}>
            <span className={styles.label}>공사 시작일</span>
            <input
              className="app-input"
              type="date"
              value={form.project_start_date}
              onChange={(e) => setForm({ ...form, project_start_date: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>공사 금액</span>
            <input
              className="app-input"
              value={form.project_amount}
              onChange={(e) => setForm({ ...form, project_amount: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>계약일</span>
            <input
              className="app-input"
              type="date"
              value={form.contract_date}
              onChange={(e) => setForm({ ...form, contract_date: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>공사 종료일</span>
            <input
              className="app-input"
              type="date"
              value={form.project_end_date}
              onChange={(e) => setForm({ ...form, project_end_date: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>계약유형</span>
            <select
              className="app-select"
              value={form.contract_type}
              onChange={(e) =>
                setForm({ ...form, contract_type: e.target.value as SiteContractType })
              }
              disabled={busy}
            >
              {SITE_CONTRACT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>현장 책임자</span>
            <input
              className="app-input"
              value={form.manager_name}
              onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>계약상태</span>
            <select
              className="app-select"
              value={form.contract_status}
              onChange={(e) =>
                setForm({ ...form, contract_status: e.target.value as SiteContractStatus })
              }
              disabled={busy}
            >
              {SITE_CONTRACT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>책임자 연락처</span>
            <input
              className="app-input"
              value={form.manager_phone}
              onChange={(e) => setForm({ ...form, manager_phone: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>총 회차</span>
            <input
              className="app-input"
              value={form.total_rounds}
              onChange={(e) => setForm({ ...form, total_rounds: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalFieldWide}>
            <span className={styles.label}>현장 주소</span>
            <input
              className="app-input"
              value={form.site_address}
              onChange={(e) => setForm({ ...form, site_address: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>회차당 단가</span>
            <input
              className="app-input"
              value={form.per_visit_amount}
              onChange={(e) => setForm({ ...form, per_visit_amount: e.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>총 계약금액</span>
            <input
              className="app-input"
              value={form.total_contract_amount}
              onChange={(e) => setForm({ ...form, total_contract_amount: e.target.value })}
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
