'use client';

import Link from 'next/link';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyAdminPriorityQuarterlyManagementRow } from '@/types/admin';
import { formatOverviewCurrency } from './overviewSectionHelpers';

interface OverviewPriorityQuarterlyManagementSectionProps {
  rows: SafetyAdminPriorityQuarterlyManagementRow[];
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

function getReflectionLabel(status: SafetyAdminPriorityQuarterlyManagementRow['quarterlyReflectionStatus']) {
  return status === 'created' ? '반영 완료' : '미반영';
}

function getDispatchLabel(status: SafetyAdminPriorityQuarterlyManagementRow['quarterlyDispatchStatus']) {
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

function getBadgeClassName(isOk: boolean) {
  return `${styles.tableBadge} ${isOk ? styles.tableBadgeAccent : styles.tableBadgeWarning}`;
}

export function OverviewPriorityQuarterlyManagementSection({
  rows,
}: OverviewPriorityQuarterlyManagementSectionProps) {
  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard} ${styles.overviewTableCard}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.overviewTableHeaderBlock}>
          <h2 className={styles.sectionTitle}>20억 이상 분기보고서 관리</h2>
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
                    <th>현재 분기</th>
                    <th>반영 상태</th>
                    <th>발송 상태</th>
                    <th>예외 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isOk = row.exceptionStatus === 'ok';
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
                          {row.quarterlyReportHref ? (
                            <Link href={row.quarterlyReportHref} className={styles.tableInlineLink}>
                              {row.currentQuarterLabel}
                            </Link>
                          ) : (
                            row.currentQuarterLabel
                          )}
                        </td>
                        <td>
                          <span className={getBadgeClassName(row.quarterlyReflectionStatus === 'created')}>
                            {getReflectionLabel(row.quarterlyReflectionStatus)}
                          </span>
                        </td>
                        <td>
                          <span className={getBadgeClassName(row.quarterlyDispatchStatus === 'sent')}>
                            {getDispatchLabel(row.quarterlyDispatchStatus)}
                          </span>
                        </td>
                        <td>
                          <span className={getBadgeClassName(isOk)}>{row.exceptionLabel}</span>
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
