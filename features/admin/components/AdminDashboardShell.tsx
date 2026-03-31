'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { ADMIN_SECTIONS, type AdminSectionKey } from '@/lib/admin';
import styles from './AdminDashboardShell.module.css';

interface AdminDashboardShellProps {
  activeSection: AdminSectionKey;
  activeSectionDescription?: string;
  activeSectionLabel: string;
  backLabel?: string;
  banners: ReactNode;
  children: ReactNode;
  currentUserName: string;
  onBack?: () => void;
  onLogout: () => void;
  onSelectSection: (section: AdminSectionKey) => void;
}

export function AdminDashboardShell({
  activeSection,
  activeSectionDescription,
  activeSectionLabel,
  backLabel,
  banners,
  children,
  currentUserName,
  onBack,
  onLogout,
  onSelectSection,
}: AdminDashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasHeroDescription = Boolean(activeSectionDescription);
  const shouldCenterContent = activeSection !== 'overview';

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUserName}
            onLogout={onLogout}
            onOpenMenu={() => setMenuOpen(true)}
            brand="산업 종합 안전"
            accountLabel="관리자 계정"
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              <AdminMenuPanel
                activeSection={activeSection}
                onSelectSection={(section) => {
                  setMenuOpen(false);
                  onSelectSection(section);
                }}
              />
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div
                  className={`${styles.heroBody} ${
                    hasHeroDescription ? styles.heroBodyCompact : ''
                  }`}
                >
                  {backLabel && onBack ? (
                    <button
                      type="button"
                      className={styles.heroBackButton}
                      onClick={onBack}
                      aria-label={`${backLabel}으로 돌아가기`}
                    >
                      {'<'} {backLabel}
                    </button>
                  ) : null}
                  <div
                    className={`${styles.heroMain} ${
                      hasHeroDescription ? styles.heroMainCompact : ''
                    }`}
                  >
                    <h1
                      className={`${styles.heroTitle} ${
                        hasHeroDescription ? styles.heroTitleCompact : ''
                      }`}
                    >
                      {activeSectionLabel}
                    </h1>
                    {activeSectionDescription ? (
                      <p
                        className={`${styles.heroDescription} ${
                          hasHeroDescription ? styles.heroDescriptionCompact : ''
                        }`}
                      >
                        {activeSectionDescription}
                      </p>
                    ) : null}
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <section className={styles.mobileSectionRail} aria-label="관리자 섹션 빠른 이동">
                  {ADMIN_SECTIONS.map((section) => (
                    <button
                      key={`mobile-${section.key}`}
                      type="button"
                      className={`${styles.mobileSectionButton} ${
                        activeSection === section.key ? styles.mobileSectionButtonActive : ''
                      }`}
                      onClick={() => onSelectSection(section.key)}
                    >
                      {section.label}
                    </button>
                  ))}
                </section>
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
        onSelectSection={(section) => {
          setMenuOpen(false);
          onSelectSection(section);
        }}
      />
    </main>
  );
}
