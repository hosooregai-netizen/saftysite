'use client';

import type { MailboxDraft, MailThread, MailboxBox } from '@/types/mail';
import styles from './MailboxShell.module.css';
import { MailboxIcon } from './MailboxIcon';

function threadBadges(thread: MailThread) {
  return [thread.siteId, thread.reportKey].filter(Boolean) as string[];
}

export function MailboxThreadListPane({
  activeBox,
  drafts,
  loading,
  query,
  searchBox,
  selectedDraftId,
  selectedThreadId,
  threads,
  onDeleteDraft,
  onOpenDraft,
  onOpenThread,
  onSearchBoxChange,
  onToggleStar,
}: {
  activeBox: MailboxBox;
  drafts: MailboxDraft[];
  loading: boolean;
  query: string;
  searchBox: MailboxBox;
  selectedDraftId: string;
  selectedThreadId: string;
  threads: MailThread[];
  onDeleteDraft: (draftId: string) => void;
  onOpenDraft: (draft: MailboxDraft) => void;
  onOpenThread: (threadId: string) => void;
  onSearchBoxChange: (value: MailboxBox) => void;
  onToggleStar: (thread: MailThread) => void;
}) {
  const searching = query.trim().length > 0;
  const title = searching
    ? '검색 결과'
    : activeBox === 'drafts'
      ? '임시보관함'
      : activeBox === 'sent'
        ? '보낸편지함'
        : activeBox === 'starred'
          ? '중요 메일'
          : activeBox === 'trash'
            ? '휴지통'
            : activeBox === 'all'
              ? '전체 메일'
              : '받은편지함';

  const filters: MailboxBox[] = ['all', 'inbox', 'sent', 'drafts', 'starred', 'trash'];
  const filterLabels: Record<MailboxBox, string> = {
    all: '전체 메일',
    drafts: '임시보관함',
    inbox: '받은편지함',
    sent: '보낸편지함',
    starred: '중요',
    trash: '휴지통',
  };

  return (
    <section className={styles.mainColumn}>
      <div className={styles.paneToolbar}>
        <div className={styles.threadHeader}>
          <div className={styles.threadHeaderMeta}>
            {searching ? <span className={styles.searchResultTitle}>전역 메일 검색</span> : null}
            <h2 className={styles.threadTitle}>{title}</h2>
            <span className={styles.searchResultMeta}>
              {searching ? `"${query}" 검색 결과` : activeBox === 'drafts' ? '저장된 초안을 다시 이어서 보낼 수 있습니다.' : '읽음 상태, 중요 메일, 첨부 여부를 한 번에 확인하세요.'}
            </span>
          </div>
        </div>
        {searching ? (
          <div className={styles.searchFilterRow}>
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`${styles.searchFilterButton} ${searchBox === filter ? styles.searchFilterButtonActive : ''}`}
                onClick={() => onSearchBoxChange(filter)}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.threadScroller}>
        <div className={styles.threadList}>
          {activeBox === 'drafts' ? (
            drafts.length > 0 ? (
              drafts.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  className={`${styles.threadRow} ${selectedDraftId === draft.id ? styles.threadRowSelected : ''}`}
                  onClick={() => onOpenDraft(draft)}
                >
                  <div className={styles.unreadDot} style={{ opacity: 0 }} />
                  <div className={styles.threadActionButton} aria-hidden="true">
                    <MailboxIcon name="draft" size={18} />
                  </div>
                  <div className={styles.threadMain}>
                    <div className={styles.threadSubjectLine}>
                      <span className={styles.threadSubject}>{draft.subject || '(제목 없음)'}</span>
                    </div>
                    <span className={styles.threadPreview}>
                      {draft.recipients.join(', ') || '수신자 미입력'}
                    </span>
                    <div className={styles.threadBadges}>
                      <span className={`${styles.threadBadge} ${styles.statusMuted}`}>
                        첨부 {draft.attachments.length}개
                      </span>
                    </div>
                  </div>
                  <div className={styles.threadTrailing}>
                    <span className={styles.threadMeta}>{draft.updatedAt ? draft.updatedAt.slice(5, 16).replace('T', ' ') : '-'}</span>
                    <button
                      type="button"
                      className={styles.threadActionButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteDraft(draft.id);
                      }}
                    >
                      <MailboxIcon name="trash" size={18} />
                    </button>
                  </div>
                </button>
              ))
            ) : (
              <div className={styles.emptyState}>
                <strong className={styles.emptyTitle}>저장된 임시보관 메일이 없습니다.</strong>
                <p className={styles.emptyDescription}>새 메일을 쓰기 시작하면 자동으로 임시저장이 이어집니다.</p>
              </div>
            )
          ) : threads.length > 0 ? (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`${styles.threadRow} ${selectedThreadId === thread.id ? styles.threadRowSelected : ''} ${thread.isUnread ? styles.threadRowUnread : ''}`}
                onClick={() => onOpenThread(thread.id)}
              >
                <div className={styles.unreadDot} style={{ opacity: thread.isUnread ? 1 : 0 }} />
                <button
                  type="button"
                  className={`${styles.threadStarButton} ${thread.isStarred ? styles.threadStarActive : ''}`}
                  aria-label="중요 메일 토글"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleStar(thread);
                  }}
                >
                  <MailboxIcon name="star" size={18} />
                </button>
                <div className={styles.threadMain}>
                  <div className={styles.threadSubjectLine}>
                    <span className={styles.threadSubject}>{thread.subject || '(제목 없음)'}</span>
                    {thread.hasAttachments ? <MailboxIcon name="attachment" size={16} /> : null}
                  </div>
                  <span className={styles.threadPreview}>{thread.participantsSummary || thread.snippet}</span>
                  <div className={styles.threadBadges}>
                    {thread.isUnread ? (
                      <span className={`${styles.threadBadge} ${styles.statusWarning}`}>안읽음</span>
                    ) : (
                      <span className={`${styles.threadBadge} ${styles.statusMuted}`}>읽음</span>
                    )}
                    {thread.isStarred ? <span className={`${styles.threadBadge} ${styles.statusWarning}`}>중요</span> : null}
                    {thread.trashedAt ? <span className={`${styles.threadBadge} ${styles.statusMuted}`}>휴지통</span> : null}
                    {thread.archivedAt && !thread.trashedAt ? <span className={`${styles.threadBadge} ${styles.statusMuted}`}>보관됨</span> : null}
                    {threadBadges(thread).map((badge) => (
                      <span key={badge} className={styles.threadBadge}>
                        <MailboxIcon name="label" size={14} />
                        <span>{badge}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.threadTrailing}>
                  <span className={styles.threadMeta}>
                    {thread.lastMessageAt ? thread.lastMessageAt.slice(5, 16).replace('T', ' ') : '-'}
                  </span>
                  <span className={styles.threadMeta}>{thread.accountLabel || thread.accountDisplayName}</span>
                </div>
              </button>
            ))
          ) : (
            <div className={styles.emptyState}>
              <strong className={styles.emptyTitle}>{loading ? '메일을 불러오는 중입니다.' : '표시할 메일이 없습니다.'}</strong>
              <p className={styles.emptyDescription}>
                {searching
                  ? '검색어를 바꾸거나 검색 필터를 조정해 보세요.'
                  : '이 편지함에는 아직 표시할 메일이 없습니다.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MailboxThreadListPane;
