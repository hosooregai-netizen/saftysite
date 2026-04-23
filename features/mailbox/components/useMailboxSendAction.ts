import type { Dispatch, SetStateAction } from 'react';
import { fetchMailThreadDetail, fetchMailThreads, sendMail, sendReportMail } from '@/lib/mail/apiClient';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import type { MailAccount, MailThreadDetail } from '@/types/mail';
import {
  buildFileAttachmentPayload,
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
import { DEFAULT_SHARED_MAILBOX_NAME, THREAD_PAGE_SIZE } from './mailboxPanelTypes';

interface UseMailboxSendActionParams {
  attachments: ComposeAttachment[];
  compose: ComposeState;
  composeMode: ComposeMode;
  currentUser?: {
    email: string;
    id: string;
    name: string;
  };
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

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveSenderName(
  currentUser: UseMailboxSendActionParams['currentUser'],
  selectedAccount: MailAccount,
) {
  const currentUserName = normalizeText(currentUser?.name);
  if (currentUserName) {
    return currentUserName;
  }

  const accountDisplayName = normalizeText(selectedAccount.displayName);
  if (accountDisplayName && accountDisplayName !== DEFAULT_SHARED_MAILBOX_NAME) {
    return accountDisplayName;
  }

  const mailboxLabel = normalizeText(selectedAccount.mailboxLabel);
  if (mailboxLabel && mailboxLabel !== DEFAULT_SHARED_MAILBOX_NAME) {
    return mailboxLabel;
  }

  return normalizeText(selectedAccount.email);
}

export function useMailboxSendAction({
  attachments,
  compose,
  composeMode,
  currentUser,
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
    const senderName = resolveSenderName(currentUser, selectedAccount);

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
        const usesOriginalPdf = selectedReport.originalPdfAvailable;
        setMailSendProgress({
          detail: usesOriginalPdf
            ? '등록된 원본 PDF를 서버에서 바로 첨부합니다.'
            : '보고서 PDF는 서버에서 생성해 바로 첨부합니다.',
          percent: 30,
          title: usesOriginalPdf ? '원본 PDF 첨부 중' : '보고서 PDF 준비 중',
        });
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
      const recipients = normalizedRecipients.map((email) => ({ email, name: null }));
      if (composeMode === 'report' && selectedReport?.reportKey) {
        await sendReportMail({
          accountId: selectedAccount.id,
          attachments: normalizedAttachments,
          body: compose.body,
          fromName: senderName,
          headquarterId: selectedHeadquarterId,
          originalPdfAvailable: selectedReport.originalPdfAvailable,
          reportFilename: selectedReport.reportTitle,
          reportKey: selectedReport.reportKey,
          reportTitle: selectedReport.reportTitle,
          reportType: selectedReport.reportType,
          siteId: selectedSiteId,
          subject: compose.subject,
          to: recipients,
        });
      } else {
        await sendMail({
          accountId: selectedAccount.id,
          attachments: normalizedAttachments,
          body: compose.body,
          fromName: senderName,
          headquarterId: selectedHeadquarterId,
          reportKey: selectedReportKey,
          siteId: selectedSiteId,
          subject: compose.subject,
          threadId: composeMode === 'reply' ? threadDetail?.thread.id || '' : '',
          to: recipients,
        });
      }
      setMailSendProgress({
        detail: '발송 결과를 메일함 목록에 반영하고 있습니다.',
        percent: 92,
        title: '목록 새로고침 중',
      });
      setNotice(
        normalizedAttachments.length > 0
          ? `메일을 발송했습니다. 첨부 ${normalizedAttachments.length + (composeMode === 'report' ? 1 : 0)}건을 함께 보냈습니다.`
          : composeMode === 'report'
            ? '메일을 발송했습니다. 보고서 PDF를 함께 보냈습니다.'
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
