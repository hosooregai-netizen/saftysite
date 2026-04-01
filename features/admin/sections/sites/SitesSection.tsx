'use client';

import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import ActionMenu from '@/components/ui/ActionMenu';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  SITE_STATUS_LABELS,
  SITE_STATUS_OPTIONS,
  parseOptionalNumber,
  toNullableText,
} from '@/lib/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SafetyAssignment, SafetyHeadquarter } from '@/types/controller';
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
  }>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAssignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  onUnassignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  title?: string;
  emptyMessage?: string;
  showHeader?: boolean;
  showHeadquarterColumn?: boolean;
  lockedHeadquarterId?: string | null;
  onSelectSiteEntry?: (site: SafetySite) => void;
}

const EMPTY_FORM = {
  headquarter_id: '',
  site_name: '',
  project_start_date: '',
  project_end_date: '',
  project_amount: '',
  manager_name: '',
  manager_phone: '',
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
  } = props;
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignmentSiteId, setAssignmentSiteId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'active' | 'closed'>('all');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
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
      if (showUnassignedOnly && siteAssignments.length > 0) return false;
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
  }, [activeAssignmentsBySiteId, deferredQuery, showUnassignedOnly, sites, statusFilter, usersById]);

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
      project_start_date: site.project_start_date ?? '',
      project_end_date: site.project_end_date ?? '',
      project_amount: site.project_amount ? String(site.project_amount) : '',
      manager_name: site.manager_name ?? '',
      manager_phone: site.manager_phone ?? '',
      site_number: site.management_number ?? site.site_code ?? '',
      site_address: site.site_address ?? '',
    });
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const buildPayload = () => ({
    headquarter_id: lockedHeadquarterId ?? form.headquarter_id,
    site_name: form.site_name.trim(),
    site_code: toNullableText(form.site_number),
    management_number: toNullableText(form.site_number),
    project_start_date: toNullableText(form.project_start_date),
    project_end_date: toNullableText(form.project_end_date),
    project_amount: parseOptionalNumber(form.project_amount),
    manager_name: toNullableText(form.manager_name),
    manager_phone: toNullableText(form.manager_phone),
    site_address: toNullableText(form.site_address),
  });

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
    if (editingId === 'create') await onCreate({ ...payload, status: 'active' });
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

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        {showHeader ? (
          <div>
            <h2 className={styles.sectionTitle}>{title}</h2>
          </div>
        ) : (
          <div className={styles.sectionHeaderSpacer} />
        )}
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">표시 {filteredSites.length} / 전체 {sites.length}개</span>
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
        <div className={styles.filterRow}>
          <input
            className={`app-input ${styles.filterSearch}`}
            placeholder="현장명, 사업장명, 책임자, 배정 요원으로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className={`${styles.filterButton} ${statusFilter === 'all' ? styles.filterButtonActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            전체 상태
          </button>
          {SITE_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.filterButton} ${statusFilter === option.value ? styles.filterButtonActive : ''}`}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.filterButton} ${showUnassignedOnly ? styles.filterButtonActive : ''}`}
            onClick={() => setShowUnassignedOnly((current) => !current)}
          >
            미배정만
          </button>
        </div>
        <div className={styles.tableShell}>
          {filteredSites.length === 0 ? (
            <div className={styles.tableEmpty}>{emptyMessage}</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>현장명</th>
                    {showHeadquarterColumn ? <th>사업장</th> : null}
                    <th>책임자</th>
                    <th>배정 요원</th>
                    <th>기간</th>
                    <th>상태</th>
                    <th>메뉴</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSites.map((site) => {
                    const siteAssignments = activeAssignmentsBySiteId.get(site.id) ?? [];
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
                                  label: '수정',
                                  onSelect: () => {
                                    if (!busy) openEdit(site);
                                  },
                                },
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
            <span className={styles.label}>현장 책임자</span>
            <input
              className="app-input"
              value={form.manager_name}
              onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
              disabled={busy}
            />
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
          <label className={styles.modalFieldWide}>
            <span className={styles.label}>현장 주소</span>
            <input
              className="app-input"
              value={form.site_address}
              onChange={(e) => setForm({ ...form, site_address: e.target.value })}
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
