import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';
import { prepareReportMailAttachment } from '@/lib/mail/apiClient';
import type { MailAccount, MailThreadDetail } from '@/types/mail';
import type {
  ComposeAttachment,
  ComposeMode,
  ComposeState,
  MailboxView,
  SelectedReportContext,
} from './mailboxPanelTypes';
import {
  buildForwardBody,
  buildForwardSubject,
  buildComposeState,
  buildReplySubject,
  buildThreadRecipients,
  dedupeRecipients,
  isLikelyEmail,
} from './mailboxComposeHelpers';
import {
  getMailReportTemplate,
  renderMailReportTemplate,
} from './mailboxReportTemplates';

interface UseMailboxComposeUiActionsParams {
  applyReportTemplate: (templateId?: string) => void;
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  composeMode: ComposeMode;
  composerRef: RefObject<HTMLDivElement | null>;
  reportOptions: SelectedReportContext[];
  selectedAccount: MailAccount | null;
  selectedReport: SelectedReportContext | null;
  selectedReports: SelectedReportContext[];
  selectedTemplateId: string;
  setAttachments: Dispatch<SetStateAction<ComposeAttachment[]>>;
  setCompose: Dispatch<SetStateAction<ComposeState>>;
  setComposeMode: Dispatch<SetStateAction<ComposeMode>>;
  setReportPickerOpen: Dispatch<SetStateAction<boolean>>;
  setReportSearch: Dispatch<SetStateAction<string>>;
  setReportSiteFilter: Dispatch<SetStateAction<string>>;
  setSelectedReport: Dispatch<SetStateAction<SelectedReportContext | null>>;
  setSelectedReports: Dispatch<SetStateAction<SelectedReportContext[]>>;
  setView: Dispatch<SetStateAction<MailboxView>>;
  siteId: string;
  threadDetail: MailThreadDetail | null;
  resetCompose: (mode: ComposeMode) => void;
}

function fileFromBase64(input: { contentType?: string; dataBase64: string; filename: string }) {
  const binary = window.atob(input.dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], input.filename, {
    type: input.contentType || 'application/octet-stream',
  });
}

function getMessageAttachments(detail: MailThreadDetail | null) {
  const latestOutgoing = detail?.messages
    .slice()
    .reverse()
    .find((message) => message.direction === 'outgoing');
  const metadata = latestOutgoing?.metadata;
  const rawAttachments =
    metadata && Array.isArray(metadata.attachments) ? metadata.attachments : [];
  return rawAttachments
    .map((attachment) => (attachment && typeof attachment === 'object' ? attachment as Record<string, unknown> : null))
    .filter((attachment): attachment is Record<string, unknown> => Boolean(attachment));
}

function mergeReportRecipients(reports: SelectedReportContext[]) {
  return dedupeRecipients(reports.map((report) => report.recipientEmail).filter(isLikelyEmail));
}

export function useMailboxComposeUiActions({
  applyReportTemplate,
  attachmentInputRef,
  composeMode,
  composerRef,
  reportOptions,
  selectedAccount,
  selectedReport,
  selectedReports,
  selectedTemplateId,
  setAttachments,
  setCompose,
  setComposeMode,
  setReportPickerOpen,
  setReportSearch,
  setReportSiteFilter,
  setSelectedReport,
  setSelectedReports,
  setView,
  siteId,
  threadDetail,
  resetCompose,
}: UseMailboxComposeUiActionsParams) {
  const applyReportsToCompose = (reports: SelectedReportContext[]) => {
    const rendered = renderMailReportTemplate(getMailReportTemplate(selectedTemplateId), reports);
    const knownReportRecipients = new Set(
      reportOptions.map((report) => report.recipientEmail).filter(isLikelyEmail),
    );
    setCompose((current) => ({
      ...current,
      body: reports.length > 0 ? rendered.body : current.body,
      subject: reports.length > 0 ? rendered.subject : current.subject,
      toRecipients: dedupeRecipients([
        ...current.toRecipients.filter((email) => !knownReportRecipients.has(email)),
        ...mergeReportRecipients(reports),
      ]),
    }));
  };

  const handleOpenCompose = (mode: ComposeMode = 'new') => {
    if (mode !== 'report') {
      setSelectedReport(null);
      setSelectedReports([]);
    }
    setComposeMode(mode);
    if (mode !== 'reply') {
      resetCompose(mode);
    }
    setView('compose');
  };

  const handleReply = () => {
    if (!threadDetail) return;
    setSelectedReport(null);
    setSelectedReports([]);
    setComposeMode('reply');
    setCompose(
      buildComposeState({
        subject: buildReplySubject(threadDetail.thread.subject),
        toRecipients: selectedAccount
          ? dedupeRecipients(
              buildThreadRecipients(threadDetail.thread, selectedAccount.email)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            )
          : [],
      }),
    );
    setAttachments([]);
    setView('compose');
  };

  const handleForward = () => {
    const sourceMessage = threadDetail
      ? threadDetail.messages[threadDetail.messages.length - 1]
      : null;
    if (!threadDetail || !sourceMessage) return;
    setSelectedReport(null);
    setSelectedReports([]);
    setComposeMode('new');
    setCompose(
      buildComposeState({
        body: buildForwardBody(sourceMessage),
        subject: buildForwardSubject(sourceMessage.subject || threadDetail.thread.subject),
      }),
    );
    setAttachments([]);
    setView('compose');
  };

  const handleResend = () => {
    if (!threadDetail) return;
    const sourceMessage =
      threadDetail.messages.slice().reverse().find((message) => message.direction === 'outgoing') ||
      threadDetail.messages[threadDetail.messages.length - 1];
    if (!sourceMessage) return;
    const reportKeys = sourceMessage.reportKeys.length
      ? sourceMessage.reportKeys
      : sourceMessage.reportKey
        ? [sourceMessage.reportKey]
        : [];
    const reports = reportKeys
      .map((reportKey) => reportOptions.find((option) => option.reportKey === reportKey))
      .filter((report): report is SelectedReportContext => Boolean(report));
    const restoredAttachments = getMessageAttachments(threadDetail)
      .filter((attachment) => attachment.source !== 'report' && typeof attachment.data_base64 === 'string')
      .map((attachment) => ({
        file: fileFromBase64({
          contentType: typeof attachment.content_type === 'string' ? attachment.content_type : '',
          dataBase64: String(attachment.data_base64),
          filename: typeof attachment.filename === 'string' ? attachment.filename : 'attachment.bin',
        }),
        id: `${String(attachment.filename || 'attachment')}-${String(attachment.size || attachment.size_bytes || '')}`,
      }));

    setSelectedReport(reports[0] || null);
    setSelectedReports(reports);
    setComposeMode(reports.length > 0 ? 'report' : 'new');
    setCompose(
      buildComposeState({
        body: sourceMessage.body,
        subject: sourceMessage.subject,
        toRecipients: sourceMessage.to.map((recipient) => recipient.email).filter(isLikelyEmail),
      }),
    );
    setAttachments(restoredAttachments);
    setView('compose');
  };

  const handleComposerInput = () => {
    if (!composerRef.current) return;
    setCompose((current) => ({
      ...current,
      body: composerRef.current?.innerHTML || '',
    }));
  };

  const handleComposerCommand = (command: string, value?: string) => {
    if (!composerRef.current) return;
    composerRef.current.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    setCompose((current) => ({
      ...current,
      body: composerRef.current?.innerHTML || '',
    }));
  };

  const handleComposerLink = () => {
    const url = window.prompt('링크 주소를 입력하세요.');
    if (!url) return;
    handleComposerCommand('createLink', url.trim());
  };

  const handleAttachmentSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setAttachments((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      const nextItems = files
        .map((file) => ({
          file,
          id: `${file.name}-${file.size}-${file.lastModified}`,
        }))
        .filter((item) => !existingIds.has(item.id));
      return [...current, ...nextItems];
    });
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
      return;
    }
    event.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((current) => current.filter((item) => item.id !== attachmentId));
  };

  const handleOpenReportPicker = () => {
    setReportSearch('');
    setReportSiteFilter(selectedReport?.siteId || selectedReports[0]?.siteId || siteId || '');
    setReportPickerOpen(true);
  };

  const handleSelectReport = (option: SelectedReportContext) => {
    const exists = selectedReports.some((report) => report.reportKey === option.reportKey);
    const nextReports = exists
      ? selectedReports.filter((report) => report.reportKey !== option.reportKey)
      : [...selectedReports, option];
    setSelectedReports(nextReports);
    setSelectedReport(nextReports[0] || null);
    setComposeMode(nextReports.length > 0 ? 'report' : 'new');
    if (nextReports.length > 0) {
      applyReportsToCompose(nextReports);
      nextReports.forEach((report) => {
        if (!report.attachmentReady) return;
        void prepareReportMailAttachment({
          originalPdfAvailable: report.originalPdfAvailable,
          originalPdfDownloadPath: report.originalPdfDownloadPath,
          reportFilename: report.reportTitle,
          reportKey: report.reportKey,
          reportTitle: report.reportTitle,
          reportType: report.reportType,
          reportUpdatedAt: report.updatedAt,
        }).catch((error) => {
          console.warn('Report PDF prepare failed; send will retry on demand.', {
            error: error instanceof Error ? error.message : String(error),
            reportKey: report.reportKey,
          });
        });
      });
    }
  };

  const handleClearSelectedReport = () => {
    setSelectedReport(null);
    setSelectedReports([]);
    if (composeMode === 'report') {
      setComposeMode('new');
    }
  };

  return {
    applyReportTemplate,
    handleAttachmentSelect,
    handleClearSelectedReport,
    handleComposerCommand,
    handleComposerInput,
    handleComposerLink,
    handleForward,
    handleOpenCompose,
    handleOpenReportPicker,
    handleRemoveAttachment,
    handleReply,
    handleResend,
    handleSelectReport,
  };
}
