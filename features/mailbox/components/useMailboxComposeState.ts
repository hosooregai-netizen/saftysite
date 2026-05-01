'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  buildComposeState,
  dedupeRecipients,
  isLikelyEmail,
} from './mailboxComposeHelpers';
import {
  getMailReportTemplate,
  renderMailReportTemplate,
} from './mailboxReportTemplates';
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
  selectedReports: SelectedReportContext[];
}

export function useMailboxComposeState({
  composeMode,
  composerRef,
  selectedReport,
  selectedReports,
}: UseMailboxComposeStateParams) {
  const [compose, setCompose] = useState<ComposeState>(() => buildComposeState());
  const [attachments, setAttachments] = useState<ComposeAttachment[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('default');
  const [mailSendProgress, setMailSendProgress] =
    useState<MailSendProgressState | null>(null);

  const reportItems = useMemo(
    () => (selectedReports.length > 0 ? selectedReports : selectedReport ? [selectedReport] : []),
    [selectedReport, selectedReports],
  );

  useEffect(() => {
    if (!composerRef.current) return;
    if (composerRef.current.innerHTML === compose.body) return;
    composerRef.current.innerHTML = compose.body;
  }, [compose.body, composerRef]);

  const renderSelectedTemplate = (templateId = selectedTemplateId) =>
    renderMailReportTemplate(getMailReportTemplate(templateId), reportItems);

  const effectiveCompose = useMemo(() => {
    if (composeMode !== 'report' || reportItems.length === 0) {
      return compose;
    }
    const rendered = renderMailReportTemplate(getMailReportTemplate(selectedTemplateId), reportItems);
    return {
      ...compose,
      body: compose.body || rendered.body,
      subject: compose.subject || rendered.subject,
      toRecipients:
        compose.toRecipients.length > 0
          ? compose.toRecipients
          : dedupeRecipients(reportItems.map((report) => report.recipientEmail).filter(isLikelyEmail)),
    };
  }, [compose, composeMode, reportItems, selectedTemplateId]);

  const resetCompose = (modeValue: ComposeMode) => {
    const rendered =
      modeValue === 'report' && reportItems.length > 0
        ? renderSelectedTemplate()
        : { body: '', subject: '' };
    setCompose(
      buildComposeState({
        body: rendered.body,
        subject: rendered.subject,
      }),
    );
    setAttachments([]);
  };

  const applyReportTemplate = (templateId = selectedTemplateId) => {
    setSelectedTemplateId(templateId);
    if (reportItems.length === 0) return;
    const rendered = renderSelectedTemplate(templateId);
    setCompose((current) => ({
      ...current,
      body: rendered.body,
      subject: rendered.subject,
      toRecipients: dedupeRecipients([
        ...current.toRecipients,
        ...reportItems.map((report) => report.recipientEmail).filter(isLikelyEmail),
      ]),
    }));
  };

  return {
    applyReportTemplate,
    attachments,
    compose,
    effectiveCompose,
    mailSendProgress,
    resetCompose,
    selectedTemplateId,
    setAttachments,
    setCompose,
    setMailSendProgress,
    setSelectedTemplateId,
  };
}
