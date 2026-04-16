'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildSortMenuOptions, SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import { getDispatchStatusLabel } from '@/lib/admin/reportMeta';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyAdminUnsentReportRow, TableSortState } from '@/types/admin';
import {
  clampPage,
  getDispatchStatusTone,
  isOverviewRowActivationKey,
  stopOverviewRowNavigation,
} from './overviewSectionHelpers';

interface OverviewUnsentReportsSectionProps {
  currentPage: number;
  rows: SafetyAdminUnsentReportRow[];
  setPage: (updater: (current: number) => number) => void;
  setSort: (next: TableSortState) => void;
  sort: TableSortState;
  totalPages: number;
  totalRows: number;
}

export function OverviewUnsentReportsSection({
  currentPage,
  rows,
  setPage,
  setSort,
  sort,
  totalPages,
  totalRows,
}: OverviewUnsentReportsSectionProps) {
  const router = useRouter();

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard} ${styles.overviewTableCard}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.overviewTableHeaderBlock}>
          <h2 className={styles.sectionTitle}>발송 관리 대상</h2>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className={styles.overviewTableCount}>{totalRows.toLocaleString('ko-KR')}건</span>
        </div>
      </div>
      <div className={styles.sectionBody}>
        {totalRows === 0 ? (
          <div className={styles.tableEmpty}>현재 조치가 필요한 발송 관리 대상이 없습니다.</div>
        ) : (
          <div className={styles.tableShell}>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.overviewUnsentTable}`}>
                <colgroup>
                  <col className={styles.overviewColSiteWide} />
                  <col className={styles.overviewColReport} />
                  <col className={styles.overviewColAssignee} />
                  <col className={styles.overviewColDate} />
                  <col className={styles.overviewColElapsed} />
                  <col className={styles.overviewColStatus} />
                </colgroup>
                <thead>
                  <tr>
                    <SortableHeaderCell column={{ key: 'siteName' }} current={sort} label="현장" onChange={setSort} sortMenuOptions={buildSortMenuOptions('siteName', { asc: '현장 가나다순', desc: '현장 역순' })} />
                    <SortableHeaderCell column={{ key: 'reportTitle' }} current={sort} label="보고서" onChange={setSort} />
                    <SortableHeaderCell column={{ key: 'assigneeName' }} current={sort} label="지도요원" onChange={setSort} sortMenuOptions={buildSortMenuOptions('assigneeName', { asc: '지도요원 가나다순', desc: '지도요원 역순' })} />
                    <SortableHeaderCell column={{ key: 'visitDate' }} current={sort} defaultDirection="desc" label="지도 실시일" onChange={setSort} />
                    <SortableHeaderCell column={{ key: 'unsentDays' }} current={sort} defaultDirection="desc" label="미발송 경과" onChange={setSort} sortMenuOptions={buildSortMenuOptions('unsentDays', { asc: '최근 지도 우선', desc: '오래 미발송된 순' })} />
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.reportKey}
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
                      <td><span className={styles.overviewTablePrimaryText}>{row.siteName}</span></td>
                      <td><Link href={row.href} className={`${styles.tableInlineLink} ${styles.overviewTableWrapLink}`} onClick={stopOverviewRowNavigation}>{row.reportTitle}</Link></td>
                      <td><span className={styles.overviewTableMetric}>{row.assigneeName || '-'}</span></td>
                      <td><span className={styles.overviewTableMetric}>{row.visitDate}</span></td>
                      <td><span className={styles.overviewTableMetric}>{`D+${row.unsentDays}`}</span></td>
                      <td>
                        <span className={`${styles.overviewTableStatus} ${getDispatchStatusTone(row.dispatchStatus, styles)}`}>
                          {getDispatchStatusLabel(row.dispatchStatus)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {totalRows > 0 ? (
        <div className={styles.paginationRow}>
          <button type="button" className="app-button app-button-secondary" onClick={() => setPage((current) => clampPage(current - 1, totalPages))} disabled={currentPage <= 1}>이전</button>
          <span className={styles.paginationLabel}>{currentPage} / {totalPages} 페이지</span>
          <button type="button" className="app-button app-button-secondary" onClick={() => setPage((current) => clampPage(current + 1, totalPages))} disabled={currentPage >= totalPages}>다음</button>
        </div>
      ) : null}
    </section>
  );
}
