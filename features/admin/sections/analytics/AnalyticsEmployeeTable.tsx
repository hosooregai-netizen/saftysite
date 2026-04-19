'use client';

import { SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import { formatCurrencyValue } from '@/lib/admin';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import localStyles from '@/features/admin/sections/analytics/AnalyticsSection.module.css';
import type { TableSortState } from '@/types/admin';
import type { AdminAnalyticsEmployeeRow } from '@/features/admin/lib/buildAdminControlCenterModel';

interface AnalyticsEmployeeTableProps {
  rows: AdminAnalyticsEmployeeRow[];
  setSort: (next: TableSortState) => void;
  sort: TableSortState;
}

export function AnalyticsEmployeeTable({ rows, setSort, sort }: AnalyticsEmployeeTableProps) {
  if (rows.length === 0) {
    return <div className={sharedStyles.tableEmpty}>조건에 맞는 직원 실적 데이터가 없습니다.</div>;
  }

  return (
    <div className={sharedStyles.tableShell}>
      <div className={`${sharedStyles.tableWrap} ${localStyles.detailTableWrap}`}>
        <table className={`${sharedStyles.table} ${localStyles.detailTable}`}>
          <colgroup>
            <col className={localStyles.employeeNameCol} />
            <col className={localStyles.employeeCountCol} />
            <col className={localStyles.employeeCountCol} />
            <col className={localStyles.employeeCountCol} />
            <col className={localStyles.employeeMoneyCol} />
            <col className={localStyles.employeeMoneyCol} />
            <col className={localStyles.employeeMoneyCol} />
          </colgroup>
          <thead>
            <tr>
              <SortableHeaderCell column={{ key: 'userName' }} current={sort} label="지도요원명" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'assignedSiteCount' }} current={sort} defaultDirection="desc" label="담당 현장" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'plannedRounds' }} current={sort} defaultDirection="desc" label="계약 회차" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'executedRounds' }} current={sort} defaultDirection="desc" label="실회차" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'plannedRevenue' }} current={sort} defaultDirection="desc" label="계약 매출" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'visitRevenue' }} current={sort} defaultDirection="desc" label="매출" onChange={setSort} />
              <SortableHeaderCell column={{ key: 'avgPerVisitAmount' }} current={sort} defaultDirection="desc" label="평균 회차 단가" onChange={setSort} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId}>
                <td className={localStyles.textCell}>
                  <div className={sharedStyles.tablePrimary}>{row.userName}</div>
                </td>
                <td className={localStyles.numberCell}>{row.assignedSiteCount}개</td>
                <td className={localStyles.numberCell}>{row.plannedRounds}회</td>
                <td className={localStyles.numberCell}>{row.executedRounds}회</td>
                <td className={localStyles.numberCell}>{formatCurrencyValue(row.plannedRevenue)}</td>
                <td className={localStyles.numberCell}>{formatCurrencyValue(row.visitRevenue)}</td>
                <td className={localStyles.numberCell}>{formatCurrencyValue(row.avgPerVisitAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
