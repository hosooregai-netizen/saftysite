'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import {
  WorkerMenuDrawer,
  WorkerMenuPanel,
  type WorkerMenuItem,
} from '@/components/worker/WorkerMenu';
import styles from './ErpScreen.module.css';

interface ErpTabItem {
  href: string;
  label: string;
}

interface ErpSiteShellProps {
  actions?: ReactNode;
  children: ReactNode;
  currentUserName?: string | null;
  description?: string;
  eyebrow?: string;
  heroMeta?: ReactNode;
  menuItems?: WorkerMenuItem[];
  onLogout: () => void;
  summary?: ReactNode;
  tabs?: ErpTabItem[];
  title: string;
}

export function ErpSiteShell({
  actions,
  children,
  currentUserName,
  description,
  eyebrow = 'SI SAFER ERP',
  heroMeta,
  menuItems,
  onLogout,
  summary,
  tabs = [],
  title,
}: ErpSiteShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            brand="SI SAFER ERP"
            currentUserName={currentUserName}
            onLogout={onLogout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              <WorkerMenuPanel items={menuItems} />
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <div className={styles.heroMain}>
                    <span className={styles.heroEyebrow}>{eyebrow}</span>
                    <h1 className={styles.heroTitle}>{title}</h1>
                    {description ? (
                      <p className={styles.heroDescription}>{description}</p>
                    ) : null}
                    {heroMeta ? <div className={styles.heroMeta}>{heroMeta}</div> : null}
                  </div>

                  {actions ? <div className={styles.heroActions}>{actions}</div> : null}
                </div>

                {tabs.length > 0 ? (
                  <nav className={styles.navTabs} aria-label="현장 ERP 메뉴">
                    {tabs.map((tab) => (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        className={`${styles.navLink} ${
                          pathname === tab.href ? styles.navLinkActive : ''
                        }`}
                      >
                        {tab.label}
                      </Link>
                    ))}
                  </nav>
                ) : null}
              </header>

              <div className={styles.pageGrid}>
                {summary}
                {children}
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} items={menuItems} />
    </main>
  );
}
