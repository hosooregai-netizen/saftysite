import Link from 'next/link';
import { SubmitSearchField } from '@/components/ui/SubmitSearchField';
import ActionMenu from '@/components/ui/ActionMenu';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import { formatTimestamp, getUserRoleLabel } from '@/lib/admin';
import type { TableSortState } from '@/types/admin';
import type { SafetyAdminUserListRow } from '@/types/admin';
import type { InspectionSession } from '@/types/inspectionSession';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface UserOverview {
  assignedSites: Array<{ id: string; siteName: string }>;
  latestSession: InspectionSession | null;
  reportCount: number;
}

interface UsersTableProps {
  busy: boolean;
  canDelete: boolean;
  exportUsers: () => Promise<SafetyAdminUserListRow[]>;
  filteredUsers: SafetyAdminUserListRow[];
  onCreateRequest: () => void;
  onDeleteRequest: (user: SafetyAdminUserListRow) => void;
  onEditRequest: (user: SafetyAdminUserListRow) => void;
  onExportRequest?: () => void;
  page: number;
  queryInput: string;
  roleFilter: 'all' | 'admin' | 'field_agent';
  sessionCountBySiteId: Map<string, number>;
  setPage: (page: number) => void;
  setQuery: (value: string) => void;
  submitQuery: () => void;
  setRoleFilter: (value: 'all' | 'admin' | 'field_agent') => void;
  setSort: (value: TableSortState) => void;
  setStatusFilter: (value: 'all' | 'active' | 'inactive') => void;
  sort: TableSortState;
  statusFilter: 'all' | 'active' | 'inactive';
  totalCount: number;
  totalPages: number;
  userOverviewById: Map<string, UserOverview>;
}

export function UsersTable({
  busy,
  canDelete,
  exportUsers,
  filteredUsers,
  onCreateRequest,
  onDeleteRequest,
  onEditRequest,
  page,
  queryInput,
  roleFilter,
  sessionCountBySiteId,
  setPage,
  setQuery,
  submitQuery,
  setRoleFilter,
  setSort,
  setStatusFilter,
  sort,
  statusFilter,
  totalCount,
  totalPages,
  userOverviewById,
}: UsersTableProps) {
  const roleOptions: Array<{ label: string; value: UsersTableProps['roleFilter'] }> = [
    { label: '전체 권한', value: 'all' },
    { label: '관리자', value: 'admin' },
    { label: '지도요원', value: 'field_agent' },
  ];
  const statusOptions: Array<{ label: string; value: UsersTableProps['statusFilter'] }> = [
    { label: '전체 상태', value: 'all' },
    { label: '활성', value: 'active' },
    { label: '비활성', value: 'inactive' },
  ];
  const activeFilterCount =
    (roleFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0);
  const handleExport = async () => {
    const users = await exportUsers();
    void exportAdminWorkbook('users', [
      {
        name: '사용자',
        columns: [
          { key: 'name', label: '이름' },
          { key: 'email', label: '이메일' },
          { key: 'role', label: '권한' },
          { key: 'assignedSites', label: '담당 현장' },
          { key: 'reportCount', label: '보고서 수' },
          { key: 'phone', label: '연락처' },
          { key: 'status', label: '상태' },
          { key: 'lastLoginAt', label: '최근 로그인' },
        ],
        rows: users.map((user) => {
          const overview = userOverviewById.get(user.id) ?? {
            assignedSites: user.assignedSites,
            latestSession: null,
            reportCount: user.assignedSites.reduce(
              (count, site) => count + (sessionCountBySiteId.get(site.id) || 0),
              0,
            ),
          };

          return {
            assignedSites: overview.assignedSites.map((site) => site.siteName).join(', '),
            email: user.email,
            lastLoginAt: formatTimestamp(user.last_login_at),
            name: user.name,
            phone: user.phone || '',
            reportCount: overview.reportCount,
            role: getUserRoleLabel(user.role),
            status: user.is_active ? '활성' : '비활성',
          };
        }),
      },
    ]);
  };
  const resetHeaderFilters = () => {
    setRoleFilter('all');
    setStatusFilter('all');
  };

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderTitleBlock}>
          <h2 className={styles.sectionTitle}>사용자</h2>
        </div>
        <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
          <SubmitSearchField
            busy={busy}
            formClassName={`${styles.sectionHeaderSearchShell} ${styles.sectionHeaderToolbarSearch}`}
            inputClassName={`app-input ${styles.sectionHeaderSearchInput}`}
            buttonClassName={styles.sectionHeaderSearchButton}
            placeholder="이름, 이메일, 직책, 소속으로 검색"
            value={queryInput}
            onChange={setQuery}
            onSubmit={submitQuery}
          />
          <SectionHeaderFilterMenu
            activeCount={activeFilterCount}
            ariaLabel="사용자 필터"
            onReset={resetHeaderFilters}
          >
            <div className={styles.sectionHeaderMenuGrid}>
              <div className={styles.sectionHeaderMenuField}>
                <label htmlFor="users-filter-role">권한</label>
                <select
                  id="users-filter-role"
                  className="app-select"
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value as UsersTableProps['roleFilter'])
                  }
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.sectionHeaderMenuField}>
                <label htmlFor="users-filter-status">상태</label>
                <select
                  id="users-filter-status"
                  className="app-select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as UsersTableProps['statusFilter'])
                  }
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SectionHeaderFilterMenu>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={handleExport}
          >
            엑셀 내보내기
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onCreateRequest}
            disabled={busy}
          >
            사용자 추가
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {filteredUsers.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 사용자가 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <SortableHeaderCell
                      column={{ key: 'name' }}
                      current={sort}
                      label="이름"
                      onChange={setSort}
                    />
                    <th>이메일</th>
                    <SortableHeaderCell
                      column={{ key: 'role' }}
                      current={sort}
                      label="권한"
                      onChange={setSort}
                      sortMenuOptions={buildSortMenuOptions('role', {
                        asc: '권한 오름차순',
                        desc: '권한 내림차순',
                      })}
                    />
                    <th>담당 현장</th>
                    <SortableHeaderCell
                      column={{ key: 'reportCount' }}
                      current={sort}
                      defaultDirection="desc"
                      label="보고서"
                      onChange={setSort}
                    />
                    <th>연락처</th>
                    <th>상태</th>
                    <SortableHeaderCell
                      column={{ key: 'last_login_at' }}
                      current={sort}
                      defaultDirection="desc"
                      label="최근 로그인"
                      onChange={setSort}
                    />
                    <th>메뉴</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const overview = userOverviewById.get(user.id) ?? {
                      assignedSites: [],
                      latestSession: null,
                      reportCount: 0,
                    };

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.tablePrimary}>{user.name}</div>
                          <div className={styles.tableSecondary}>
                            {user.position || '직책 미입력'} ·{' '}
                            {user.organization_name || '소속 미입력'}
                          </div>
                          {user.auto_provisioned_from_excel ? (
                            <div className={styles.tableMetaRow}>
                              <span className="app-chip app-chip-warning">자동 생성</span>
                            </div>
                          ) : null}
                        </td>
                        <td>{user.email}</td>
                        <td>{getUserRoleLabel(user.role)}</td>
                        <td>
                          {overview.assignedSites.length === 0 ? (
                            '-'
                          ) : (
                            <div className={styles.tableInlineLinks}>
                                  {overview.assignedSites.map((site) => (
                                    <Link
                                      key={site.id}
                                      href={`/sites/${encodeURIComponent(site.id)}`}
                                      className={styles.tableChipLink}
                                    >
                                  {site.siteName}
                                    </Link>
                                  ))}
                            </div>
                          )}
                        </td>
                        <td>
                          {overview.assignedSites.length === 0 ? (
                            '-'
                          ) : (
                            <div className={styles.tableCellOneLine}>
                              <span className={styles.tablePrimary}>{overview.reportCount}건</span>
                              {overview.latestSession ? (
                                <>
                                  <span className={styles.tableSep}>·</span>
                                  <Link
                                    href={`/sessions/${encodeURIComponent(overview.latestSession.id)}`}
                                    className={styles.tableInlineLink}
                                  >
                                    최근
                                  </Link>
                                </>
                              ) : null}
                              {overview.assignedSites[0] ? (
                                <>
                                  <span className={styles.tableSep}>·</span>
                                  <Link
                                    href={`/sites/${encodeURIComponent(overview.assignedSites[0].id)}`}
                                    className={styles.tableInlineLink}
                                  >
                                    목록
                                  </Link>
                                </>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td>{user.phone || '-'}</td>
                        <td>{user.is_active ? '활성' : '비활성'}</td>
                        <td>{formatTimestamp(user.last_login_at)}</td>
                        <td>
                          <div className={styles.tableActionMenuWrap}>
                            <ActionMenu
                              label={`${user.name} 작업 메뉴 열기`}
                              items={[
                                {
                                  label: '수정',
                                  onSelect: () => {
                                    if (!busy) onEditRequest(user);
                                  },
                                },
                                ...(canDelete
                                  ? [
                                      {
                                        label: '삭제',
                                        tone: 'danger' as const,
                                        onSelect: () => {
                                          if (!busy) void onDeleteRequest(user);
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
      {totalCount > 0 ? (
        <div className={styles.paginationRow}>
          <span>
            {page} / {totalPages} 페이지 · 총 {totalCount}명
          </span>
          <div className={styles.tableActions}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              이전
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              다음
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
