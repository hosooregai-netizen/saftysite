'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import InstituteWordmark from '@/components/branding/InstituteWordmark';
import { saasNavItems } from '@/lib/demoData';
import {
  canUseWorkspaceServerApis,
  peekCachedSession,
  subscribeCachedSession,
  type DemoSession,
} from '@/lib/reportApi';
import { beginGoogleWorkspaceAuth } from '@/lib/sessionAuthFlow';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const isDriveHost = pathname === '/webhard' || pathname.startsWith('/share/');
  const isMailboxHost = pathname === '/mailbox' || pathname.startsWith('/mail/connect/');
  const landingNavItems = [
    { href: '#service', label: '서비스 안내' },
    { href: '#process', label: '작성 절차' },
    { href: '#preview', label: '표준 양식 미리보기' },
    { href: '#pricing', label: '요금 안내' },
  ] as const;
  const resolveActive = (href: string) => {
    if (href === '/reports') {
      return pathname === '/reports' || (pathname.startsWith('/reports/') && pathname !== '/reports/new');
    }
    return pathname === href;
  };
  const session = useSyncExternalStore<DemoSession | null | undefined>(
    subscribeCachedSession,
    () => peekCachedSession(),
    () => undefined,
  );

  const canUseServerApis = session !== undefined && canUseWorkspaceServerApis(session);

  const renderAccountAction = () => {
    if (canUseServerApis) {
      return (
        <Link href="/account#account" className="erp-button erp-button-secondary">
          {session?.userName || '계정'}
        </Link>
      );
    }

    return (
      <button
        type="button"
        className="erp-button erp-button-secondary"
        onClick={() => {
          void beginGoogleWorkspaceAuth().catch((error) => {
            window.alert(
              error instanceof Error ? error.message : '구글 로그인으로 이동하지 못했습니다.',
            );
          });
        }}
      >
        Google 로그인
      </button>
    );
  };

  if (isDriveHost || isMailboxHost) {
    return <div className="drive-host-root">{children}</div>;
  }

  return (
    <div className={`shell-root ${isLanding ? 'shell-root-landing' : ''}`}>
      <header className={`topbar ${isLanding ? 'topbar-landing' : ''}`}>
        <Link href="/" className="brand-lockup">
          <InstituteWordmark
            className="topbar-wordmark"
            tone={isLanding ? 'dark' : 'light'}
            productLine={isLanding ? '기술지도 결과보고서 작성 지원' : '업무 지원'}
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
                {renderAccountAction()}
                <Link href="/reports/new" className="erp-button erp-button-primary">
                  보고서 작성 시작
                </Link>
              </div>
            </>
          ) : (
            <div className="topbar-actions">
              {renderAccountAction()}
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
