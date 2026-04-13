'use client';

import { useEffect, useState } from 'react';

interface SearchParamsLike {
  get: (key: string) => string | null;
}

export function useMailboxPanelUiState(searchParams: SearchParamsLike) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [oauthProvider, setOauthProvider] = useState<'google' | 'naver_mail' | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [storedOauthNotice] = useState(
    () =>
      (typeof window !== 'undefined' &&
        window.sessionStorage.getItem('mailbox-oauth-notice')) ||
      '',
  );
  const [storedOauthError] = useState(
    () =>
      (typeof window !== 'undefined' &&
        window.sessionStorage.getItem('mailbox-oauth-error')) ||
      '',
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem('mailbox-oauth-notice');
    window.sessionStorage.removeItem('mailbox-oauth-error');
  }, []);

  return {
    activeError: error || searchParams.get('oauthError') || storedOauthError || null,
    activeNotice: notice || searchParams.get('oauthNotice') || storedOauthNotice || null,
    error,
    isDemoMode,
    notice,
    oauthProvider,
    query,
    reportPickerOpen,
    setError,
    setIsDemoMode,
    setNotice,
    setOauthProvider,
    setQuery,
    setReportPickerOpen,
  };
}
