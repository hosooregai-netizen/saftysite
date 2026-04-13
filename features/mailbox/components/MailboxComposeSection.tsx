import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';
import { MailboxComposeSupport, type MailboxComposeAttachmentItem, type MailboxComposeSelectedReport } from './MailboxComposeSupport';
import { MailboxComposeToolbar } from './MailboxComposeToolbar';
import { MailboxRecipientField, type MailboxRecipientSuggestionOption } from './MailboxRecipientField';
import { MailboxSendProgress } from './MailboxSendProgress';
import localStyles from './MailboxPanel.module.css';

interface MailboxComposeAccountOption {
  id: string;
  mailboxLabel: string;
}

interface MailboxComposeState {
  body: string;
  subject: string;
  toInput: string;
  toRecipients: string[];
}

interface MailboxSendProgressState {
  detail: string;
  percent: number;
  title: string;
}

interface MailboxComposeSectionProps {
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  attachments: MailboxComposeAttachmentItem[];
  compose: MailboxComposeState;
  composeMode: 'new' | 'reply' | 'report';
  composeTitle: string;
  composerRef: RefObject<HTMLDivElement | null>;
  hasMultipleAccounts: boolean;
  isDemoMode: boolean;
  isSendingMail: boolean;
  mailSendProgress: MailboxSendProgressState | null;
  recipientSuggestionIndex: number;
  recipientSuggestions: MailboxRecipientSuggestionOption[];
  recipientSuggestionsLoading: boolean;
  recipientSuggestionsOpen: boolean;
  selectedAccountId: string;
  selectableAccounts: MailboxComposeAccountOption[];
  selectedReport: MailboxComposeSelectedReport | null;
  submitDisabled: boolean;
  onAttachmentSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlurRecipient: () => void;
  onChangeAccountId: (accountId: string) => void;
  onChangeRecipientInput: (value: string) => void;
  onChangeSubject: (value: string) => void;
  onClearSelectedReport: () => void;
  onComposerCommand: (command: string, value?: string) => void;
  onComposerInput: () => void;
  onComposerLink: () => void;
  onFocusRecipient: () => void;
  onOpenReportPicker: () => void;
  onRecipientKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onRemoveRecipient: (email: string) => void;
  onSelectRecipientSuggestion: (suggestion: MailboxRecipientSuggestionOption) => void;
  onSend: () => void;
}

export function MailboxComposeSection({
  attachmentInputRef,
  attachments,
  compose,
  composeMode,
  composeTitle,
  composerRef,
  hasMultipleAccounts,
  isDemoMode,
  isSendingMail,
  mailSendProgress,
  recipientSuggestionIndex,
  recipientSuggestions,
  recipientSuggestionsLoading,
  recipientSuggestionsOpen,
  selectedAccountId,
  selectableAccounts,
  selectedReport,
  submitDisabled,
  onAttachmentSelect,
  onBlurRecipient,
  onChangeAccountId,
  onChangeRecipientInput,
  onChangeSubject,
  onClearSelectedReport,
  onComposerCommand,
  onComposerInput,
  onComposerLink,
  onFocusRecipient,
  onOpenReportPicker,
  onRecipientKeyDown,
  onRemoveAttachment,
  onRemoveRecipient,
  onSelectRecipientSuggestion,
  onSend,
}: MailboxComposeSectionProps) {
  return (
    <section className={localStyles.stageCard}>
      <div className={localStyles.composeSectionHeader}>
        <h3 className={localStyles.panelTitle}>{composeTitle}</h3>
        {hasMultipleAccounts ? (
          <label className={localStyles.composeAccountInline}>
            <span className={localStyles.fieldLabel}>보내는 계정</span>
            <select
              className="app-select"
              value={selectedAccountId}
              onChange={(event) => onChangeAccountId(event.target.value)}
            >
              {selectableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.mailboxLabel}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className={localStyles.composeDivider} />
      <div className={localStyles.composeGrid}>
        <MailboxRecipientField
          inputValue={compose.toInput}
          suggestionIndex={recipientSuggestionIndex}
          suggestions={recipientSuggestions}
          suggestionsLoading={recipientSuggestionsLoading}
          suggestionsOpen={recipientSuggestionsOpen}
          recipients={compose.toRecipients}
          onBlur={onBlurRecipient}
          onChangeInput={onChangeRecipientInput}
          onFocusInput={onFocusRecipient}
          onKeyDown={onRecipientKeyDown}
          onRemoveRecipient={onRemoveRecipient}
          onSelectSuggestion={onSelectRecipientSuggestion}
        />

        <label className={localStyles.fieldWide}>
          <span className={localStyles.fieldLabel}>제목</span>
          <input
            className="app-input"
            value={compose.subject}
            onChange={(event) => onChangeSubject(event.target.value)}
            placeholder="메일 제목을 입력하세요."
          />
        </label>

        <div className={localStyles.fieldWide}>
          <span className={localStyles.fieldLabel}>본문</span>
          <MailboxComposeToolbar onCommand={onComposerCommand} onLink={onComposerLink} />
          <div
            ref={composerRef}
            className={localStyles.composeEditor}
            contentEditable
            suppressContentEditableWarning
            onInput={onComposerInput}
            data-placeholder={composeMode === 'reply' ? '답장 내용을 입력하세요.' : '메일 내용을 입력하세요.'}
          />
          <MailboxComposeSupport
            attachmentInputRef={attachmentInputRef}
            attachments={attachments}
            composeMode={composeMode}
            isDemoMode={isDemoMode}
            isSendingMail={isSendingMail}
            selectedReport={selectedReport}
            onAttachmentSelect={onAttachmentSelect}
            onClearSelectedReport={onClearSelectedReport}
            onOpenReportPicker={onOpenReportPicker}
            onRemoveAttachment={onRemoveAttachment}
          />
        </div>

        <div className={localStyles.composeFooter}>
          {mailSendProgress ? <MailboxSendProgress {...mailSendProgress} /> : null}
          <div className={localStyles.composeActions}>
            <button
              type="button"
              className={`app-button app-button-primary ${localStyles.submitButton}`}
              onClick={onSend}
              disabled={submitDisabled}
            >
              {isSendingMail ? `메일 발송 중... ${mailSendProgress?.percent ?? 0}%` : '메일 발송'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
