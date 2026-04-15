'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildSortMenuOptions, SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { TableSortState } from '@/types/admin';
import {
  clampPage,
  isOverviewRowActivationKey,
  stopOverviewRowNavigation,
} from './overviewSectionHelpers';

interface OverviewMaterialGapSectionProps {
  currentPage: number;
  isRefreshing: boolean;
  quarterLabel: string;
  rows: Array<{
    education: { filledCount: number; missingCount: number; requiredCount: number };
    headquarterName: string;
    href: string;
    measurement: { filledCount: number; missingCount: number; requiredCount: number };
    siteId: string;
    siteName: string;
  }>;
  setPage: (updater: (current: number) => number) => void;
  setSort: (next: TableSortState) => void;
  sort: TableSortState;
  totalPages: number;
  totalRows: number;
}

export function OverviewMaterialGapSection({
  currentPage,
  isRefreshing,
  quarterLabel,
  rows,
  setPage,
  setSort,
  sort,
  totalPages,
  totalRows,
}: OverviewMaterialGapSectionProps) {
  const router = useRouter();

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard} ${styles.overviewTableCard}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.overviewTableHeaderBlock}>
          <h2 className={styles.sectionTitle}>교육/계측 자료 부족 현장</h2>
          {quarterLabel ? <div className={styles.overviewTableScope}>{quarterLabel}</div> : null}
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className={styles.overviewTableCount}>{totalRows.toLocaleString('ko-KR')}개 현장</span>
        </div>
      </div>
      <div className={styles.sectionBody}>
        {totalRows === 0 ? (
          <div className={styles.tableEmpty}>현재 교육/계측 자료가 부족한 현장이 없습니다.</div>
        ) : (
          <div className={styles.tableShell}>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.overviewMaterialTable}`}>
                <colgroup>
                  <col className={styles.overviewColSiteWide} />
                  <col className={styles.overviewColHeadquarterWide} />
                  <col className={styles.overviewColMetric} />
                  <col className={styles.overviewColMetric} />
                  <col className={styles.overviewColMetric} />
                  <col className={styles.overviewColMetric} />
                  <col className={styles.overviewColMetric} />
                </colgroup>
                <thead>
                  <tr>
                    <SortableHeaderCell column={{ key: 'siteName' }} current={sort} label="현장" onChange={setSort} sortMenuOptions={buildSortMenuOptions('siteName', { asc: '현장 가나다순', desc: '현장 역순' })} />
                    <SortableHeaderCell column={{ key: 'headquarterName' }} current={sort} label="사업장" onChange={setSort} sortMenuOptions={buildSortMenuOptions('headquarterName', { asc: '사업장 가나다순', desc: '사업장 역순' })} />
                    <SortableHeaderCell column={{ key: 'educationMissing' }} current={sort} defaultDirection="desc" label="교육 부족" onChange={setSort} sortMenuOptions={buildSortMenuOptions('educationMissing', { asc: '교육 부족 적은 순', desc: '교육 부족 많은 순' })} />
                    <SortableHeaderCell column={{ key: 'measurementMissing' }} current={sort} defaultDirection="desc" label="계측 부족" onChange={setSort} sortMenuOptions={buildSortMenuOptions('measurementMissing', { asc: '계측 부족 적은 순', desc: '계측 부족 많은 순' })} />
                    <th>교육 현황</th>
                    <th>계측 현황</th>
                    <SortableHeaderCell column={{ key: 'missingTotal' }} current={sort} defaultDirection="desc" label="총 부족" onChange={setSort} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const missingTotal = row.education.missingCount + row.measurement.missingCount;
                    return (
                      <tr
                        key={row.siteId}
                        className={styles.overviewClickableRow}
                        onClick={() => router.push(row.href)}
                        onKeyDown={(event) => {
                          if (!isOverviewRowActivationKey(event)) return;
                          event.preventDefault();
                          router.push(row.href);
                        }}
                        role="link"
                        tabIndex={0}
                      >
                        <td><Link href={row.href} className={styles.tableInlineLink} onClick={stopOverviewRowNavigation}>{row.siteName}</Link></td>
                        <td>{row.headquarterName}</td>
                        <td><span className={styles.overviewTableStatus}>{`${row.education.missingCount}건`}</span></td>
                        <td><span className={styles.overviewTableStatus}>{`${row.measurement.missingCount}건`}</span></td>
                        <td><span className={styles.overviewTableMetric}>{`${row.education.filledCount}/${row.education.requiredCount}`}</span></td>
                        <td><span className={styles.overviewTableMetric}>{`${row.measurement.filledCount}/${row.measurement.requiredCount}`}</span></td>
                        <td><span className={styles.overviewTableStatus}>{`${missingTotal}건`}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {totalRows > 0 ? (
        <div className={styles.paginationRow}>
          <button type="button" className="app-button app-button-secondary" onClick={() => setPage((current) => clampPage(current - 1, totalPages))} disabled={isRefreshing || currentPage <= 1}>이전</button>
          <span className={styles.paginationLabel}>{currentPage} / {totalPages} 페이지</span>
          <button type="button" className="app-button app-button-secondary" onClick={() => setPage((current) => clampPage(current + 1, totalPages))} disabled={isRefreshing || currentPage >= totalPages}>다음</button>
        </div>
      ) : null}
    </section>
  );
}
