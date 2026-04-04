import Link from 'next/link';
import ActionMenu from '@/components/ui/ActionMenu';
import { SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import { TableToolbar } from '@/features/admin/components/TableToolbar';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import { formatTimestamp, getUserRoleLabel } from '@/lib/admin';
import type { TableSortState } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface UserOverview {
  assignedSites: SafetySite[];
  latestSession: InspectionSession | null;
  reportCount: number;
}

interface UsersTableProps {
  busy: boolean;
  canDelete: boolean;
  filteredUsers: SafetyUser[];
  onCreateRequest: () => void;
  onDeleteRequest: (user: SafetyUser) => void;
  onEditRequest: (user: SafetyUser) => void;
  query: string;
  roleFilter: 'all' | 'admin' | 'field_agent';
  setQuery: (value: string) => void;
  setRoleFilter: (value: 'all' | 'admin' | 'field_agent') => void;
  setSort: (value: TableSortState) => void;
  setStatusFilter: (value: 'all' | 'active' | 'inactive') => void;
  sort: TableSortState;
  statusFilter: 'all' | 'active' | 'inactive';
  totalUserCount: number;
  userOverviewById: Map<string, UserOverview>;
}

export function UsersTable({
  busy,
  canDelete,
  filteredUsers,
  onCreateRequest,
  onDeleteRequest,
  onEditRequest,
  query,
  roleFilter,
  setQuery,
  setRoleFilter,
  setSort,
  setStatusFilter,
  sort,
  statusFilter,
  totalUserCount,
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

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>사용자 CRUD</h2>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">
            표시 {filteredUsers.length} / 전체 {totalUserCount}명
          </span>
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
        <TableToolbar
          countLabel={`표시 ${filteredUsers.length} / 전체 ${totalUserCount}명`}
          filters={
            <>
              <select
                className={`app-select ${styles.usersFilterSelect}`}
                aria-label="권한 필터"
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
              <select
                className={`app-select ${styles.usersFilterSelect}`}
                aria-label="활성 상태 필터"
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
            </>
          }
          onExport={() =>
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
                rows: filteredUsers.map((user) => {
                  const overview = userOverviewById.get(user.id) ?? {
                    assignedSites: [],
                    latestSession: null,
                    reportCount: 0,
                  };

                  return {
                    assignedSites: overview.assignedSites.map((site) => site.site_name).join(', '),
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
            ])
          }
          onQueryChange={setQuery}
          query={query}
          queryPlaceholder="이름, 이메일, 직책, 소속으로 검색"
        />

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
                                  {site.site_name}
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
    </>
  );
}
