import type { Metadata } from 'next';
import Link from 'next/link';
import { saasNavItems } from '@/lib/demoData';
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
  title: '기술지도 표준보고서',
  description: '기술지도 보고서 작성',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <div className="shell-root">
          <header className="topbar">
            <Link href="/" className="brand-lockup">
              <span className="brand-mark">STD</span>
              <span className="brand-copy">
                <strong>기술지도 표준보고서</strong>
              </span>
            </Link>
            <div className="topbar-actions">
              <Link href="/reports/new" className="erp-button erp-button-primary">
                새 보고서 시작
              </Link>
            </div>
          </header>

          <div className="shell-frame">
            <aside className="side-rail" aria-label="웹 내비게이션">
              <nav className="side-nav">
                {saasNavItems.map((item) => (
                  <Link key={item.href} href={item.href} className="side-nav-link">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>

            <main className="content-area">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
