import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';
import type { MailAccount, MailThreadDetail } from '@/types/mail';
import type {
  ComposeAttachment,
  ComposeMode,
  ComposeState,
  MailboxView,
  SelectedReportContext,
} from './mailboxPanelTypes';
import { buildComposeState, buildReplySubject, buildThreadRecipients, dedupeRecipients, isLikelyEmail } from './mailboxComposeHelpers';

interface UseMailboxComposeUiActionsParams {
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  composeMode: ComposeMode;
  composerRef: RefObject<HTMLDivElement | null>;
  selectedAccount: MailAccount | null;
  selectedReport: SelectedReportContext | null;
  setAttachments: Dispatch<SetStateAction<ComposeAttachment[]>>;
  setCompose: Dispatch<SetStateAction<ComposeState>>;
  setComposeMode: Dispatch<SetStateAction<ComposeMode>>;
  setReportPickerOpen: Dispatch<SetStateAction<boolean>>;
  setReportSearch: Dispatch<SetStateAction<string>>;
  setReportSiteFilter: Dispatch<SetStateAction<string>>;
  setSelectedReport: Dispatch<SetStateAction<SelectedReportContext | null>>;
  setView: Dispatch<SetStateAction<MailboxView>>;
  siteId: string;
  threadDetail: MailThreadDetail | null;
  resetCompose: (mode: ComposeMode) => void;
}

export function useMailboxComposeUiActions({
  attachmentInputRef,
  composeMode,
  composerRef,
  selectedAccount,
  selectedReport,
  setAttachments,
  setCompose,
  setComposeMode,
  setReportPickerOpen,
  setReportSearch,
  setReportSiteFilter,
  setSelectedReport,
  setView,
  siteId,
  threadDetail,
  resetCompose,
}: UseMailboxComposeUiActionsParams) {
  const handleOpenCompose = (mode: ComposeMode = 'new') => {
    if (mode !== 'report') {
      setSelectedReport(null);
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
    setReportSiteFilter(selectedReport?.siteId || siteId || '');
    setReportPickerOpen(true);
  };

  const handleSelectReport = (option: SelectedReportContext) => {
    setSelectedReport(option);
    setComposeMode('report');
    setCompose((current) => ({
      ...current,
      subject:
        current.subject.trim() && composeMode !== 'report'
          ? current.subject
          : `[보고서] ${option.reportTitle || option.reportKey}`,
      toRecipients:
        current.toRecipients.length > 0
          ? current.toRecipients
          : option.recipientEmail && isLikelyEmail(option.recipientEmail)
            ? [option.recipientEmail]
            : [],
    }));
    setReportPickerOpen(false);
  };

  const handleClearSelectedReport = () => {
    setSelectedReport(null);
    if (composeMode === 'report') {
      setComposeMode('new');
    }
  };

  return {
    handleAttachmentSelect,
    handleClearSelectedReport,
    handleComposerCommand,
    handleComposerInput,
    handleComposerLink,
    handleOpenCompose,
    handleOpenReportPicker,
    handleRemoveAttachment,
    handleReply,
    handleSelectReport,
  };
}
