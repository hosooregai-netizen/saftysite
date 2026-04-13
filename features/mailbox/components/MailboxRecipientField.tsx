import type { KeyboardEvent } from 'react';
import localStyles from './MailboxPanel.module.css';

export interface MailboxRecipientSuggestionOption {
  email: string;
  label: string;
  lastUsedAt: string | null;
  name: string | null;
  usageCount: number;
}

interface MailboxRecipientFieldProps {
  inputValue: string;
  suggestionIndex: number;
  suggestions: MailboxRecipientSuggestionOption[];
  suggestionsLoading: boolean;
  suggestionsOpen: boolean;
  recipients: string[];
  onBlur: () => void;
  onChangeInput: (value: string) => void;
  onFocusInput: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onRemoveRecipient: (email: string) => void;
  onSelectSuggestion: (suggestion: MailboxRecipientSuggestionOption) => void;
}

export function MailboxRecipientField({
  inputValue,
  suggestionIndex,
  suggestions,
  suggestionsLoading,
  suggestionsOpen,
  recipients,
  onBlur,
  onChangeInput,
  onFocusInput,
  onKeyDown,
  onRemoveRecipient,
  onSelectSuggestion,
}: MailboxRecipientFieldProps) {
  return (
    <label className={localStyles.fieldWide}>
      <span className={localStyles.fieldLabel}>받는 사람</span>
      <div className={localStyles.recipientField}>
        <div className={localStyles.recipientInputShell}>
          {recipients.map((recipient) => (
            <span key={recipient} className={localStyles.recipientChip}>
              <span>{recipient}</span>
              <button
                type="button"
                className={localStyles.recipientChipRemove}
                onClick={() => onRemoveRecipient(recipient)}
                aria-label={`${recipient} 제거`}
              >
                x
              </button>
            </span>
          ))}
          <input
            className={localStyles.recipientInput}
            value={inputValue}
            onBlur={onBlur}
            onChange={(event) => onChangeInput(event.target.value)}
            onFocus={onFocusInput}
            onKeyDown={onKeyDown}
            placeholder={recipients.length === 0 ? 'example@domain.com 입력 후 띄어쓰기' : ''}
          />
        </div>
        {suggestionsOpen && (suggestionsLoading || suggestions.length > 0) ? (
          <div className={localStyles.recipientSuggestionPanel}>
            {suggestionsLoading ? (
              <div className={localStyles.recipientSuggestionEmpty}>이전 발송 메일을 불러오는 중입니다.</div>
            ) : null}
            {!suggestionsLoading
              ? suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.email}
                    type="button"
                    className={`${localStyles.recipientSuggestionItem} ${
                      index === suggestionIndex ? localStyles.recipientSuggestionItemActive : ''
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onSelectSuggestion(suggestion);
                    }}
                  >
                    <span className={localStyles.recipientSuggestionPrimary}>{suggestion.label}</span>
                    <span className={localStyles.recipientSuggestionMeta}>최근 발송 {suggestion.usageCount}회</span>
                  </button>
                ))
              : null}
          </div>
        ) : null}
      </div>
    </label>
  );
}
