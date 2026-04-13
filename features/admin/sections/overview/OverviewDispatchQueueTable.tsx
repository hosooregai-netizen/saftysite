'use client';

import Link from 'next/link';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { formatOverviewCurrency } from './overviewSectionHelpers';

function renderEmptyRow(label: string) {
  return <div className={styles.tableEmpty}>{label}</div>;
}

interface OverviewDispatchQueueTableProps {
  emptyLabel: string;
  rows: Array<{
    headquarterName: string;
    href: string;
    openReportCount: number;
    projectAmount: number | null;
    recipientEmail: string;
    siteId: string;
    siteName: string;
  }>;
  title: string;
}

export function OverviewDispatchQueueTable({
  emptyLabel,
  rows,
  title,
}: OverviewDispatchQueueTableProps) {
  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard} ${styles.overviewTableCard}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.overviewTableHeaderBlock}>
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className={styles.overviewTableCount}>{rows.length.toLocaleString('ko-KR')}개 현장</span>
        </div>
      </div>
      <div className={styles.sectionBody}>
        {rows.length === 0 ? renderEmptyRow(emptyLabel) : (
          <div className={styles.tableShell}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>현장</th>
                    <th>사업장</th>
                    <th>공사금액</th>
                    <th>기본 수신자</th>
                    <th>미발송 보고서</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${title}-${row.siteId}`}>
                      <td>
                        <Link href={row.href} className={styles.tableInlineLink}>{row.siteName}</Link>
                      </td>
                      <td>{row.headquarterName}</td>
                      <td>{formatOverviewCurrency(row.projectAmount)}</td>
                      <td>{row.recipientEmail || '미등록'}</td>
                      <td>{`${row.openReportCount}건`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
