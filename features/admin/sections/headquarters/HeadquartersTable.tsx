import ActionMenu from '@/components/ui/ActionMenu';
import { SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import { formatTimestamp, getAdminSectionHref } from '@/lib/admin';
import type { TableSortState } from '@/types/admin';
import type { SafetyHeadquarter } from '@/types/controller';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface HeadquartersTableProps {
  busy: boolean;
  canDelete: boolean;
  exportHeadquarters: SafetyHeadquarter[];
  filteredHeadquarters: SafetyHeadquarter[];
  page: number;
  onCreateRequest: () => void;
  onDeleteRequest: (item: SafetyHeadquarter) => void;
  onEditRequest: (item: SafetyHeadquarter) => void;
  onOpenSitesRequest: (item: SafetyHeadquarter) => void;
  onPageChange: (page: number) => void;
  onQueryChange: (value: string) => void;
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

function getHeadquarterMissingFields(item: SafetyHeadquarter) {
  const requiredChecks: Array<[string, string | null]> = [
    ['사업장관리번호', item.management_number],
    ['사업장개시번호', item.opening_number],
    ['사업자등록번호', item.business_registration_no],
    ['법인등록번호', item.corporate_registration_no],
    ['건설업면허/등록번호', item.license_no],
    ['본사 담당자명', item.contact_name],
    ['대표 전화', item.contact_phone],
    ['본사 주소', item.address],
  ];

  return requiredChecks
    .filter(([, value]) => !String(value ?? '').trim())
    .map(([label]) => label);
}

export function HeadquartersTable({
  busy,
  canDelete,
  exportHeadquarters,
  filteredHeadquarters,
  page,
  onCreateRequest,
  onDeleteRequest,
  onEditRequest,
  onOpenSitesRequest,
  onPageChange,
  onQueryChange,
  onSortChange,
  query,
  sort,
  showHeader = true,
  totalCount,
  totalPages,
}: HeadquartersTableProps) {
  const registrationGapCount = exportHeadquarters.filter((item) =>
    [item.management_number, item.opening_number, item.business_registration_no].some(
      (value) => !String(value ?? '').trim(),
    ),
  ).length;
  const contactGapCount = exportHeadquarters.filter((item) =>
    [item.contact_name, item.contact_phone, item.address].some(
      (value) => !String(value ?? '').trim(),
    ),
  ).length;
  const completedCount = exportHeadquarters.filter(
    (item) => getHeadquarterMissingFields(item).length === 0,
  ).length;
  const memoGapCount = exportHeadquarters.filter(
    (item) => !String(item.memo ?? '').trim(),
  ).length;
  const handleExport = () =>
    void exportAdminWorkbook('headquarters', [
      {
        name: '사업장',
        columns: [
          { key: 'name', label: '회사명' },
          { key: 'management_number', label: '사업장관리번호' },
          { key: 'opening_number', label: '사업장개시번호' },
          { key: 'business_registration_no', label: '사업자등록번호' },
          { key: 'corporate_registration_no', label: '법인등록번호' },
          { key: 'license_no', label: '건설업면허/등록번호' },
          { key: 'contact_name', label: '본사 담당자명' },
          { key: 'contact_phone', label: '대표 전화' },
          { key: 'address', label: '본사 주소' },
          { key: 'memo', label: '운영 메모' },
          { key: 'updated_at', label: '수정일' },
        ],
        rows: exportHeadquarters.map((item) => ({
          address: item.address || '',
          business_registration_no: item.business_registration_no || '',
          contact_name: item.contact_name || '',
          management_number: item.management_number || '',
          opening_number: item.opening_number || '',
          corporate_registration_no: item.corporate_registration_no || '',
          contact_phone: item.contact_phone || '',
          license_no: item.license_no || '',
          memo: item.memo || '',
          name: item.name,
          updated_at: formatTimestamp(item.updated_at),
        })),
      },
    ]);

  return (
    <>
      <div className={styles.sectionHeader}>
        {showHeader ? (
          <div className={styles.sectionHeaderTitleBlock}>
            <h2 className={styles.sectionTitle}>사업장 목록</h2>
          </div>
        ) : (
          <div className={styles.sectionHeaderSpacer} />
        )}
        <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
          <input
            className={`app-input ${styles.sectionHeaderSearch} ${styles.sectionHeaderToolbarSearch}`}
            placeholder="회사명, 관리번호, 담당자, 등록번호, 주소로 검색"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
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
            onClick={onCreateRequest}
            disabled={busy}
          >
            사업장 추가
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        {totalCount > 0 ? (
          <div className={styles.listSummaryShell}>
            <div className={styles.summaryBar}>
              <article className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>전체 사업장</span>
                <strong className={styles.summaryCardValue}>{totalCount}개</strong>
                <span className={styles.summaryCardMeta}>현재 검색/정렬 범위 기준</span>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>등록번호 보완</span>
                <strong className={styles.summaryCardValue}>{registrationGapCount}개</strong>
                <span className={styles.summaryCardMeta}>관리번호, 개시번호, 사업자번호 기준</span>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>연락/주소 보완</span>
                <strong className={styles.summaryCardValue}>{contactGapCount}개</strong>
                <span className={styles.summaryCardMeta}>담당자, 대표 전화, 본사 주소 기준</span>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>입력 완료</span>
                <strong className={styles.summaryCardValue}>{completedCount}개</strong>
                <span className={styles.summaryCardMeta}>운영 메모 미입력 {memoGapCount}개</span>
              </article>
            </div>
          </div>
        ) : null}
        <div className={styles.tableShell}>
          {filteredHeadquarters.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 사업장이 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.headquartersTable}`}>
                <colgroup>
                  <col className={styles.headquartersNameCol} />
                  <col className={styles.headquartersContactCol} />
                  <col className={styles.headquartersRegistrationCol} />
                  <col className={styles.headquartersAddressCol} />
                  <col className={styles.headquartersMenuCol} />
                </colgroup>
                <thead>
                  <tr>
                    <SortableHeaderCell
                      column={{ key: 'name' }}
                      current={sort}
                      label="사업장 명"
                      onChange={onSortChange}
                    />
                    <th>담당자</th>
                    <th>사업자등록번호</th>
                    <th>주소</th>
                    <th>메뉴</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHeadquarters.map((item) => {
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
                        <td>
                          <div className={styles.tablePrimary}>{item.name}</div>
                        </td>
                        <td>
                          <div className={styles.tablePrimary}>{item.contact_name || '-'}</div>
                        </td>
                        <td>
                          <div className={styles.tablePrimary}>
                            {item.business_registration_no || '-'}
                          </div>
                          <div className={styles.tableSecondary}>
                            면허번호 {item.license_no || '-'}
                          </div>
                        </td>
                        <td>
                          <div className={styles.tablePrimary}>{item.address || '-'}</div>
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
