import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '위험요인 분석 결과',
  description: '한국종합안전 위험요인 분석 보고서',
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
