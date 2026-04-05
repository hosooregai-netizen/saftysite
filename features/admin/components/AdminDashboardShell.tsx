'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import { PageBackControl } from '@/components/navigation/PageBackControl';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { type AdminSectionKey } from '@/lib/admin';
import styles from './AdminDashboardShell.module.css';

interface AdminDashboardShellProps {
  activeSection: AdminSectionKey;
  activeSectionLabel: string;
  backLabel?: string;
  banners: ReactNode;
  children: ReactNode;
  currentSiteKey?: string | null;
  currentUserName: string;
  onBack?: () => void;
  onLogout: () => void;
  onSelectSection: (section: AdminSectionKey) => void;
}

export function AdminDashboardShell({
  activeSection,
  activeSectionLabel,
  backLabel,
  banners,
  children,
  currentSiteKey,
  currentUserName,
  onBack,
  onLogout,
  onSelectSection,
}: AdminDashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const shouldCenterContent = activeSection !== 'overview';

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            brandHref="/admin"
            currentUserName={currentUserName}
            onLogout={onLogout}
            onOpenMenu={() => setMenuOpen(true)}
            accountLabel="관리자 계정"
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              <AdminMenuPanel
                activeSection={activeSection}
                currentSiteKey={currentSiteKey}
                onSelectSection={(section) => {
                  setMenuOpen(false);
                  onSelectSection(section);
                }}
              />
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  {backLabel && onBack ? (
                    <PageBackControl label={backLabel} onClick={onBack} />
                  ) : null}
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>{activeSectionLabel}</h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <section
                  className={`${styles.contentStack} ${
                    shouldCenterContent ? styles.contentStackCentered : ''
                  }`}
                >
                  {banners}
                  {children}
                </section>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      <AdminMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeSection={activeSection}
        currentSiteKey={currentSiteKey}
        onSelectSection={(section) => {
          setMenuOpen(false);
          onSelectSection(section);
        }}
      />
    </main>
  );
}
