'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import InstituteWordmark from '@/components/branding/InstituteWordmark';
import { saasNavItems } from '@/lib/demoData';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const landingNavItems = [
    { href: '#service', label: '서비스 안내' },
    { href: '#process', label: '작성 절차' },
    { href: '#pricing', label: '요금 안내' },
    { href: '/reports', label: '보고서 보기' },
  ] as const;
  const resolveActive = (href: string) => {
    if (href === '/reports') {
      return pathname === '/reports' || (pathname.startsWith('/reports/') && pathname !== '/reports/new');
    }
    return pathname === href;
  };

  return (
    <div className={`shell-root ${isLanding ? 'shell-root-landing' : ''}`}>
      <header className={`topbar ${isLanding ? 'topbar-landing' : ''}`}>
        <Link href="/" className="brand-lockup">
          <InstituteWordmark
            className="topbar-wordmark"
            tone={isLanding ? 'dark' : 'light'}
            productLine={isLanding ? '기술지도 결과보고서 작성 지원' : 'AI'}
            showSecondary={!isLanding}
          />
        </Link>
        <div className={`topbar-cluster ${isLanding ? 'topbar-cluster-landing' : ''}`}>
          {isLanding ? (
            <>
              <nav className="topbar-nav" aria-label="랜딩 메뉴">
                {landingNavItems.map((item) => (
                  <Link key={item.href} href={item.href} className="topbar-nav-link">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="topbar-actions">
                <Link href="/reports" className="erp-button erp-button-secondary">
                  샘플 보고서 보기
                </Link>
                <Link href="/reports/new" className="erp-button erp-button-primary">
                  보고서 작성 시작
                </Link>
              </div>
            </>
          ) : (
            <div className="topbar-actions">
              <Link href="/reports/new" className="erp-button erp-button-primary">
                새 보고서 시작
              </Link>
            </div>
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
                <Link
                  key={item.href}
                  href={item.href}
                  className={`side-nav-link ${resolveActive(item.href) ? 'side-nav-link-active' : ''}`}
                >
                  <span className="side-nav-link-label">{item.label}</span>
                  <span className="side-nav-link-description">{item.description}</span>
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
