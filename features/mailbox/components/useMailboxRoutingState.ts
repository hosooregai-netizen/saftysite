'use client';

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  deriveInitialComposeMode,
  deriveInitialView,
  deriveMailboxTab,
} from './mailboxViewHelpers';
import type {
  ComposeMode,
  MailboxTab,
  MailboxView,
} from './mailboxPanelTypes';

interface RouterLike {
  replace: (href: string, options?: { scroll?: boolean }) => void;
}

interface SearchParamsLike {
  get: (key: string) => string | null;
  toString: () => string;
}

interface UseMailboxRoutingStateParams {
  headquarterId: string;
  pathname: string;
  reportKey: string;
  router: RouterLike;
  searchParams: SearchParamsLike;
  siteId: string;
}

export function useMailboxRoutingState({
  headquarterId,
  pathname,
  reportKey,
  router,
  searchParams,
  siteId,
}: UseMailboxRoutingStateParams) {
  const nextBox = searchParams.get('box');
  const requestedThreadId = searchParams.get('threadId') || '';
  const routeKey = `${pathname}:${nextBox || ''}:${requestedThreadId}:${reportKey}:${siteId}:${headquarterId}`;
  const routeComposeMode = deriveInitialComposeMode({
    box: nextBox,
    headquarterId,
    reportKey,
    siteId,
  });
  const routeView = deriveInitialView({
    box: nextBox,
    threadId: requestedThreadId,
  });
  const [viewState, setViewState] = useState<{ key: string; value: MailboxView }>({
    key: routeKey,
    value: routeView,
  });
  const [composeModeState, setComposeModeState] = useState<{
    key: string;
    value: ComposeMode;
  }>({
    key: routeKey,
    value: routeComposeMode,
  });

  useEffect(() => {
    if (nextBox === 'accounts') {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set('box', 'all');
      router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false });
    }
  }, [nextBox, pathname, router, searchParams]);

  const tab: MailboxTab = deriveMailboxTab(nextBox);
  const view = viewState.key === routeKey ? viewState.value : routeView;
  const composeMode =
    composeModeState.key === routeKey ? composeModeState.value : routeComposeMode;
  const setView: Dispatch<SetStateAction<MailboxView>> = (value) => {
    setViewState((current) => ({
      key: routeKey,
      value:
        typeof value === 'function'
          ? value(current.key === routeKey ? current.value : routeView)
          : value,
    }));
  };
  const setComposeMode: Dispatch<SetStateAction<ComposeMode>> = (value) => {
    setComposeModeState((current) => ({
      key: routeKey,
      value:
        typeof value === 'function'
          ? value(current.key === routeKey ? current.value : routeComposeMode)
          : value,
    }));
  };

  return {
    composeMode,
    requestedThreadId,
    setComposeMode,
    setView,
    tab,
    view,
  };
}
