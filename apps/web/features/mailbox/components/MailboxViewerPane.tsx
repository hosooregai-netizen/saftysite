'use client';

import { stripHtmlToText } from '@/features/mailbox/components/mailboxComposeHelpers';
import { triggerDownload } from '@/lib/fileData';
import type { MailAttachmentRecord, MailThreadDetail, MailThread } from '@/types/mail';
import styles from './MailboxShell.module.css';
import { MailboxIcon } from './MailboxIcon';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function downloadAttachment(attachment: MailAttachmentRecord) {
  if (attachment.dataBase64) {
    const binary = window.atob(attachment.dataBase64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    triggerDownload({
      contentType: attachment.contentType || 'application/octet-stream',
      data: bytes,
      filename: attachment.filename,
    });
  } else if (attachment.downloadUrl) {
    window.open(attachment.downloadUrl, '_blank', 'noopener,noreferrer');
  }
}

function renderParticipantList(label: string, recipients: Array<{ email: string; name: string | null }>) {
  if (!recipients.length) return null;
  return (
    <div className={styles.viewerMetaRow}>
      <strong>{label}</strong>
      <span className={styles.viewerDetailValueMuted}>
        {recipients.map((recipient) => (recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email)).join(', ')}
      </span>
    </div>
  );
}

export function MailboxViewerPane({
  activeBox,
  detail,
  expandedMessageIds,
  onArchive,
  onForward,
  onReply,
  onRestore,
  onToggleHistory,
  onToggleStar,
  onTrash,
}: {
  activeBox: string;
  detail: MailThreadDetail | null;
  expandedMessageIds: Set<string>;
  onArchive: (thread: MailThread) => void;
  onForward: () => void;
  onReply: () => void;
  onRestore: (thread: MailThread) => void;
  onToggleHistory: (messageId: string) => void;
  onToggleStar: (thread: MailThread) => void;
  onTrash: (thread: MailThread) => void;
}) {
  if (!detail) {
    return (
      <section className={styles.viewer}>
        <div className={styles.viewerEmpty}>
          <strong className={styles.emptyTitle}>메일을 선택하세요.</strong>
          <p className={styles.emptyDescription}>가운데 목록에서 메일을 고르면 본문과 첨부, 답장 작업이 이곳에 표시됩니다.</p>
        </div>
      </section>
    );
  }

  const thread = detail.thread;
  const messages = detail.messages;
  const primaryMessage = messages[messages.length - 1] ?? null;
  const historyMessages = messages.slice(0, -1).reverse();

  return (
    <section className={styles.viewer}>
      <header className={styles.viewerHeader}>
        <div className={styles.viewerHeaderText}>
          <h2 className={styles.viewerTitle}>{thread.subject || '(제목 없음)'}</h2>
          <div className={styles.viewerMetaStack}>
            <div className={styles.viewerMetaRow}>
              <span className={`${styles.viewerStatusBadge} ${thread.isStarred ? styles.statusWarning : styles.statusMuted}`}>
                {thread.isStarred ? '중요 메일' : '일반 메일'}
              </span>
              {thread.archivedAt && !thread.trashedAt ? (
                <span className={`${styles.viewerStatusBadge} ${styles.statusMuted}`}>보관됨</span>
              ) : null}
              {thread.trashedAt ? <span className={`${styles.viewerStatusBadge} ${styles.statusMuted}`}>휴지통</span> : null}
            </div>
            <div className={styles.viewerMetaRow}>
              <strong>{thread.accountLabel || thread.accountDisplayName}</strong>
              <span className={styles.viewerDetailValueMuted}>{thread.accountEmail}</span>
            </div>
          </div>
        </div>

        <div className={styles.viewerActions}>
          <button type="button" className={styles.viewerTextButton} onClick={onReply}>
            <MailboxIcon name="reply" size={18} />
            <span>답장</span>
          </button>
          <button type="button" className={styles.viewerTextButton} onClick={onForward}>
            <MailboxIcon name="forward" size={18} />
            <span>전달</span>
          </button>
          <button type="button" className={styles.viewerActionButton} onClick={() => onToggleStar(thread)} aria-label="중요 메일 토글">
            <MailboxIcon name="star" size={18} />
          </button>
          {activeBox === 'trash' ? (
            <button type="button" className={styles.viewerTextButton} onClick={() => onRestore(thread)}>
              <MailboxIcon name="inbox" size={18} />
              <span>복원</span>
            </button>
          ) : (
            <>
              <button type="button" className={styles.viewerTextButton} onClick={() => onArchive(thread)}>
                <MailboxIcon name="archive" size={18} />
                <span>보관</span>
              </button>
              <button type="button" className={styles.viewerTextButton} onClick={() => onTrash(thread)}>
                <MailboxIcon name="trash" size={18} />
                <span>삭제</span>
              </button>
            </>
          )}
        </div>
      </header>

      <div className={styles.viewerScroller}>
        <div className={styles.viewerConversation}>
          {historyMessages.map((message) => {
            const expanded = expandedMessageIds.has(message.id);
            return expanded ? (
              <article key={message.id} className={styles.messageCard}>
                <div className={styles.viewerMessageHeader}>
                  <strong>{message.fromName || message.fromEmail}</strong>
                  <span className={styles.viewerDetailValueMuted}>{formatDateTime(message.sentAt || message.createdAt)}</span>
                </div>
                {renderParticipantList('받는 사람', message.to)}
                <button type="button" className={styles.messageSummaryButton} onClick={() => onToggleHistory(message.id)}>
                  접기
                </button>
                <div
                  className={styles.messageBody}
                  dangerouslySetInnerHTML={{ __html: message.body || '<p>(본문 없음)</p>' }}
                />
              </article>
            ) : (
              <button
                key={message.id}
                type="button"
                className={styles.messageSummaryButton}
                onClick={() => onToggleHistory(message.id)}
              >
                <div className={styles.viewerMessageHeader}>
                  <strong>{message.fromName || message.fromEmail}</strong>
                  <span className={styles.viewerDetailValueMuted}>{formatDateTime(message.sentAt || message.createdAt)}</span>
                </div>
                <div className={styles.threadMessageSummary}>
                  <span className={styles.messageSummaryPreview}>{stripHtmlToText(message.body || '').slice(0, 140) || '(본문 없음)'}</span>
                </div>
              </button>
            );
          })}

          {primaryMessage ? (
            <article className={styles.messageCard}>
              <div className={styles.viewerMessageHeader}>
                <strong>{primaryMessage.fromName || primaryMessage.fromEmail}</strong>
                <span className={styles.viewerDetailValueMuted}>{formatDateTime(primaryMessage.sentAt || primaryMessage.createdAt)}</span>
              </div>
              <div className={styles.viewerMetaStack}>
                <div className={styles.viewerMetaRow}>
                  <strong>보낸 사람</strong>
                  <span className={styles.viewerDetailValueMuted}>
                    {primaryMessage.fromName ? `${primaryMessage.fromName} <${primaryMessage.fromEmail}>` : primaryMessage.fromEmail}
                  </span>
                </div>
                {renderParticipantList('받는 사람', primaryMessage.to)}
                {renderParticipantList('참조', Array.isArray(primaryMessage.cc) ? primaryMessage.cc : [])}
              </div>
              <div
                className={styles.messageBody}
                dangerouslySetInnerHTML={{ __html: primaryMessage.body || '<p>(본문 없음)</p>' }}
              />
              {primaryMessage.attachments?.length ? (
                <div className={styles.viewerAttachmentList}>
                  {primaryMessage.attachments.map((attachment) => (
                    <button
                      key={`${attachment.filename}-${attachment.downloadUrl || attachment.dataBase64?.length || 0}`}
                      type="button"
                      className={styles.attachmentButton}
                      onClick={() => downloadAttachment(attachment)}
                    >
                      <MailboxIcon name="attachment" size={16} />
                      <span>{attachment.filename}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default MailboxViewerPane;
