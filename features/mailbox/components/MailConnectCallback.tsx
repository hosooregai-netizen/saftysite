'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { MailConnectCallbackState } from './MailConnectCallbackState';
import { useMailConnectCallback } from './useMailConnectCallback';

interface MailConnectCallbackProps {
  provider: 'google' | 'naver';
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
