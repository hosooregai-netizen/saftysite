import ActionMenu from '@/components/ui/ActionMenu';
import { formatTimestamp } from '@/lib/admin';
import type { SafetyHeadquarter } from '@/types/controller';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface HeadquartersTableProps {
  busy: boolean;
  canDelete: boolean;
  filteredHeadquarters: SafetyHeadquarter[];
  onCreateRequest: () => void;
  onDeleteRequest: (item: SafetyHeadquarter) => void;
  onEditRequest: (item: SafetyHeadquarter) => void;
  onOpenSitesRequest: (item: SafetyHeadquarter) => void;
  onQueryChange: (value: string) => void;
  query: string;
  showHeader?: boolean;
  totalHeadquarterCount: number;
}

export function HeadquartersTable({
  busy,
  canDelete,
  filteredHeadquarters,
  onCreateRequest,
  onDeleteRequest,
  onEditRequest,
  onOpenSitesRequest,
  onQueryChange,
  query,
  showHeader = true,
  totalHeadquarterCount,
}: HeadquartersTableProps) {
  return (
    <>
      <div className={styles.sectionHeader}>
        {showHeader ? (
          <div>
            <h2 className={styles.sectionTitle}>사업장 목록</h2>
          </div>
        ) : (
          <div className={styles.sectionHeaderSpacer} />
        )}
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">표시 {filteredHeadquarters.length} / 전체 {totalHeadquarterCount}개</span>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onCreateRequest}
            disabled={busy}
          >
            사업장 추가
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.filterRow}>
          <input
            className={`app-input ${styles.filterSearch}`}
            placeholder="사업장명, 담당자, 등록번호, 주소로 검색"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <div className={styles.tableShell}>
          {filteredHeadquarters.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 사업장이 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>사업장명</th>
                    <th>담당자</th>
                    <th>사업자등록번호</th>
                    <th>법인등록번호</th>
                    <th>주소</th>
                    <th>수정일</th>
                    <th>메뉴</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHeadquarters.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          type="button"
                          className={styles.tableButtonLink}
                          onClick={() => {
                            if (!busy) onOpenSitesRequest(item);
                          }}
                        >
                          {item.name}
                        </button>
                        <div className={styles.tableSecondary}>면허번호 {item.license_no || '-'}</div>
                      </td>
                      <td>
                        <div className={styles.tablePrimary}>{item.contact_name || '-'}</div>
                        <div className={styles.tableSecondary}>
                          {item.contact_phone || '연락처 미입력'}
                        </div>
                      </td>
                      <td>{item.business_registration_no || '-'}</td>
                      <td>{item.corporate_registration_no || '-'}</td>
                      <td>{item.address || '-'}</td>
                      <td>{formatTimestamp(item.updated_at)}</td>
                      <td>
                        <div className={styles.tableActionMenuWrap}>
                          <ActionMenu
                            label={`${item.name} 작업 메뉴 열기`}
                            items={[
                              {
                                label: '현장 보기',
                                onSelect: () => {
                                  if (!busy) onOpenSitesRequest(item);
                                },
                              },
                              {
                                label: '수정',
                                onSelect: () => {
                                  if (!busy) onEditRequest(item);
                                },
                              },
                              ...(canDelete
                                ? [
                                    {
                                      label: '삭제',
                                      tone: 'danger' as const,
                                      onSelect: () => {
                                        if (!busy) void onDeleteRequest(item);
                                      },
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
