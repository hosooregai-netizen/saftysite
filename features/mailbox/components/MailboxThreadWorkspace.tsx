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
  onForward: () => void;
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
  onForward,
  onMoveThreadPage,
  onOpenThread,
  onReply,
}: MailboxThreadWorkspaceProps) {
  if (view === 'thread') {
    return (
      <MailboxThreadDetailSection
        detailEmptyMessage="메일을 선택하면 상세 내용을 확인할 수 있습니다."
        threadDetail={threadDetail}
        title={threadDetail ? threadDetail.thread.subject || '(제목 없음)' : '메일 상세'}
        onBackToList={onBackToList}
        onForward={onForward}
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
      title="메일 목록"
      total={threadTotal}
      onMovePage={onMoveThreadPage}
      onOpenThread={onOpenThread}
    />
  );
}
