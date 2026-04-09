'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './MobileShell.module.css';

interface MobileShellProps {
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  currentUserName?: string | null;
  footer?: ReactNode;
  fullHeight?: boolean;
  kicker?: string;
  onLogout: () => void;
  subtitle?: string | null;
  tabBar?: ReactNode;
  title: string;
  webHref: string;
  webLabel?: string;
}

export function MobileShell({
  backHref,
  backLabel = '이전',
  children,
  currentUserName,
  footer,
  fullHeight = false,
  kicker,
  onLogout,
  subtitle,
  tabBar,
  title,
  webHref,
  webLabel = '웹에서 보기',
}: MobileShellProps) {
  return (
    <main className={`app-page ${styles.page} ${fullHeight ? styles.pageFullHeight : ''}`}>
      <div className={`${styles.pageShell} ${fullHeight ? styles.pageShellFullHeight : ''}`}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            {backHref ? (
              <Link href={backHref} className={styles.backLink}>
                <span className={styles.backIcon} aria-hidden="true">
                  {'<'}
                </span>
                <span>{backLabel}</span>
              </Link>
            ) : (
              <Link href="/mobile" className={styles.homeLink}>
                작업자 모바일
              </Link>
            )}

            <div className={styles.headerActions}>
              <Link
                href={webHref}
                className={`app-button app-button-secondary ${styles.headerActionButton}`}
              >
                {webLabel}
              </Link>
              <button
                type="button"
                className={styles.logoutButton}
                onClick={onLogout}
              >
                로그아웃
              </button>
            </div>
          </div>

          <div className={styles.headerBody}>
            {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
        </header>

        <div
          className={[
            styles.content,
            fullHeight ? styles.contentFullHeight : '',
            footer && !fullHeight ? styles.contentWithFooter : '',
            tabBar && !fullHeight ? styles.contentWithTabBar : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </div>
      </div>

      {tabBar ? (
        <div className={styles.tabBarWrapper}>
          {tabBar}
        </div>
      ) : footer ? (
        <div className={styles.footerBar}>
          <div className={styles.footerInner}>{footer}</div>
        </div>
      ) : null}
    </main>
  );
}
