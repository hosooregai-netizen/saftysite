'use client';

import Link from 'next/link';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { formatOverviewCurrency } from './overviewSectionHelpers';

function renderEmptyRow(label: string) {
  return <div className={styles.tableEmpty}>{label}</div>;
}

interface OverviewDispatchQueueTableRow {
  dispatchAlertsEnabled?: boolean;
  dispatchPolicyEnabled?: boolean;
  headquarterName: string;
  href: string;
  openReportCount: number;
  projectAmount: number | null;
  recipientEmail: string;
  siteId: string;
  siteName: string;
}

interface OverviewDispatchQueueTableProps {
  emptyLabel: string;
  isUpdating?: boolean;
  onToggleDispatchAlerts?: (
    siteId: string,
    enabled: boolean,
    alertsEnabled: boolean,
  ) => void;
  onToggleDispatchPolicy?: (
    siteId: string,
    enabled: boolean,
    alertsEnabled: boolean,
  ) => void;
  rows: OverviewDispatchQueueTableRow[];
  title: string;
  updatingSiteId?: string | null;
}

export function OverviewDispatchQueueTable({
  emptyLabel,
  isUpdating = false,
  onToggleDispatchAlerts,
  onToggleDispatchPolicy,
  rows,
  title,
  updatingSiteId = null,
}: OverviewDispatchQueueTableProps) {
  const showDispatchControls = Boolean(onToggleDispatchPolicy && onToggleDispatchAlerts);

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
                    <th>기본 수신처</th>
                    <th>미발송 보고서</th>
                    {showDispatchControls ? <th>발송관리대상</th> : null}
                    {showDispatchControls ? <th>알림</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const dispatchPolicyEnabled = row.dispatchPolicyEnabled !== false;
                    const dispatchAlertsEnabled =
                      dispatchPolicyEnabled && row.dispatchAlertsEnabled !== false;
                    const isRowUpdating = updatingSiteId === row.siteId;
                    const isDisabled = isUpdating || isRowUpdating;

                    return (
                      <tr key={`${title}-${row.siteId}`}>
                        <td>
                          <Link href={row.href} className={styles.tableInlineLink}>{row.siteName}</Link>
                        </td>
                        <td>{row.headquarterName}</td>
                        <td>{formatOverviewCurrency(row.projectAmount)}</td>
                        <td>{row.recipientEmail || '미등록'}</td>
                        <td>{`${row.openReportCount}건`}</td>
                        {showDispatchControls ? (
                          <td>
                            <label className={styles.tableCheckboxLabel}>
                              <input
                                type="checkbox"
                                checked={dispatchPolicyEnabled}
                                disabled={isDisabled}
                                onChange={(event) =>
                                  onToggleDispatchPolicy?.(
                                    row.siteId,
                                    event.target.checked,
                                    event.target.checked ? dispatchAlertsEnabled : false,
                                  )
                                }
                              />
                              <span>{dispatchPolicyEnabled ? '사용' : '해제'}</span>
                            </label>
                          </td>
                        ) : null}
                        {showDispatchControls ? (
                          <td>
                            <label className={styles.tableCheckboxLabel}>
                              <input
                                type="checkbox"
                                checked={dispatchAlertsEnabled}
                                disabled={isDisabled || !dispatchPolicyEnabled}
                                onChange={(event) =>
                                  onToggleDispatchAlerts?.(
                                    row.siteId,
                                    dispatchPolicyEnabled,
                                    event.target.checked,
                                  )
                                }
                              />
                              <span>{dispatchAlertsEnabled ? '표시' : '숨김'}</span>
                            </label>
                          </td>
                        ) : null}
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
