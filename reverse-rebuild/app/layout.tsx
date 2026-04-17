import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ReverseAppProvider } from '../src/state';

export const metadata: Metadata = {
  title: 'Reverse Rebuild',
  description: 'Reverse-spec-based standalone rebuild of the saftysite service',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ReverseAppProvider>{children}</ReverseAppProvider>
      </body>
    </html>
  );
}

