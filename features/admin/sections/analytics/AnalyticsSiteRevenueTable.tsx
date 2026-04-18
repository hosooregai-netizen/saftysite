'use client';

import Link from 'next/link';
import { SortableHeaderCell, buildSortMenuOptions } from '@/features/admin/components/SortableHeaderCell';
import { formatCurrencyValue } from '@/lib/admin';
import {
  formatAnalyticsStatValue,
  type AdminAnalyticsSiteRevenueRow,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import localStyles from '@/features/admin/sections/analytics/AnalyticsSection.module.css';
import type { TableSortState } from '@/types/admin';

interface AnalyticsSiteRevenueTableProps {
  rows: AdminAnalyticsSiteRevenueRow[];
  setSort: (next: TableSortState) => void;
  sort: TableSortState;
}

export function AnalyticsSiteRevenueTable({
  rows,
  setSort,
  sort,
}: AnalyticsSiteRevenueTableProps) {
  if (rows.length === 0) {
    return <div className={sharedStyles.tableEmpty}>조건에 맞는 현장 실적 데이터가 없습니다.</div>;
  }

  return (
    <div className={sharedStyles.tableShell}>
      <div className={`${sharedStyles.tableWrap} ${localStyles.detailTableWrap}`}>
        <table className={`${sharedStyles.table} ${localStyles.detailTable}`}>
          <colgroup>
            <col className={localStyles.siteNameCol} />
            <col className={localStyles.siteBusinessCol} />
            <col className={localStyles.siteTypeCol} />
            <col className={localStyles.siteCountCol} />
            <col className={localStyles.siteCountCol} />
            <col className={localStyles.siteMoneyCol} />
            <col className={localStyles.siteMoneyCol} />
            <col className={localStyles.siteRateCol} />
            <col className={localStyles.siteMoneyCol} />
          </colgroup>
          <thead>
            <tr>
              <SortableHeaderCell
                column={{ key: 'siteName' }}
                current={sort}
                label="현장"
                onChange={setSort}
                sortMenuOptions={buildSortMenuOptions('siteName', {
                  asc: '현장 오름차순',
                  desc: '현장 내림차순',
                })}
              />
              <SortableHeaderCell
                column={{ key: 'headquarterName' }}
                current={sort}
                label="사업장"
                onChange={setSort}
                sortMenuOptions={buildSortMenuOptions('headquarterName', {
                  asc: '사업장 오름차순',
                  desc: '사업장 내림차순',
                })}
              />
              <SortableHeaderCell
                column={{ key: 'assigneeName' }}
                current={sort}
                label="담당자"
                onChange={setSort}
                sortMenuOptions={buildSortMenuOptions('assigneeName', {
                  asc: '담당자 오름차순',
                  desc: '담당자 내림차순',
                })}
              />
              <SortableHeaderCell column={{ key: 'plannedRounds' }} current={sort} defaultDirection="desc" label="계약 회차" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'executedRounds' }} current={sort} defaultDirection="desc" label="실회차" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'plannedRevenue' }} current={sort} defaultDirection="desc" label="계약금액" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'visitRevenue' }} current={sort} defaultDirection="desc" label="매출" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'executionRate' }} current={sort} defaultDirection="desc" label="실적률" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'avgPerVisitAmount' }} current={sort} defaultDirection="desc" label="평균 회차 단가" onChange={setSort} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.siteId} className={row.isSummaryRow ? sharedStyles.tableSummaryRow : undefined}>
                <td className={localStyles.textCell}>
                  {row.isSummaryRow || !row.href ? (
                    <strong className={sharedStyles.tablePrimary}>{row.siteName}</strong>
                  ) : (
                    <Link href={row.href} className={sharedStyles.tableInlineLink}>
                      {row.siteName}
                    </Link>
                  )}
                </td>
                <td className={localStyles.textCell}>{row.headquarterName}</td>
                <td className={localStyles.textCell}>{row.assigneeName || '-'}</td>
                <td className={localStyles.numberCell}>{row.plannedRounds}회</td>
                <td className={localStyles.numberCell}>{row.executedRounds}회</td>
                <td className={localStyles.numberCell}>{formatCurrencyValue(row.plannedRevenue)}</td>
                <td className={localStyles.numberCell}>{formatCurrencyValue(row.visitRevenue)}</td>
                <td className={localStyles.numberCell}>{formatAnalyticsStatValue('percent', row.executionRate)}</td>
                <td className={localStyles.numberCell}>{formatCurrencyValue(row.avgPerVisitAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
