import type { Dispatch, KeyboardEvent, SetStateAction } from 'react';
import type { ComposeState, RecipientSuggestionItem } from './mailboxPanelTypes';
import { dedupeRecipients, extractRecipientTokens, isLikelyEmail } from './mailboxComposeHelpers';

interface UseMailboxRecipientActionsParams {
  compose: ComposeState;
  recipientSuggestionIndex: number;
  recipientSuggestionsOpen: boolean;
  setCompose: Dispatch<SetStateAction<ComposeState>>;
  setRecipientSuggestionIndex: Dispatch<SetStateAction<number>>;
  setRecipientSuggestionsOpen: Dispatch<SetStateAction<boolean>>;
  visibleRecipientSuggestions: RecipientSuggestionItem[];
}

export function useMailboxRecipientActions({
  compose,
  recipientSuggestionIndex,
  recipientSuggestionsOpen,
  setCompose,
  setRecipientSuggestionIndex,
  setRecipientSuggestionsOpen,
  visibleRecipientSuggestions,
}: UseMailboxRecipientActionsParams) {
  const commitRecipientTokens = (tokens: string[]) => {
    const nextTokens = dedupeRecipients([...compose.toRecipients, ...tokens.filter(isLikelyEmail)]);
    setCompose((current) => ({
      ...current,
      toInput: '',
      toRecipients: nextTokens,
    }));
    setRecipientSuggestionIndex(0);
  };

  const handleRecipientSuggestionSelect = (suggestion: RecipientSuggestionItem) => {
    commitRecipientTokens([suggestion.email]);
    setRecipientSuggestionsOpen(false);
  };

  const handleRecipientInputChange = (value: string) => {
    if (!/[\s,;]$/.test(value)) {
      setCompose((current) => ({
        ...current,
        toInput: value,
      }));
      setRecipientSuggestionsOpen(true);
      setRecipientSuggestionIndex(0);
      return;
    }
    const tokens = extractRecipientTokens(value);
    const validTokens = tokens.filter(isLikelyEmail);
    const invalidTokens = tokens.filter((item) => !isLikelyEmail(item));
    if (validTokens.length > 0) {
      setCompose((current) => ({
        ...current,
        toInput: invalidTokens.join(' '),
        toRecipients: dedupeRecipients([...current.toRecipients, ...validTokens]),
      }));
      return;
    }
    setCompose((current) => ({
      ...current,
      toInput: invalidTokens.join(' '),
    }));
  };

  const handleRecipientKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      if (visibleRecipientSuggestions.length === 0) return;
      event.preventDefault();
      setRecipientSuggestionsOpen(true);
      setRecipientSuggestionIndex((current) =>
        recipientSuggestionsOpen ? (current + 1) % visibleRecipientSuggestions.length : 0,
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      if (visibleRecipientSuggestions.length === 0) return;
      event.preventDefault();
      setRecipientSuggestionsOpen(true);
      setRecipientSuggestionIndex((current) =>
        recipientSuggestionsOpen
          ? current <= 0
            ? visibleRecipientSuggestions.length - 1
            : current - 1
          : visibleRecipientSuggestions.length - 1,
      );
      return;
    }
    if (event.key === 'Escape') {
      setRecipientSuggestionsOpen(false);
      return;
    }
    if (
      event.key === 'Enter' &&
      recipientSuggestionsOpen &&
      visibleRecipientSuggestions[recipientSuggestionIndex]
    ) {
      event.preventDefault();
      handleRecipientSuggestionSelect(visibleRecipientSuggestions[recipientSuggestionIndex]);
      return;
    }
    if (
      event.key !== 'Enter' &&
      event.key !== 'Tab' &&
      event.key !== ' ' &&
      event.key !== ',' &&
      event.key !== ';'
    ) {
      return;
    }
    const candidate = compose.toInput.trim();
    if (!isLikelyEmail(candidate)) return;
    event.preventDefault();
    commitRecipientTokens([candidate]);
  };

  const handleRecipientBlur = () => {
    setRecipientSuggestionsOpen(false);
    if (!isLikelyEmail(compose.toInput.trim())) return;
    commitRecipientTokens([compose.toInput.trim()]);
  };

  const handleRemoveRecipient = (email: string) => {
    setCompose((current) => ({
      ...current,
      toRecipients: current.toRecipients.filter((item) => item !== email),
    }));
  };

  return {
    handleRecipientBlur,
    handleRecipientInputChange,
    handleRecipientKeyDown,
    handleRecipientSuggestionSelect,
    handleRemoveRecipient,
  };
}
