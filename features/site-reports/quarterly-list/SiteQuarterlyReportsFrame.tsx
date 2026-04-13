'use client';

import type { ReactNode } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import { PageBackControl } from '@/components/navigation/PageBackControl';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { SiteReportsSummaryBar } from '../components/SiteReportsSummaryBar';
import styles from '../components/SiteReportsScreen.module.css';

interface SiteQuarterlyReportsFrameProps {
  addressDisplay: string;
  amountDisplay: string;
  backHref: string;
  backLabel: string;
  children: ReactNode;
  currentSiteId: string;
  currentUserName?: string | null;
  isAdminView: boolean;
  menuOpen: boolean;
  periodDisplay: string;
  siteNameDisplay: string;
  onCloseMenu: () => void;
  onLogout: () => void;
  onOpenMenu: () => void;
}

export function SiteQuarterlyReportsFrame({
  addressDisplay,
  amountDisplay,
  backHref,
  backLabel,
  children,
  currentSiteId,
  currentUserName,
  isAdminView,
  menuOpen,
  periodDisplay,
  siteNameDisplay,
  onCloseMenu,
  onLogout,
  onOpenMenu,
}: SiteQuarterlyReportsFrameProps) {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            brandHref={isAdminView ? '/admin' : '/'}
            currentUserName={currentUserName}
            onLogout={onLogout}
            onOpenMenu={onOpenMenu}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel activeSection="headquarters" currentSiteKey={currentSiteId} />
              ) : (
                <WorkerMenuPanel currentSiteKey={currentSiteId} />
              )}
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <PageBackControl href={backHref} label={backLabel} />
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>분기 종합 보고서 목록</h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <SiteReportsSummaryBar
                  addressDisplay={addressDisplay}
                  amountDisplay={amountDisplay}
                  periodDisplay={periodDisplay}
                  siteNameDisplay={siteNameDisplay}
                />
                {children}
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      {isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={onCloseMenu}
          activeSection="headquarters"
          currentSiteKey={currentSiteId}
        />
      ) : (
        <WorkerMenuDrawer open={menuOpen} onClose={onCloseMenu} currentSiteKey={currentSiteId} />
      )}
    </main>
  );
}
