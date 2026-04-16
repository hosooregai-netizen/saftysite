'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  clampPage,
  isOverviewRowActivationKey,
  stopOverviewRowNavigation,
} from './overviewSectionHelpers';

interface OverviewEndingSoonSectionProps {
  currentPage: number;
  rows: Array<{
    deadlineLabel: string;
    daysUntilEnd: number;
    endDate: string;
    endDateSource: 'contract_end_date' | 'project_end_date' | '';
    headquarterName: string;
    href: string;
    siteId: string;
    siteName: string;
  }>;
  setPage: (updater: (current: number) => number) => void;
  totalPages: number;
  totalRows: number;
}

function getEndDateSourceLabel(value: OverviewEndingSoonSectionProps['rows'][number]['endDateSource']) {
  if (value === 'contract_end_date') return '계약종료일';
  if (value === 'project_end_date') return '공사종료일';
  return '-';
}

export function OverviewEndingSoonSection({
  currentPage,
  rows,
  setPage,
  totalPages,
  totalRows,
}: OverviewEndingSoonSectionProps) {
  const router = useRouter();

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard} ${styles.overviewTableCard}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.overviewTableHeaderBlock}>
          <h2 className={styles.sectionTitle}>종료 예정 현황</h2>
          <div className={styles.overviewTableScope}>오늘부터 14일 이내</div>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className={styles.overviewTableCount}>{totalRows.toLocaleString('ko-KR')}개 현장</span>
        </div>
      </div>
      <div className={styles.sectionBody}>
        {totalRows === 0 ? (
          <div className={styles.tableEmpty}>현재 2주 이내 종료 예정인 현장이 없습니다.</div>
        ) : (
          <div className={styles.tableShell}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>현장</th>
                    <th>본사</th>
                    <th>종료 기준</th>
                    <th>종료일</th>
                    <th>남은 기간</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
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
                      <td>
                        <Link href={row.href} className={styles.tableInlineLink} onClick={stopOverviewRowNavigation}>{row.siteName}</Link>
                      </td>
                      <td>{row.headquarterName}</td>
                      <td>{getEndDateSourceLabel(row.endDateSource)}</td>
                      <td>{row.endDate || '-'}</td>
                      <td>
                        <span className={styles.overviewTableStatus}>{row.deadlineLabel}</span>
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
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => setPage((current) => clampPage(current - 1, totalPages))}
            disabled={currentPage <= 1}
          >
            이전
          </button>
          <span className={styles.paginationLabel}>
            {currentPage} / {totalPages} 페이지
          </span>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => setPage((current) => clampPage(current + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            다음
          </button>
        </div>
      ) : null}
    </section>
  );
}
