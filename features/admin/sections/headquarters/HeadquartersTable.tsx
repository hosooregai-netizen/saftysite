import Link from 'next/link';
import ActionMenu from '@/components/ui/ActionMenu';
import { SubmitSearchField } from '@/components/ui/SubmitSearchField';
import { SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { getAdminSectionHref } from '@/lib/admin';
import type { TableSortState } from '@/types/admin';
import type { SafetyHeadquarter } from '@/types/controller';

const HEADQUARTERS_PAGE_SIZE = 30;

interface HeadquartersTableProps {
  busy: boolean;
  canDelete: boolean;
  filteredHeadquarters: SafetyHeadquarter[];
  page: number;
  onCreateRequest: () => void;
  onDeleteRequest: (item: SafetyHeadquarter) => void;
  onEditRequest: (item: SafetyHeadquarter) => void;
  onExportRequest: () => void;
  onImportRequest: () => void;
  onOpenSitesRequest: (item: SafetyHeadquarter) => void;
  onPageChange: (page: number) => void;
  onQueryChange: (value: string) => void;
  onQuerySubmit: () => void;
  onSortChange: (value: TableSortState) => void;
  query: string;
  sort: TableSortState;
  showHeader?: boolean;
  totalCount: number;
  totalPages: number;
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
  page,
  onCreateRequest,
  onDeleteRequest,
  onEditRequest,
  onExportRequest,
  onImportRequest,
  onOpenSitesRequest,
  onPageChange,
  onQueryChange,
  onQuerySubmit,
  onSortChange,
  query,
  sort,
  showHeader = true,
  totalCount,
  totalPages,
}: HeadquartersTableProps) {
  return (
    <>
      <div className={styles.sectionHeader}>
        {showHeader ? (
          <div className={styles.sectionHeaderTitleBlock}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>건설사 목록</h2>
              <Link
                href={getAdminSectionHref('headquarters', { siteStatus: 'all' })}
                className={styles.sectionTitleInlineAction}
              >
                현장 목록 보기
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.sectionHeaderSpacer} />
        )}
        <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
          <SubmitSearchField
            busy={busy}
            formClassName={`${styles.sectionHeaderSearchShell} ${styles.sectionHeaderToolbarSearch}`}
            inputClassName={`app-input ${styles.sectionHeaderSearchInput}`}
            buttonClassName={styles.sectionHeaderSearchButton}
            placeholder="건설사명, 관리번호, 담당자, 등록번호, 주소로 검색"
            value={query}
            onChange={onQueryChange}
            onSubmit={onQuerySubmit}
          />
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onExportRequest}
            disabled={busy}
          >
            엑셀 내보내기
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onCreateRequest}
            disabled={busy}
          >
            건설사 추가
          </button>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onImportRequest}
            disabled={busy}
          >
            엑셀로 추가
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {filteredHeadquarters.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 건설사가 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.headquartersTable}`}>
                <colgroup>
                  <col className={styles.headquartersOrderCol} />
                  <col className={styles.headquartersNameCol} />
                  <col className={styles.headquartersContactCol} />
                  <col className={styles.headquartersRegistrationCol} />
                  <col className={styles.headquartersAddressCol} />
                  <col className={styles.headquartersSiteCountCol} />
                  <col className={styles.headquartersMenuCol} />
                </colgroup>
                <thead>
                  <tr>
                    <SortableHeaderCell
                      column={{ key: 'created_at' }}
                      current={sort}
                      defaultDirection="desc"
                      label="번호"
                      onChange={onSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'name' }}
                      current={sort}
                      label="건설사명"
                      onChange={onSortChange}
                    />
                    <th>담당자</th>
                    <th>사업자등록번호</th>
                    <th>주소</th>
                    <th className={styles.headquartersSiteCountCell}>현장 수</th>
                    <th>메뉴</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHeadquarters.map((item, index) => {
                    const rowNumber =
                      item.sequence_no ??
                      Math.max(totalCount - ((page - 1) * HEADQUARTERS_PAGE_SIZE + index), 1);
                    const siteCount = item.site_count ?? 0;

                    return (
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
                        <td className={styles.headquartersOrderCell}>
                          <div className={styles.tablePrimary}>{rowNumber}</div>
                        </td>
                        <td>
                          <div className={styles.tablePrimary}>{item.name}</div>
                        </td>
                        <td>
                          <div className={styles.tablePrimary}>{item.contact_name || '-'}</div>
                          <div className={styles.tableSecondary}>
                            {[item.contact_phone, item.contact_email].filter(Boolean).join(' / ') || '-'}
                          </div>
                        </td>
                        <td>
                          <div className={styles.tablePrimary}>
                            {item.business_registration_no || '-'}
                          </div>
                          <div className={styles.tableSecondary}>법인등록번호 {item.corporate_registration_no || '-'}</div>
                        </td>
                        <td>
                          <div className={styles.tablePrimary}>{item.address || '-'}</div>
                        </td>
                        <td className={styles.headquartersSiteCountCell}>
                          <div className={styles.tablePrimary}>{siteCount}</div>
                        </td>
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
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => onPageChange(page - 1)}
            disabled={busy || page <= 1}
          >
            이전
          </button>
          <span className={styles.paginationLabel}>
            {page} / {totalPages} 페이지
          </span>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => onPageChange(page + 1)}
            disabled={busy || page >= totalPages}
          >
            다음
          </button>
        </div>
      ) : null}
    </>
  );
}
