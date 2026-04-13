'use client';

import type { MailThreadDetail } from '@/types/mail';
import localStyles from './MailboxPanel.module.css';

interface MailboxThreadDetailSectionProps {
  detailDescription: string;
  detailEmptyMessage: string;
  detailHints: string[];
  threadDetail: MailThreadDetail | null;
  title: string;
  onBackToList: () => void;
  onReply: () => void;
  renderMessageBodyHtml: (body: string) => string;
}

export function MailboxThreadDetailSection({
  detailDescription,
  detailEmptyMessage,
  detailHints,
  threadDetail,
  title,
  onBackToList,
  onReply,
  renderMessageBodyHtml,
}: MailboxThreadDetailSectionProps) {
  return (
    <section className={localStyles.stageCard}>
      <div className={localStyles.stageHeader}>
        <div className={localStyles.stageHeading}>
          <div className={localStyles.stageMetaRow}>
            <button
              type="button"
              className={`app-button app-button-secondary ${localStyles.backButton}`}
              onClick={onBackToList}
            >
              목록
            </button>
          </div>
          <h3 className={localStyles.panelTitle}>{title}</h3>
          <p className={localStyles.panelDescription}>{detailDescription}</p>
        </div>
        {threadDetail ? (
          <div className={localStyles.stageActions}>
            <button
              type="button"
              className={`app-button app-button-primary ${localStyles.submitButton}`}
              onClick={onReply}
            >
              답장
            </button>
          </div>
        ) : null}
      </div>
      {threadDetail ? (
        <>
          <div className={localStyles.messageList}>
            {threadDetail.messages.map((message) => (
              <article
                key={message.id}
                className={`${localStyles.messageCard} ${
                  message.direction === 'incoming'
                    ? localStyles.messageIncoming
                    : localStyles.messageOutgoing
                }`}
              >
                <strong className={localStyles.threadSubject}>
                  {message.direction === 'incoming' ? '수신' : '발신'} · {message.subject}
                </strong>
                <span className={localStyles.messageMeta}>
                  {message.fromEmail} · {message.sentAt || message.createdAt}
                </span>
                <div
                  className={localStyles.messageBody}
                  dangerouslySetInnerHTML={{ __html: renderMessageBodyHtml(message.body) }}
                />
              </article>
            ))}
          </div>
          <div className={localStyles.detailMetaRow}>
            {detailHints.map((hint) => (
              <span key={hint} className={localStyles.detailHint}>
                {hint}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className={localStyles.emptyState}>{detailEmptyMessage}</div>
      )}
    </section>
  );
}
