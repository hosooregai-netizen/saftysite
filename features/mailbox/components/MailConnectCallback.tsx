'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { MailConnectCallbackState } from './MailConnectCallbackState';
import { useMailConnectCallback } from './useMailConnectCallback';
import type { MailOAuthCallbackProvider } from './mailConnectCallbackHelpers';

interface MailConnectCallbackProps {
  provider: MailOAuthCallbackProvider;
}

export function MailConnectCallback({ provider }: MailConnectCallbackProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useMailConnectCallback({
    provider,
    router,
    searchParams,
  });

  return <MailConnectCallbackState />;
}

export default MailConnectCallback;
