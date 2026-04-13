'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  buildComposeState,
  isLikelyEmail,
} from './mailboxComposeHelpers';
import type {
  ComposeAttachment,
  ComposeMode,
  ComposeState,
  MailSendProgressState,
  SelectedReportContext,
} from './mailboxPanelTypes';

interface UseMailboxComposeStateParams {
  composeMode: ComposeMode;
  composerRef: RefObject<HTMLDivElement | null>;
  selectedReport: SelectedReportContext | null;
}

export function useMailboxComposeState({
  composeMode,
  composerRef,
  selectedReport,
}: UseMailboxComposeStateParams) {
  const [compose, setCompose] = useState<ComposeState>(() => buildComposeState());
  const [attachments, setAttachments] = useState<ComposeAttachment[]>([]);
  const [mailSendProgress, setMailSendProgress] =
    useState<MailSendProgressState | null>(null);

  useEffect(() => {
    if (!composerRef.current) return;
    if (composerRef.current.innerHTML === compose.body) return;
    composerRef.current.innerHTML = compose.body;
  }, [compose.body, composerRef]);

  const effectiveCompose = useMemo(() => {
    if (composeMode !== 'report' || !selectedReport?.reportKey) {
      return compose;
    }
    return {
      ...compose,
      subject:
        compose.subject ||
        `[보고서] ${selectedReport.reportTitle || selectedReport.reportKey}`,
      toRecipients:
        compose.toRecipients.length > 0
          ? compose.toRecipients
          : selectedReport.recipientEmail && isLikelyEmail(selectedReport.recipientEmail)
            ? [selectedReport.recipientEmail]
            : compose.toRecipients,
    };
  }, [compose, composeMode, selectedReport]);

  const resetCompose = (modeValue: ComposeMode) => {
    setCompose(
      buildComposeState({
        subject:
          modeValue === 'report' && selectedReport?.reportKey
            ? `[보고서] ${selectedReport.reportTitle || selectedReport.reportKey}`
            : '',
      }),
    );
    setAttachments([]);
  };

  return {
    attachments,
    compose,
    effectiveCompose,
    mailSendProgress,
    resetCompose,
    setAttachments,
    setCompose,
    setMailSendProgress,
  };
}
