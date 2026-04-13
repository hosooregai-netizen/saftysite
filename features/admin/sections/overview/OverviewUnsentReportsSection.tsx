'use client';

import Link from 'next/link';
import { buildSortMenuOptions, SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import { getDispatchStatusLabel } from '@/lib/admin/reportMeta';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyAdminUnsentReportRow, TableSortState } from '@/types/admin';
import { clampPage, getDispatchStatusTone } from './overviewSectionHelpers';

interface OverviewUnsentReportsSectionProps {
  currentPage: number;
  isRefreshing: boolean;
  rows: SafetyAdminUnsentReportRow[];
  setPage: (updater: (current: number) => number) => void;
  setSort: (next: TableSortState) => void;
  sort: TableSortState;
  totalPages: number;
  totalRows: number;
}

export function OverviewUnsentReportsSection({
  currentPage,
  isRefreshing,
  rows,
  setPage,
  setSort,
  sort,
  totalPages,
  totalRows,
}: OverviewUnsentReportsSectionProps) {
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
                  <col className={styles.overviewColSite} />
                  <col className={styles.overviewColHeadquarter} />
                  <col className={styles.overviewColReport} />
                  <col className={styles.overviewColType} />
                  <col className={styles.overviewColAssignee} />
                  <col className={styles.overviewColDate} />
                  <col className={styles.overviewColElapsed} />
                  <col className={styles.overviewColMetric} />
                  <col className={styles.overviewColMetric} />
                  <col className={styles.overviewColStatus} />
                </colgroup>
                <thead>
                  <tr>
                    <SortableHeaderCell column={{ key: 'siteName' }} current={sort} label="현장" onChange={setSort} sortMenuOptions={buildSortMenuOptions('siteName', { asc: '현장 가나다순', desc: '현장 역순' })} />
                    <SortableHeaderCell column={{ key: 'headquarterName' }} current={sort} label="사업장" onChange={setSort} sortMenuOptions={buildSortMenuOptions('headquarterName', { asc: '사업장 가나다순', desc: '사업장 역순' })} />
                    <SortableHeaderCell column={{ key: 'reportTitle' }} current={sort} label="보고서" onChange={setSort} />
                    <th>유형</th>
                    <SortableHeaderCell column={{ key: 'assigneeName' }} current={sort} label="담당자" onChange={setSort} sortMenuOptions={buildSortMenuOptions('assigneeName', { asc: '담당자 가나다순', desc: '담당자 역순' })} />
                    <SortableHeaderCell column={{ key: 'visitDate' }} current={sort} defaultDirection="desc" label="지도 실시일" onChange={setSort} />
                    <SortableHeaderCell column={{ key: 'unsentDays' }} current={sort} defaultDirection="desc" label="미발송 경과" onChange={setSort} sortMenuOptions={buildSortMenuOptions('unsentDays', { asc: '최근 지도 우선', desc: '오래 미발송된 순' })} />
                    <th>기본 수신자</th>
                    <th>메일 상태</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.reportKey}>
                      <td><div className={styles.tablePrimary}>{row.siteName}</div></td>
                      <td><span className={styles.overviewTableMuted}>{row.headquarterName}</span></td>
                      <td><Link href={row.href} className={`${styles.tableInlineLink} ${styles.overviewTableWrapLink}`}>{row.reportTitle}</Link></td>
                      <td><span className={styles.overviewTableMuted}>{row.reportTypeLabel}</span></td>
                      <td><span className={styles.overviewTableMetric}>{row.assigneeName || '-'}</span></td>
                      <td><span className={styles.overviewTableMetric}>{row.visitDate}</span></td>
                      <td><span className={styles.overviewTableMetric}>{`D+${row.unsentDays}`}</span></td>
                      <td><span className={styles.overviewTableMetric}>{row.recipientEmail || '미등록'}</span></td>
                      <td><span className={styles.overviewTableMetric}>{row.mailReady ? '발송 가능' : row.mailMissingReason || '보완 필요'}</span></td>
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
          <button type="button" className="app-button app-button-secondary" onClick={() => setPage((current) => clampPage(current - 1, totalPages))} disabled={isRefreshing || currentPage <= 1}>이전</button>
          <span className={styles.paginationLabel}>{currentPage} / {totalPages} 페이지</span>
          <button type="button" className="app-button app-button-secondary" onClick={() => setPage((current) => clampPage(current + 1, totalPages))} disabled={isRefreshing || currentPage >= totalPages}>다음</button>
        </div>
      ) : null}
    </section>
  );
}
