'use client';

import type { MailThread, MailThreadDetail } from '@/types/mail';
import { MailboxThreadDetailSection } from './MailboxThreadDetailSection';
import { MailboxThreadListSection } from './MailboxThreadListSection';
import { formatMailBodyHtml } from './mailboxComposeHelpers';
import { buildThreadTimestamp } from './mailboxPanelHelpers';
import type { MailboxTab, MailboxView } from './mailboxPanelTypes';
import { MAILBOX_TAB_META } from './mailboxPanelTypes';
import { buildThreadCounterparty } from './mailboxViewHelpers';

interface MailboxThreadWorkspaceProps {
  canGoNextThreadPage: boolean;
  canGoPrevThreadPage: boolean;
  selectedAccountEmail: string;
  tab: MailboxTab;
  threadDetail: MailThreadDetail | null;
  threadLoading: boolean;
  threadPage: number;
  threadPageCount: number;
  threadRangeEnd: number;
  threadRangeStart: number;
  threadTotal: number;
  threads: MailThread[];
  view: Exclude<MailboxView, 'compose'>;
  onBackToList: () => void;
  onMoveThreadPage: (nextPage: number) => void;
  onOpenThread: (threadId: string) => void;
  onReply: () => void;
}

export function MailboxThreadWorkspace({
  canGoNextThreadPage,
  canGoPrevThreadPage,
  selectedAccountEmail,
  tab,
  threadDetail,
  threadLoading,
  threadPage,
  threadPageCount,
  threadRangeEnd,
  threadRangeStart,
  threadTotal,
  threads,
  view,
  onBackToList,
  onMoveThreadPage,
  onOpenThread,
  onReply,
}: MailboxThreadWorkspaceProps) {
  if (view === 'thread') {
    const detailEmptyMessage = '메일을 선택하면 상세 내용을 볼 수 있습니다.';
    return (
      <MailboxThreadDetailSection
        detailDescription={
          threadDetail
            ? `${buildThreadCounterparty(threadDetail.thread, selectedAccountEmail)} · ${buildThreadTimestamp(threadDetail.thread)}`
            : detailEmptyMessage
        }
        detailEmptyMessage={detailEmptyMessage}
        detailHints={
          threadDetail
            ? [
                `읽지 않은 메일 ${threadDetail.thread.unreadCount}건`,
                `메시지 ${threadDetail.thread.messageCount}건`,
                `계정 ${threadDetail.thread.accountDisplayName}`,
                ...(threadDetail.thread.reportKey
                  ? [`보고서 ${threadDetail.thread.reportKey}`]
                  : []),
              ]
            : []
        }
        threadDetail={threadDetail}
        title={threadDetail ? threadDetail.thread.subject || '(제목 없음)' : '메일 상세'}
        onBackToList={onBackToList}
        onReply={onReply}
        renderMessageBodyHtml={formatMailBodyHtml}
      />
    );
  }

  return (
    <MailboxThreadListSection
      canGoNextThreadPage={canGoNextThreadPage}
      canGoPrevThreadPage={canGoPrevThreadPage}
      emptyMessage={threadLoading ? '메일을 불러오는 중입니다.' : MAILBOX_TAB_META[tab].empty}
      page={threadPage}
      pageCount={threadPageCount}
      primaryColumnLabel={tab === 'sent' ? '받는 사람' : '상대방'}
      rangeEnd={threadRangeEnd}
      rangeStart={threadRangeStart}
      rows={threads.map((thread) => ({
        id: thread.id,
        isUnread: (tab === 'all' || tab === 'inbox') && thread.unreadCount > 0,
        partyLabel: buildThreadCounterparty(thread, selectedAccountEmail),
        subject: thread.subject || '(제목 없음)',
        timestamp: buildThreadTimestamp(thread),
      }))}
      title={MAILBOX_TAB_META[tab].title}
      total={threadTotal}
      onMovePage={onMoveThreadPage}
      onOpenThread={onOpenThread}
    />
  );
}
