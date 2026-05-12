'use client';

import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';
import { MailboxComposeToolbar } from '@/features/mailbox/components/MailboxComposeToolbar';
import {
  MailboxRecipientField,
  type MailboxRecipientSuggestionOption,
} from '@/features/mailbox/components/MailboxRecipientField';
import styles from './MailboxShell.module.css';
import { MailboxIcon } from './MailboxIcon';

export interface ShellComposeState {
  body: string;
  ccInput: string;
  subject: string;
  toInput: string;
  toRecipients: string[];
}

export interface ShellAttachmentDraft {
  contentType: string;
  dataBase64?: string;
  downloadUrl?: string;
  filename: string;
  file?: File;
  id: string;
  sizeBytes: number;
  source?: string | null;
}

export function MailboxComposePanel({
  attachments,
  canSend,
  compose,
  composeOpen,
  composeStatus,
  composerRef,
  draftId,
  maximized,
  minimized,
  onAttachmentChange,
  onClose,
  onDeleteDraft,
  onMaximize,
  onMinimize,
  onRemoveAttachment,
  onRemoveRecipient,
  onSend,
  onSetCompose,
  onSelectSuggestion,
  recipientSuggestionIndex,
  recipientSuggestions,
  recipientSuggestionsLoading,
  recipientSuggestionsOpen,
  setRecipientSuggestionIndex,
  setRecipientSuggestionsOpen,
}: {
  attachments: ShellAttachmentDraft[];
  canSend: boolean;
  compose: ShellComposeState;
  composeOpen: boolean;
  composeStatus: string;
  composerRef: RefObject<HTMLDivElement | null>;
  draftId: string;
  maximized: boolean;
  minimized: boolean;
  onAttachmentChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onDeleteDraft: (draftId: string) => void;
  onMaximize: () => void;
  onMinimize: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onRemoveRecipient: (email: string) => void;
  onSend: () => void;
  onSetCompose: (updater: (current: ShellComposeState) => ShellComposeState) => void;
  onSelectSuggestion: (suggestion: MailboxRecipientSuggestionOption) => void;
  recipientSuggestionIndex: number;
  recipientSuggestions: MailboxRecipientSuggestionOption[];
  recipientSuggestionsLoading: boolean;
  recipientSuggestionsOpen: boolean;
  setRecipientSuggestionIndex: (value: number | ((current: number) => number)) => void;
  setRecipientSuggestionsOpen: (value: boolean) => void;
}) {
  if (!composeOpen) {
    return null;
  }

  const handleCommand = (command: string, value?: string) => {
    if (!composerRef.current) return;
    composerRef.current.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    onSetCompose((current) => ({
      ...current,
      body: composerRef.current?.innerHTML || '',
    }));
  };

  const handleRecipientKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'Enter' || event.key === 'Tab' || event.key === ',' || event.key === ' ') && compose.toInput.trim()) {
      event.preventDefault();
      const value = compose.toInput
        .split(/[\s,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (value.length === 0) return;
      onSetCompose((current) => ({
        ...current,
        toInput: '',
        toRecipients: Array.from(new Set([...current.toRecipients, ...value])),
      }));
      setRecipientSuggestionsOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setRecipientSuggestionIndex((current) =>
        recipientSuggestions.length > 0 ? (current + 1) % recipientSuggestions.length : 0,
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setRecipientSuggestionIndex((current) =>
        recipientSuggestions.length > 0
          ? (current - 1 + recipientSuggestions.length) % recipientSuggestions.length
          : 0,
      );
      return;
    }
    if (event.key === 'Enter' && recipientSuggestions[recipientSuggestionIndex]) {
      event.preventDefault();
      onSelectSuggestion(recipientSuggestions[recipientSuggestionIndex]);
      setRecipientSuggestionsOpen(false);
    }
  };

  return (
    <aside
      className={`${styles.composeFloating} ${minimized ? styles.composeFloatingMinimized : ''} ${maximized ? styles.composeFloatingMaximized : ''}`}
      role="dialog"
      aria-label="메일 작성"
    >
      <div className={styles.composeHeader}>
        <div>
          <strong className={styles.composeTitle}>{draftId ? '임시보관 메일 편집' : '새 메일'}</strong>
          {composeStatus ? <span className={styles.composeStatus}>{composeStatus}</span> : null}
        </div>
        <div className={styles.composeHeaderActions}>
          <button type="button" className={styles.composeWindowButton} onClick={onMinimize} aria-label="최소화">
            <span>-</span>
          </button>
          <button type="button" className={styles.composeWindowButton} onClick={onMaximize} aria-label="크기 전환">
            <span>□</span>
          </button>
          <button type="button" className={styles.composeWindowButton} onClick={onClose} aria-label="닫기">
            <MailboxIcon name="close" size={18} />
          </button>
        </div>
      </div>

      <div className={minimized ? styles.composeBodyHidden : styles.composeBody}>
        <MailboxRecipientField
          inputValue={compose.toInput}
          suggestionIndex={recipientSuggestionIndex}
          suggestions={recipientSuggestions}
          suggestionsLoading={recipientSuggestionsLoading}
          suggestionsOpen={recipientSuggestionsOpen}
          recipients={compose.toRecipients}
          onBlur={() => setRecipientSuggestionsOpen(false)}
          onChangeInput={(value) => {
            onSetCompose((current) => ({ ...current, toInput: value }));
            setRecipientSuggestionsOpen(true);
          }}
          onFocusInput={() => setRecipientSuggestionsOpen(true)}
          onKeyDown={handleRecipientKeyDown}
          onRemoveRecipient={onRemoveRecipient}
          onSelectSuggestion={onSelectSuggestion}
        />

        <label className={styles.composeField}>
          <span className={styles.composeLabel}>참조</span>
          <input
            className="erp-input"
            value={compose.ccInput}
            onChange={(event) => onSetCompose((current) => ({ ...current, ccInput: event.target.value }))}
            placeholder="참조 주소를 쉼표로 구분해 입력"
          />
        </label>

        <label className={styles.composeField}>
          <span className={styles.composeLabel}>제목</span>
          <input
            className="erp-input"
            value={compose.subject}
            onChange={(event) => onSetCompose((current) => ({ ...current, subject: event.target.value }))}
            placeholder="메일 제목"
          />
        </label>

        <div className={styles.composeField}>
          <span className={styles.composeLabel}>본문</span>
          <div className={styles.composeEditorShell}>
            <MailboxComposeToolbar
              onCommand={handleCommand}
              onLink={() => {
                const url = window.prompt('링크 주소를 입력하세요.');
                if (!url) return;
                handleCommand('createLink', url.trim());
              }}
            />
            <div
              ref={composerRef}
              className={styles.composeEditor}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="메일 내용을 입력하세요."
              onInput={() =>
                onSetCompose((current) => ({
                  ...current,
                  body: composerRef.current?.innerHTML || '',
                }))
              }
            />
          </div>
        </div>

        <div className={styles.composeField}>
          <span className={styles.composeLabel}>첨부</span>
          <div className={styles.composeAttachments}>
            <label className={styles.composeAttachmentInputLabel}>
              <MailboxIcon name="attachment" size={16} />
              <span>파일 추가</span>
              <input hidden type="file" multiple onChange={onAttachmentChange} />
            </label>
            {attachments.map((attachment) => (
              <span key={attachment.id} className={styles.composeAttachmentChip}>
                <span>{attachment.filename}</span>
                <button type="button" className={styles.composeActionButton} onClick={() => onRemoveAttachment(attachment.id)}>
                  <MailboxIcon name="close" size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className={styles.composeFooter}>
          <span className={styles.composeMeta}>새 메일, 답장, 전달 모두 이 패널에서 이어서 작성합니다.</span>
          <div className={styles.composeHeaderActions}>
            {draftId ? (
              <button type="button" className={styles.composeFooterButton} onClick={() => onDeleteDraft(draftId)}>
                임시보관 삭제
              </button>
            ) : null}
            <button type="button" className={styles.topbarPrimaryButton} onClick={onSend} disabled={!canSend}>
              <MailboxIcon name="send" size={16} />
              <span>메일 발송</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default MailboxComposePanel;
