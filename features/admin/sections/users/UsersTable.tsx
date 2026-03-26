import Link from 'next/link';
import ActionMenu from '@/components/ui/ActionMenu';
import { formatTimestamp, getUserRoleLabel } from '@/lib/admin';
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
  setStatusFilter: (value: 'all' | 'active' | 'inactive') => void;
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
  setStatusFilter,
  statusFilter,
  totalUserCount,
  userOverviewById,
}: UsersTableProps) {
  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>사용자 CRUD</h2>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">표시 {filteredUsers.length} / 전체 {totalUserCount}명</span>
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
        <div className={styles.filterRow}>
          <input
            className={`app-input ${styles.filterSearch}`}
            placeholder="이름, 이메일, 직책, 소속으로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className={`${styles.filterButton} ${roleFilter === 'all' ? styles.filterButtonActive : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            전체 권한
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${roleFilter === 'admin' ? styles.filterButtonActive : ''}`}
            onClick={() => setRoleFilter('admin')}
          >
            관리자
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${roleFilter === 'field_agent' ? styles.filterButtonActive : ''}`}
            onClick={() => setRoleFilter('field_agent')}
          >
            지도요원
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${statusFilter === 'all' ? styles.filterButtonActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            전체 상태
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${statusFilter === 'active' ? styles.filterButtonActive : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            활성
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${statusFilter === 'inactive' ? styles.filterButtonActive : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            비활성
          </button>
        </div>

        <div className={styles.tableShell}>
          {filteredUsers.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 사용자가 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>권한</th>
                    <th>담당 현장</th>
                    <th>보고서</th>
                    <th>연락처</th>
                    <th>상태</th>
                    <th>최근 로그인</th>
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
                            {user.position || '직책 미입력'} · {user.organization_name || '소속 미입력'}
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

