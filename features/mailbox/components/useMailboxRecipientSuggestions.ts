'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchMailRecipientSuggestions } from '@/lib/mail/apiClient';
import type { ComposeState, RecipientSuggestionItem } from './mailboxPanelTypes';

interface UseMailboxRecipientSuggestionsParams {
  compose: ComposeState;
  isDemoMode: boolean;
  selectedAccountId: string;
  view: 'list' | 'thread' | 'compose';
}

export function useMailboxRecipientSuggestions({
  compose,
  isDemoMode,
  selectedAccountId,
  view,
}: UseMailboxRecipientSuggestionsParams) {
  const [recipientSuggestions, setRecipientSuggestions] = useState<RecipientSuggestionItem[]>([]);
  const [recipientSuggestionsLoading, setRecipientSuggestionsLoading] = useState(false);
  const [recipientSuggestionsOpen, setRecipientSuggestionsOpen] = useState(false);
  const [recipientSuggestionIndex, setRecipientSuggestionIndex] = useState(0);

  useEffect(() => {
    if (isDemoMode || view !== 'compose' || !selectedAccountId) {
      setRecipientSuggestions([]);
      setRecipientSuggestionsLoading(false);
      setRecipientSuggestionIndex(0);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          setRecipientSuggestionsLoading(true);
          const response = await fetchMailRecipientSuggestions({
            accountId: selectedAccountId,
            limit: 8,
            query: compose.toInput.trim(),
          });
          if (cancelled) return;
          setRecipientSuggestions(
            response.rows.map((item) => ({
              ...item,
              label: item.name ? `${item.name} <${item.email}>` : item.email,
            })),
          );
          setRecipientSuggestionIndex(0);
        } catch {
          if (!cancelled) {
            setRecipientSuggestions([]);
            setRecipientSuggestionIndex(0);
          }
        } finally {
          if (!cancelled) {
            setRecipientSuggestionsLoading(false);
          }
        }
      })();
    }, compose.toInput.trim() ? 120 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [compose.toInput, isDemoMode, selectedAccountId, view]);

  const visibleRecipientSuggestions = useMemo(
    () =>
      recipientSuggestions.filter(
        (item) =>
          !compose.toRecipients.some(
            (recipient) => recipient.toLowerCase() === item.email.toLowerCase(),
          ),
      ),
    [compose.toRecipients, recipientSuggestions],
  );

  return {
    recipientSuggestionIndex,
    recipientSuggestionsLoading,
    recipientSuggestionsOpen,
    setRecipientSuggestionIndex,
    setRecipientSuggestionsOpen,
    visibleRecipientSuggestions,
  };
}
