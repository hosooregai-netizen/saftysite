import ActionMenu from '@/components/ui/ActionMenu';
import { SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import { TableToolbar } from '@/features/admin/components/TableToolbar';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import { formatTimestamp, getAdminSectionHref } from '@/lib/admin';
import type { TableSortState } from '@/types/admin';
import type { SafetyHeadquarter } from '@/types/controller';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface HeadquartersTableProps {
  busy: boolean;
  canDelete: boolean;
  filteredHeadquarters: SafetyHeadquarter[];
  onCreateRequest: () => void;
  onDeleteRequest: (item: SafetyHeadquarter) => void;
  onEditRequest: (item: SafetyHeadquarter) => void;
  onExcelUploadRequest: (item?: SafetyHeadquarter | null) => void;
  onOpenSitesRequest: (item: SafetyHeadquarter) => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: TableSortState) => void;
  query: string;
  sort: TableSortState;
  showHeader?: boolean;
  totalHeadquarterCount: number;
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

export function HeadquartersTable({
  busy,
  canDelete,
  filteredHeadquarters,
  onCreateRequest,
  onDeleteRequest,
  onEditRequest,
  onExcelUploadRequest,
  onOpenSitesRequest,
  onQueryChange,
  onSortChange,
  query,
  sort,
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
            className="app-button app-button-secondary"
            onClick={() => onExcelUploadRequest(null)}
            disabled={busy}
          >
            업로드
          </button>
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
        <TableToolbar
          countLabel={`표시 ${filteredHeadquarters.length} / 전체 ${totalHeadquarterCount}개`}
          onExport={() =>
            void exportAdminWorkbook('headquarters', [
              {
                name: '사업장',
                columns: [
                  { key: 'name', label: '사업장명' },
                  { key: 'address', label: '주소' },
                  { key: 'contact_phone', label: '연락처' },
                  { key: 'business_registration_no', label: '사업자등록번호' },
                  { key: 'corporate_registration_no', label: '법인등록번호' },
                  { key: 'license_no', label: '면허번호' },
                  { key: 'updated_at', label: '수정일' },
                ],
                rows: filteredHeadquarters.map((item) => ({
                  address: item.address || '',
                  business_registration_no: item.business_registration_no || '',
                  contact_phone: item.contact_phone || '',
                  corporate_registration_no: item.corporate_registration_no || '',
                  license_no: item.license_no || '',
                  name: item.name,
                  updated_at: formatTimestamp(item.updated_at),
                })),
              },
            ])
          }
          onQueryChange={onQueryChange}
          query={query}
          queryPlaceholder="사업장명, 연락처, 주소로 검색"
        />
        <div className={styles.tableShell}>
          {filteredHeadquarters.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 사업장이 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.headquartersTable}`}>
                <colgroup>
                  <col className={styles.headquartersNameCol} />
                  <col className={styles.headquartersAddressCol} />
                  <col className={styles.headquartersContactCol} />
                  <col className={styles.headquartersUpdatedCol} />
                  <col className={styles.headquartersMenuCol} />
                </colgroup>
                <thead>
                  <tr>
                    <SortableHeaderCell
                      column={{ key: 'name' }}
                      current={sort}
                      label="사업장명"
                      onChange={onSortChange}
                    />
                    <th>주소</th>
                    <SortableHeaderCell
                      column={{ key: 'contact_phone' }}
                      current={sort}
                      label="연락처"
                      onChange={onSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'updated_at' }}
                      current={sort}
                      defaultDirection="desc"
                      label="수정일"
                      onChange={onSortChange}
                    />
                    <th>메뉴</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHeadquarters.map((item) => (
                    <tr
                      key={item.id}
                      className={styles.tableClickableRow}
                      tabIndex={busy ? -1 : 0}
                      role="link"
                      onClick={(event) => {
                        if (busy || shouldIgnoreRowClick(event.target)) return;
                        onOpenSitesRequest(item);
                      }}
                      onKeyDown={(event) => {
                        if (busy || shouldIgnoreRowClick(event.target)) return;
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        onOpenSitesRequest(item);
                      }}
                    >
                      <td>
                        <div className={styles.tablePrimary}>{item.name}</div>
                      </td>
                      <td>{item.address || '-'}</td>
                      <td>
                        <div className={styles.tablePrimary}>{item.contact_phone || '-'}</div>
                      </td>
                      <td>{formatTimestamp(item.updated_at)}</td>
                      <td>
                        <div
                          className={styles.tableActionMenuWrap}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
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
                                label: '사진첩 보기',
                                href: getAdminSectionHref('photos', {
                                  headquarterId: item.id,
                                }),
                              },
                              {
                                label: '업로드',
                                onSelect: () => {
                                  if (!busy) onExcelUploadRequest(null);
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
