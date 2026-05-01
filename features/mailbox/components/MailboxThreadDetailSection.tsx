'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { MailMessage, MailThreadDetail } from '@/types/mail';
import localStyles from './MailboxPanel.module.css';

type ThreadMessage = MailThreadDetail['messages'][number];

interface MailboxThreadDetailSectionProps {
  detailEmptyMessage: string;
  showResend: boolean;
  threadDetail: MailThreadDetail | null;
  title: string;
  onBackToList: () => void;
  onForward: () => void;
  onReply: () => void;
  onResend: () => void;
  renderMessageBodyHtml: (body: string) => string;
}

function buildSenderLabel(message: ThreadMessage) {
  return message.fromName?.trim()
    ? `${message.fromName} <${message.fromEmail}>`
    : message.fromEmail;
}

function buildMessageTimestamp(message: ThreadMessage) {
  return message.sentAt || message.createdAt;
}

function measureMailBodyFrame(frame: HTMLIFrameElement | null, minHeight: number) {
  try {
    const document = frame?.contentDocument;
    if (!document) return minHeight;
    return Math.max(
      document.body?.scrollHeight || 0,
      document.body?.offsetHeight || 0,
      document.documentElement?.scrollHeight || 0,
      document.documentElement?.offsetHeight || 0,
      minHeight,
    );
  } catch {
    return minHeight;
  }
}

function observeMailBodyFrame(frame: HTMLIFrameElement, onResize: () => void) {
  let document: Document | null = null;
  try {
    document = frame.contentDocument;
  } catch {
    return () => {};
  }
  if (!document) return () => {};

  const cleanups: Array<() => void> = [];

  if (typeof MutationObserver !== 'undefined') {
    const mutationObserver = new MutationObserver(() => onResize());
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    cleanups.push(() => mutationObserver.disconnect());
  }

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(() => onResize());
    if (document.body) {
      resizeObserver.observe(document.body);
    }
    resizeObserver.observe(document.documentElement);
    cleanups.push(() => resizeObserver.disconnect());
  }

  const handleImageResize = () => onResize();
  for (const image of Array.from(document.images)) {
    if (image.complete) continue;
    image.addEventListener('load', handleImageResize);
    image.addEventListener('error', handleImageResize);
    cleanups.push(() => {
      image.removeEventListener('load', handleImageResize);
      image.removeEventListener('error', handleImageResize);
    });
  }

  const frameWindow = frame.contentWindow;
  if (frameWindow) {
    frameWindow.addEventListener('resize', onResize);
    cleanups.push(() => frameWindow.removeEventListener('resize', onResize));
  }

  const timeoutIds = [0, 180, 480].map((delay) => window.setTimeout(onResize, delay));
  cleanups.push(() => {
    timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

function MailBodyFrame({
  html,
  minHeight,
  title,
}: {
  html: string;
  minHeight: number;
  title: string;
}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, [html, minHeight]);

  const handleLoad = () => {
    cleanupRef.current?.();
    const frame = frameRef.current;
    if (!frame) return;
    const syncHeight = () => {
      const nextHeight = measureMailBodyFrame(frame, minHeight);
      setHeight((current) => (current === nextHeight ? current : nextHeight));
    };
    window.requestAnimationFrame(syncHeight);
    cleanupRef.current = observeMailBodyFrame(frame, syncHeight);
  };

  return (
    <div className={localStyles.mailBodyFrameShell}>
      <iframe
        ref={frameRef}
        title={title}
        className={localStyles.mailBodyFrame}
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        referrerPolicy="no-referrer"
        srcDoc={html}
        style={{ height, minHeight }}
        onLoad={handleLoad}
      />
    </div>
  );
}

function DetailHistoryItem({
  message,
  renderMessageBodyHtml,
}: {
  message: MailMessage;
  renderMessageBodyHtml: (body: string) => string;
}) {
  return (
    <article className={localStyles.detailHistoryItem}>
      <div className={localStyles.detailHistoryHeader}>
        <div className={localStyles.detailHistoryMetaBlock}>
          <strong className={localStyles.detailHistorySender}>
            {buildSenderLabel(message)}
          </strong>
          <span className={localStyles.messageMeta}>{buildMessageTimestamp(message)}</span>
        </div>
        <span className={localStyles.messageDirectionBadge}>
          {message.direction === 'incoming' ? '수신' : '발신'}
        </span>
      </div>
      <strong className={localStyles.detailHistorySubject}>
        {message.subject || '(제목 없음)'}
      </strong>
      <MailBodyFrame
        html={renderMessageBodyHtml(message.body)}
        minHeight={420}
        title={message.subject || '이전 메시지 본문'}
      />
    </article>
  );
}

export function MailboxThreadDetailSection({
  detailEmptyMessage,
  showResend,
  threadDetail,
  title,
  onBackToList,
  onForward,
  onReply,
  onResend,
  renderMessageBodyHtml,
}: MailboxThreadDetailSectionProps) {
  const primaryMessage = threadDetail
    ? threadDetail.messages[threadDetail.messages.length - 1]
    : null;
  const previousMessages =
    threadDetail && threadDetail.messages.length > 1
      ? threadDetail.messages.slice(0, -1).reverse()
      : [];

  return (
    <section className={`${styles.tableShell} ${localStyles.workspaceSection}`}>
      {threadDetail && primaryMessage ? (
        <div className={localStyles.detailReadShell}>
          <div className={localStyles.detailHeaderBlock}>
            <div className={localStyles.detailSubjectRow}>
              <button
                type="button"
                className={`app-button app-button-secondary ${localStyles.backButton}`}
                onClick={onBackToList}
              >
                목록
              </button>
              <strong className={localStyles.detailSubject}>
                {primaryMessage.subject || title}
              </strong>
            </div>

            <div className={localStyles.detailInfoRow}>
              <div className={localStyles.detailMetaLine}>
                <span className={localStyles.detailSender}>{buildSenderLabel(primaryMessage)}</span>
                <span className={localStyles.detailMetaDivider}>/</span>
                <span className={localStyles.messageMeta}>
                  {buildMessageTimestamp(primaryMessage)}
                </span>
              </div>

              <div className={localStyles.detailActionInline}>
                <button
                  type="button"
                  className={localStyles.detailActionButton}
                  onClick={onReply}
                >
                  답장
                </button>
                <span className={localStyles.detailActionDivider}>/</span>
                <button
                  type="button"
                  className={localStyles.detailActionButton}
                  onClick={onForward}
                >
                  전달
                </button>
                {showResend ? (
                  <>
                    <span className={localStyles.detailActionDivider}>/</span>
                    <button
                      type="button"
                      className={localStyles.detailActionButton}
                      onClick={onResend}
                    >
                      다시 보내기
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className={localStyles.detailBodySection}>
            <div className={localStyles.detailPrimaryMessage}>
              <MailBodyFrame
                html={renderMessageBodyHtml(primaryMessage.body)}
                minHeight={680}
                title={primaryMessage.subject || '메일 본문'}
              />
            </div>

            {previousMessages.length > 0 ? (
              <div className={localStyles.detailHistoryList}>
                {previousMessages.map((message) => (
                  <DetailHistoryItem
                    key={message.id}
                    message={message}
                    renderMessageBodyHtml={renderMessageBodyHtml}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={styles.tableEmpty}>{detailEmptyMessage}</div>
      )}
    </section>
  );
}
