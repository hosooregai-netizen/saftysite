'use client';

import { useEffect, useState } from 'react';
import { fetchMailThreadDetail, fetchMailThreads } from '@/lib/mail/apiClient';
import type { MailAccount, MailThread, MailThreadDetail } from '@/types/mail';
import {
  getDemoMailboxThreadDetail,
  getDemoMailboxThreads,
} from './demoMailboxData';
import {
  normalizeMailThreadDetailUi,
  normalizeMailThreadUi,
} from './mailboxPanelHelpers';
import { THREAD_PAGE_SIZE, type MailboxTab, type MailboxView } from './mailboxPanelTypes';

interface UseMailboxThreadStateParams {
  headquarterId: string;
  isDemoMode: boolean;
  query: string;
  requestedThreadId: string;
  selectedAccount: MailAccount | null;
  selectedAccountId: string;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  siteId: string;
  tab: MailboxTab;
  view: MailboxView;
}

export function useMailboxThreadState({
  headquarterId,
  isDemoMode,
  query,
  requestedThreadId,
  selectedAccount,
  selectedAccountId,
  setError,
  siteId,
  tab,
  view,
}: UseMailboxThreadStateParams) {
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [threadOffset, setThreadOffset] = useState(0);
  const [threadTotal, setThreadTotal] = useState(0);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [threadDetail, setThreadDetail] = useState<MailThreadDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);

  useEffect(() => {
    setSelectedThreadId(requestedThreadId);
  }, [requestedThreadId]);

  useEffect(() => {
    setThreadOffset(0);
  }, [headquarterId, query, selectedAccount?.id, siteId, tab]);

  useEffect(() => {
    if (isDemoMode) {
      const demoThreads = getDemoMailboxThreads(tab, query).filter(
        (thread) => !selectedAccountId || thread.accountId === selectedAccountId,
      );
      setThreads(demoThreads);
      setThreadTotal(demoThreads.length);
      setSelectedThreadId((current) =>
        current && demoThreads.some((item) => item.id === current)
          ? current
          : demoThreads[0]?.id || '',
      );
      setThreadLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        setThreadLoading(true);
        setError(null);
        const response = await fetchMailThreads({
          accountId: selectedAccount?.id || '',
          box: tab,
          headquarterId,
          limit: THREAD_PAGE_SIZE,
          offset: threadOffset,
          query,
          reportKey: '',
          siteId,
        });
        if (cancelled) return;
        setThreads(response.rows.map(normalizeMailThreadUi));
        setThreadTotal(response.total);
        setSelectedThreadId((current) =>
          current && response.rows.some((item) => item.id === current)
            ? current
            : response.rows[0]?.id || '',
        );
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : '메일 스레드를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setThreadLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [headquarterId, isDemoMode, query, selectedAccount?.id, selectedAccountId, setError, siteId, tab, threadOffset]);

  useEffect(() => {
    if (isDemoMode) {
      if (!selectedThreadId || view !== 'thread') {
        setThreadDetail(null);
        setThreadLoading(false);
        return;
      }
      setThreadLoading(true);
      setThreadDetail(getDemoMailboxThreadDetail(selectedThreadId));
      setThreadLoading(false);
      return;
    }

    if (!selectedThreadId || view !== 'thread') {
      setThreadDetail(null);
      setThreadLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        setThreadLoading(true);
        const detail = normalizeMailThreadDetailUi(
          await fetchMailThreadDetail(selectedThreadId),
        );
        if (!cancelled) {
          setThreadDetail(detail);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : '메일 스레드 상세를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setThreadLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDemoMode, selectedThreadId, setError, view]);

  const threadPage = Math.floor(threadOffset / THREAD_PAGE_SIZE) + 1;
  const threadPageCount = Math.max(1, Math.ceil(threadTotal / THREAD_PAGE_SIZE));

  return {
    canGoNextThreadPage: threadOffset + THREAD_PAGE_SIZE < threadTotal,
    canGoPrevThreadPage: threadOffset > 0,
    moveThreadPage: (nextPage: number) => {
      const boundedPage = Math.min(Math.max(1, nextPage), threadPageCount);
      setThreadOffset((boundedPage - 1) * THREAD_PAGE_SIZE);
    },
    selectedThreadId,
    setSelectedThreadId,
    setThreadDetail,
    setThreadOffset,
    setThreadTotal,
    setThreads,
    threadDetail,
    threadLoading,
    threadOffset,
    threadPage,
    threadPageCount,
    threadRangeEnd: Math.min(threadOffset + threads.length, threadTotal),
    threadRangeStart: threadTotal === 0 ? 0 : threadOffset + 1,
    threadTotal,
    threads,
  };
}
