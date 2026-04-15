'use client';

import Link from 'next/link';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyAdminPriorityQuarterlyManagementRow } from '@/types/admin';
import { formatOverviewCurrency } from './overviewSectionHelpers';

interface OverviewPriorityQuarterlyManagementSectionProps {
  rows: SafetyAdminPriorityQuarterlyManagementRow[];
}

function formatQuarterLabel(value: Date) {
  const quarter = Math.floor(value.getMonth() / 3) + 1;
  return `${value.getFullYear()}년 ${quarter}분기`;
}

function formatLatestGuidance(row: SafetyAdminPriorityQuarterlyManagementRow) {
  if (!row.latestGuidanceDate && row.latestGuidanceRound == null) {
    return '-';
  }
  if (!row.latestGuidanceDate) {
    return `${row.latestGuidanceRound}차`;
  }
  if (row.latestGuidanceRound == null) {
    return row.latestGuidanceDate;
  }
  return `${row.latestGuidanceDate} / ${row.latestGuidanceRound}차`;
}

function getStatusLabel(status: SafetyAdminPriorityQuarterlyManagementRow['quarterlyDispatchStatus']) {
  switch (status) {
    case 'sent':
      return '발송 완료';
    case 'overdue':
      return '발송 지연';
    case 'pending':
      return '발송 대기';
    case 'report_missing':
    default:
      return '보고서 미생성';
  }
}

function getStatusTone(
  status: SafetyAdminPriorityQuarterlyManagementRow['quarterlyDispatchStatus'],
) {
  switch (status) {
    case 'sent':
      return styles.overviewTableStatusSuccess;
    case 'pending':
      return styles.overviewTableStatusWarning;
    case 'overdue':
    case 'report_missing':
      return styles.overviewTableStatusDanger;
    default:
      return styles.overviewTableStatusNeutral;
  }
}

export function OverviewPriorityQuarterlyManagementSection({
  rows,
}: OverviewPriorityQuarterlyManagementSectionProps) {
  const quarterLabel = rows[0]?.currentQuarterLabel || formatQuarterLabel(new Date());

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard} ${styles.overviewTableCard}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.overviewTableHeaderBlock}>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>20억 이상 분기보고서 관리</h2>
            <span className={styles.sectionHeaderMeta}>{quarterLabel}</span>
          </div>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className={styles.overviewTableCount}>{rows.length.toLocaleString('ko-KR')}개 현장</span>
        </div>
      </div>
      <div className={styles.sectionBody}>
        {rows.length === 0 ? (
          <div className={styles.tableEmpty}>현재 관리가 필요한 20억 이상 활성 현장이 없습니다.</div>
        ) : (
          <div className={styles.tableShell}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>현장</th>
                    <th>사업장</th>
                    <th>공사금액</th>
                    <th>최근 지도</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    return (
                      <tr key={row.siteId}>
                        <td>
                          <Link href={row.href} className={styles.tableInlineLink}>
                            {row.siteName}
                          </Link>
                        </td>
                        <td>{row.headquarterName}</td>
                        <td>{formatOverviewCurrency(row.projectAmount)}</td>
                        <td>{formatLatestGuidance(row)}</td>
                        <td>
                          <span
                            className={`${styles.overviewTableStatus} ${getStatusTone(row.quarterlyDispatchStatus)}`}
                          >
                            {getStatusLabel(row.quarterlyDispatchStatus)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
