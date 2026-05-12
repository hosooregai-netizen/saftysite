import type { Metadata } from 'next';
import AppProviders from '@/components/providers/AppProviders';
import { AppShell } from '@/components/AppShell';
import { Cormorant_Garamond, Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const bodyFont = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: '대한안전산업연구원 AI | 기술지도 결과보고서 자동작성 서비스',
  description:
    '개인 지도사와 소규모 지도기관을 위한 기술지도 결과보고서 초안 작성·검토·출력 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
