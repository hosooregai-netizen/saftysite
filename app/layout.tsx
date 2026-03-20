import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AppProviders from '@/components/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: '한국종합안전 업무 시스템',
  description: '산업안전 문서관리 및 위험성평가 보고서 작성 화면',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
