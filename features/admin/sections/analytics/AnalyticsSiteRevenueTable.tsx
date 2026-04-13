'use client';

import Link from 'next/link';
import { SortableHeaderCell, buildSortMenuOptions } from '@/features/admin/components/SortableHeaderCell';
import { formatCurrencyValue } from '@/lib/admin';
import { formatAnalyticsStatValue, type AdminAnalyticsSiteRevenueRow } from '@/features/admin/lib/buildAdminControlCenterModel';
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
    return <div className={sharedStyles.tableEmpty}>조건에 맞는 현장별 실적 데이터가 없습니다.</div>;
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
            <col className={localStyles.siteMoneyCol} />
            <col className={localStyles.siteRateCol} />
          </colgroup>
          <thead>
            <tr>
              <SortableHeaderCell column={{ key: 'siteName' }} current={sort} label="현장" onChange={setSort} sortMenuOptions={buildSortMenuOptions('siteName', { asc: '현장 가나다순', desc: '현장 역순' })} />
              <SortableHeaderCell column={{ key: 'headquarterName' }} current={sort} label="사업장" onChange={setSort} sortMenuOptions={buildSortMenuOptions('headquarterName', { asc: '사업장 가나다순', desc: '사업장 역순' })} />
              <SortableHeaderCell column={{ key: 'contractTypeLabel' }} current={sort} label="계약유형" onChange={setSort} sortMenuOptions={buildSortMenuOptions('contractTypeLabel', { asc: '계약유형 오름차순', desc: '계약유형 내림차순' })} />
              <SortableHeaderCell column={{ key: 'plannedRounds' }} current={sort} defaultDirection="desc" label="예정 회차" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'executedRounds' }} current={sort} defaultDirection="desc" label="회차" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'plannedRevenue' }} current={sort} defaultDirection="desc" label="계약금액" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'visitRevenue' }} current={sort} defaultDirection="desc" label="매출" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'executionRate' }} current={sort} defaultDirection="desc" label="실행률" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'avgPerVisitAmount' }} current={sort} defaultDirection="desc" label="평균 단가" onChange={setSort} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.siteId}>
                <td className={localStyles.textCell}><Link href={row.href} className={sharedStyles.tableInlineLink}>{row.siteName}</Link></td>
                <td className={localStyles.textCell}>{row.headquarterName}</td>
                <td className={localStyles.textCell}>{row.contractTypeLabel}</td>
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
