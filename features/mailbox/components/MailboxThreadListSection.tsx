'use client';

import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { MailboxThreadPagination } from './MailboxThreadPagination';
import localStyles from './MailboxPanel.module.css';

interface MailboxThreadListRow {
  id: string;
  isUnread: boolean;
  partyLabel: string;
  subject: string;
  timestamp: string;
}

interface MailboxThreadListSectionProps {
  canGoNextThreadPage: boolean;
  canGoPrevThreadPage: boolean;
  emptyMessage: string;
  page: number;
  pageCount: number;
  primaryColumnLabel: string;
  rangeEnd: number;
  rangeStart: number;
  rows: MailboxThreadListRow[];
  title: string;
  total: number;
  onMovePage: (nextPage: number) => void;
  onOpenThread: (threadId: string) => void;
}

export function MailboxThreadListSection({
  canGoNextThreadPage,
  canGoPrevThreadPage,
  emptyMessage,
  page,
  pageCount,
  primaryColumnLabel,
  rangeEnd,
  rangeStart,
  rows,
  title,
  total,
  onMovePage,
  onOpenThread,
}: MailboxThreadListSectionProps) {
  return (
    <section className={styles.tableShell}>
      <div className={localStyles.mailTableHeader}>
        <div className={localStyles.mailTableHeaderMeta}>
          <strong className={localStyles.panelTitle}>{title}</strong>
          <span className={localStyles.inlineMeta}>
            표시 {rangeStart}-{rangeEnd} / 전체 {total}건
          </span>
        </div>
        {total > 0 ? (
          <div className={localStyles.pagination}>
            <MailboxThreadPagination
              canGoNextThreadPage={canGoNextThreadPage}
              canGoPrevThreadPage={canGoPrevThreadPage}
              meta={`${page} / ${pageCount}`}
              page={page}
              pageCount={pageCount}
              onMovePage={onMovePage}
            />
          </div>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div className={styles.tableEmpty}>{emptyMessage}</div>
      ) : (
        <>
          <div className={`${styles.tableWrap} ${localStyles.mailTableWrap}`}>
            <table className={`${styles.table} ${localStyles.mailTable}`}>
              <thead>
                <tr>
                  <th>{primaryColumnLabel}</th>
                  <th>제목</th>
                  <th>첨부</th>
                  <th>일시</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`${styles.tableClickableRow} ${localStyles.mailTableRow} ${row.isUnread ? localStyles.mailRowUnread : ''}`}
                    tabIndex={0}
                    onClick={() => onOpenThread(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onOpenThread(row.id);
                      }
                    }}
                  >
                    <td>
                      <span className={`${styles.tablePrimary} ${localStyles.mailTablePrimary}`}>{row.partyLabel}</span>
                    </td>
                    <td>
                      <span className={`${styles.tablePrimary} ${localStyles.mailTablePrimary}`}>{row.subject}</span>
                    </td>
                    <td className={localStyles.mailAttachmentCell}>-</td>
                    <td className={localStyles.mailDateCell}>{row.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.paginationRow}>
            <MailboxThreadPagination
              canGoNextThreadPage={canGoNextThreadPage}
              canGoPrevThreadPage={canGoPrevThreadPage}
              meta={`${rangeStart}-${rangeEnd} / ${total}건 · ${page} / ${pageCount}`}
              page={page}
              pageCount={pageCount}
              onMovePage={onMovePage}
            />
          </div>
        </>
      )}
    </section>
  );
}
