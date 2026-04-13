import type { Dispatch, SetStateAction } from 'react';
import { fetchMailThreadDetail, fetchMailThreads, sendMail } from '@/lib/mail/apiClient';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import type { MailAccount, MailThreadDetail } from '@/types/mail';
import {
  buildFileAttachmentPayload,
  buildReportAttachmentPayload,
  dedupeRecipients,
  isLikelyEmail,
} from './mailboxComposeHelpers';
import { normalizeMailThreadDetailUi, normalizeMailThreadUi } from './mailboxPanelHelpers';
import type {
  ComposeAttachment,
  ComposeMode,
  ComposeState,
  MailboxTab,
  MailboxView,
  MailSendProgressState,
  SelectedReportContext,
} from './mailboxPanelTypes';
import { THREAD_PAGE_SIZE } from './mailboxPanelTypes';

interface UseMailboxSendActionParams {
  attachments: ComposeAttachment[];
  compose: ComposeState;
  composeMode: ComposeMode;
  isDemoMode: boolean;
  query: string;
  resetCompose: (mode: ComposeMode) => void;
  selectedAccount: MailAccount | null;
  selectedReport: SelectedReportContext | null;
  selectedThreadId: string;
  setComposeMode: Dispatch<SetStateAction<ComposeMode>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setMailSendProgress: Dispatch<SetStateAction<MailSendProgressState | null>>;
  setNotice: Dispatch<SetStateAction<string | null>>;
  setSelectedReport: Dispatch<SetStateAction<SelectedReportContext | null>>;
  setThreadDetail: Dispatch<SetStateAction<MailThreadDetail | null>>;
  setThreadTotal: Dispatch<SetStateAction<number>>;
  setThreads: Dispatch<SetStateAction<ReturnType<typeof normalizeMailThreadUi>[]>>;
  setView: Dispatch<SetStateAction<MailboxView>>;
  siteId: string;
  tab: MailboxTab;
  threadDetail: MailThreadDetail | null;
  threadOffset: number;
}

export function useMailboxSendAction({
  attachments,
  compose,
  composeMode,
  isDemoMode,
  query,
  resetCompose,
  selectedAccount,
  selectedReport,
  selectedThreadId,
  setComposeMode,
  setError,
  setMailSendProgress,
  setNotice,
  setSelectedReport,
  setThreadDetail,
  setThreadTotal,
  setThreads,
  setView,
  siteId,
  tab,
  threadDetail,
  threadOffset,
}: UseMailboxSendActionParams) {
  const handleSend = async () => {
    if (isDemoMode) {
      setNotice('데모 메일함에서는 실제 발송을 진행하지 않습니다.');
      return;
    }
    if (!selectedAccount) return;

    const normalizedRecipients = dedupeRecipients([
      ...compose.toRecipients,
      ...(isLikelyEmail(compose.toInput.trim()) ? [compose.toInput.trim()] : []),
    ]);
    const selectedReportKey =
      composeMode === 'reply' ? threadDetail?.thread.reportKey || '' : selectedReport?.reportKey || '';
    const selectedSiteId =
      composeMode === 'reply' ? threadDetail?.thread.siteId || '' : selectedReport?.siteId || '';
    const selectedHeadquarterId =
      composeMode === 'reply'
        ? threadDetail?.thread.headquarterId || ''
        : selectedReport?.headquarterId || '';

    try {
      setError(null);
      setMailSendProgress({
        detail: '수신자와 본문을 정리하고 있습니다.',
        percent: 8,
        title: '메일 발송 준비 중',
      });
      const authToken = readSafetyAuthToken();
      const normalizedAttachments = [];
      if (composeMode === 'report' && selectedReport?.reportKey) {
        if (!authToken) {
          throw new Error('보고서 첨부를 준비하려면 다시 로그인해 주세요.');
        }
        setMailSendProgress({
          detail: '선택한 보고서를 PDF로 생성하고 있습니다.',
          percent: 30,
          title: '보고서 PDF 준비 중',
        });
        normalizedAttachments.push(await buildReportAttachmentPayload(selectedReport, authToken));
      }
      if (attachments.length > 0) {
        setMailSendProgress({
          detail: `첨부 파일 ${attachments.length}건을 메일 전송 형식으로 준비하고 있습니다.`,
          percent: 54,
          title: '첨부 파일 정리 중',
        });
        for (const attachment of attachments) {
          normalizedAttachments.push(await buildFileAttachmentPayload(attachment.file));
        }
      }
      setMailSendProgress({
        detail: '메일 서버로 발송 요청을 보내고 있습니다.',
        percent: 78,
        title: '메일 발송 중',
      });
      await sendMail({
        accountId: selectedAccount.id,
        attachments: normalizedAttachments,
        body: compose.body,
        headquarterId: selectedHeadquarterId,
        reportKey: selectedReportKey,
        siteId: selectedSiteId,
        subject: compose.subject,
        threadId: composeMode === 'reply' ? threadDetail?.thread.id || '' : '',
        to: normalizedRecipients.map((email) => ({ email, name: null })),
      });
      setMailSendProgress({
        detail: '발송 결과를 메일함 목록에 반영하고 있습니다.',
        percent: 92,
        title: '목록 새로고침 중',
      });
      setNotice(
        normalizedAttachments.length > 0
          ? `메일을 발송했습니다. 첨부 ${normalizedAttachments.length}건을 함께 보냈습니다.`
          : '메일을 발송했습니다.',
      );
      if (composeMode === 'report') {
        setSelectedReport(null);
        setComposeMode('new');
      }
      resetCompose('new');
      const nextThreads = await fetchMailThreads({
        accountId: selectedAccount.id,
        box: tab,
        headquarterId: selectedHeadquarterId,
        limit: THREAD_PAGE_SIZE,
        offset: threadOffset,
        query,
        reportKey: '',
        siteId: selectedSiteId || siteId,
      });
      setThreads(nextThreads.rows.map(normalizeMailThreadUi));
      setThreadTotal(nextThreads.total);
      if (composeMode === 'reply' && selectedThreadId) {
        setThreadDetail(normalizeMailThreadDetailUi(await fetchMailThreadDetail(selectedThreadId)));
        setView('thread');
      } else {
        setView('list');
      }
      setMailSendProgress({
        detail: '메일 발송이 완료되었습니다.',
        percent: 100,
        title: '발송 완료',
      });
      window.setTimeout(() => {
        setMailSendProgress((current) => (current?.percent === 100 ? null : current));
      }, 900);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 발송에 실패했습니다.');
      setMailSendProgress(null);
    }
  };

  return { handleSend };
}
