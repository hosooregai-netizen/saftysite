'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { saasNavItems } from '@/lib/demoData';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <div className={`shell-root ${isLanding ? 'shell-root-landing' : ''}`}>
      <header className={`topbar ${isLanding ? 'topbar-landing' : ''}`}>
        <Link href="/" className="brand-lockup">
          <span className="brand-mark">STD</span>
          <span className="brand-copy">
            <strong>기술지도 표준보고서</strong>
            <span>보고서 작성 SaaS</span>
          </span>
        </Link>
        <div className="topbar-actions">
          {isLanding ? (
            <>
              <Link href="/reports" className="erp-button erp-button-secondary">
                작업 화면 보기
              </Link>
              <Link href="/reports/new" className="erp-button erp-button-primary">
                무료 체험 시작
              </Link>
            </>
          ) : (
            <Link href="/reports/new" className="erp-button erp-button-primary">
              새 보고서 시작
            </Link>
          )}
        </div>
      </header>

      {isLanding ? (
        <main className="landing-main">{children}</main>
      ) : (
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
      )}
    </div>
  );
}
