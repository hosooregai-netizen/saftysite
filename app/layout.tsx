import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '한국종합안전',
  description: '현장 사진 기반 전경 확인 및 위험요인분석 도구',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
