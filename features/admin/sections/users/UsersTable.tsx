import ActionMenu from '@/components/ui/ActionMenu';
import { SubmitSearchField } from '@/components/ui/SubmitSearchField';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { formatTimestamp, getUserRoleLabel } from '@/lib/admin';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import type { TableSortState } from '@/types/admin';
import type { SafetyAdminUserListRow } from '@/types/admin';
import type { InspectionSession } from '@/types/inspectionSession';

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
  page: number;
  queryInput: string;
  roleFilter: 'all' | 'admin' | 'field_agent';
  setPage: (page: number) => void;
  setQuery: (value: string) => void;
  submitQuery: () => void;
  setRoleFilter: (value: 'all' | 'admin' | 'field_agent') => void;
  setSort: (value: TableSortState) => void;
  sort: TableSortState;
  totalCount: number;
  totalPages: number;
  userOverviewById: Map<string, UserOverview>;
}

function buildAssignedSiteSummary(assignedSites: Array<{ id: string; siteName: string }>) {
  if (assignedSites.length === 0) {
    return {
      countLabel: '-',
      detailLabel: '담당 현장 없음',
      title: '',
    };
  }

  const firstSiteName = assignedSites[0]?.siteName || '현장명 없음';
  const detailLabel =
    assignedSites.length === 1
      ? firstSiteName
      : `${firstSiteName} 외 ${assignedSites.length - 1}개 현장`;

  return {
    countLabel: `${assignedSites.length}개 현장`,
    detailLabel,
    title: assignedSites.map((site) => site.siteName).join(', '),
  };
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
  setPage,
  setQuery,
  submitQuery,
  setRoleFilter,
  setSort,
  sort,
  totalCount,
  totalPages,
  userOverviewById,
}: UsersTableProps) {
  const roleOptions: Array<{ label: string; value: UsersTableProps['roleFilter'] }> = [
    { label: '전체 권한', value: 'all' },
    { label: '관리자/관제', value: 'admin' },
    { label: '지도요원', value: 'field_agent' },
  ];
  const activeFilterCount = roleFilter !== 'all' ? 1 : 0;

  const handleExport = async () => {
    const users = await exportUsers();
    void exportAdminWorkbook('users', [
      {
        name: '사용자',
        columns: [
          { key: 'name', label: '이름' },
          { key: 'email', label: '로그인 ID(이메일)' },
          { key: 'organizationName', label: '소속' },
          { key: 'phone', label: '전화번호' },
          { key: 'position', label: '직책' },
          { key: 'role', label: '권한' },
          { key: 'assignedSiteCount', label: '담당 현장 수' },
          { key: 'assignedSiteSummary', label: '담당 현장 요약' },
          { key: 'status', label: '상태' },
          { key: 'lastLoginAt', label: '최근 로그인' },
        ],
        rows: users.map((user) => {
          const overview = userOverviewById.get(user.id) ?? {
            assignedSites: user.assignedSites,
            latestSession: null,
            reportCount: 0,
          };
          const assignedSiteSummary = buildAssignedSiteSummary(overview.assignedSites);

          return {
            assignedSiteCount: overview.assignedSites.length,
            assignedSiteSummary: assignedSiteSummary.detailLabel,
            email: user.email,
            lastLoginAt: formatTimestamp(user.last_login_at),
            name: user.name,
            organizationName: user.organization_name || '',
            phone: user.phone || '',
            position: user.position || '',
            role: getUserRoleLabel(user.role),
            status: user.is_active ? '활성' : '비활성',
          };
        }),
      },
    ]);
  };

  const resetHeaderFilters = () => {
    setRoleFilter('all');
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
            placeholder="이름, 로그인 ID, 소속, 전화번호, 직책으로 검색"
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
                    <th>로그인 ID(이메일)</th>
                    <th>소속</th>
                    <th>전화번호</th>
                    <th>직책</th>
                    <th>담당 현장</th>
                    <th>상태</th>
                    <SortableHeaderCell
                      column={{ key: 'last_login_at' }}
                      current={sort}
                      defaultDirection="desc"
                      label="최근 로그인"
                      onChange={setSort}
                      sortMenuOptions={buildSortMenuOptions('last_login_at', {
                        asc: '오래된 로그인순',
                        desc: '최근 로그인순',
                      })}
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
                    const assignedSiteSummary = buildAssignedSiteSummary(overview.assignedSites);

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.tablePrimary}>{user.name}</div>
                          <div className={styles.tableSecondary}>{getUserRoleLabel(user.role)}</div>
                          {user.auto_provisioned_from_excel ? (
                            <div className={styles.tableMetaRow}>
                              <span className="app-chip app-chip-warning">자동 생성</span>
                            </div>
                          ) : null}
                        </td>
                        <td>{user.email}</td>
                        <td>{user.organization_name || '-'}</td>
                        <td>{user.phone || '-'}</td>
                        <td>{user.position || '-'}</td>
                        <td title={assignedSiteSummary.title || undefined}>
                          <div className={styles.tablePrimary}>{assignedSiteSummary.countLabel}</div>
                          <div className={styles.tableSecondary}>
                            {assignedSiteSummary.detailLabel}
                          </div>
                        </td>
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
