'use client';

import { useState } from 'react';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useControllerDashboard } from '@/hooks/controller/useControllerDashboard';
import type { SafetyUser } from '@/types/backend';
import styles from './ControllerDashboard.module.css';
import ContentItemsSection from './ContentItemsSection';
import HeadquartersSection from './HeadquartersSection';
import OverviewPanel from './OverviewPanel';
import SitesSection from './SitesSection';
import UsersSection from './UsersSection';
import { CONTROLLER_SECTIONS, type ControllerSectionKey } from './shared';

interface ControllerDashboardProps {
  currentUser: SafetyUser;
  onLogout: () => void;
}

export default function ControllerDashboard({
  currentUser,
  onLogout,
}: ControllerDashboardProps) {
  const [activeSection, setActiveSection] = useState<ControllerSectionKey>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const dashboard = useControllerDashboard(true);
  const { sessions } = useInspectionSessions();
  const busy = dashboard.isLoading || dashboard.isMutating;

  const selectSection = (next: ControllerSectionKey) => {
    setActiveSection(next);
    setMenuOpen(false);
  };
  const activeSectionMeta =
    CONTROLLER_SECTIONS.find((section) => section.key === activeSection) ?? CONTROLLER_SECTIONS[0];

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return (
          <UsersSection
            busy={busy}
            styles={styles}
            assignments={dashboard.data.assignments}
            sessions={sessions}
            sites={dashboard.data.sites}
            users={dashboard.data.users}
            onCreate={dashboard.createUser}
            onSaveEdit={dashboard.saveUserEdit}
            onDeactivate={dashboard.deactivateUser}
          />
        );
      case 'headquarters':
        return (
          <HeadquartersSection
            busy={busy}
            styles={styles}
            headquarters={dashboard.data.headquarters}
            onCreate={dashboard.createHeadquarter}
            onUpdate={dashboard.updateHeadquarter}
            onDeactivate={dashboard.deactivateHeadquarter}
          />
        );
      case 'sites':
        return (
          <SitesSection
            busy={busy}
            styles={styles}
            assignments={dashboard.data.assignments}
            headquarters={dashboard.data.headquarters}
            sites={dashboard.data.sites}
            users={dashboard.data.users}
            onCreate={dashboard.createSite}
            onUpdate={dashboard.updateSite}
            onDeactivate={dashboard.deactivateSite}
            onAssignFieldAgent={dashboard.assignFieldAgentToSite}
          />
        );
      case 'content':
        return (
          <ContentItemsSection
            busy={busy}
            styles={styles}
            items={dashboard.data.contentItems}
            onCreate={dashboard.createContentItem}
            onUpdate={dashboard.updateContentItem}
            onDeactivate={dashboard.deactivateContentItem}
          />
        );
      default:
        return (
          <OverviewPanel
            data={dashboard.data}
            sessions={sessions}
            styles={styles}
            onSelectSection={selectSection}
          />
        );
    }
  };

  const menuButtons = CONTROLLER_SECTIONS.map((section) => (
    <button
      key={section.key}
      type="button"
      className={`${styles.menuButton} ${
        activeSection === section.key ? styles.menuButtonActive : ''
      }`}
      onClick={() => selectSection(section.key)}
    >
      <span className={styles.menuLabel}>{section.label}</span>
      <span className={styles.menuDescription}>{section.description}</span>
    </button>
  ));

  const navigation = (
    <div className={styles.menuPanel} id="worker-menu-nav-panel">
      <section className={styles.menuSection} aria-labelledby="controller-menu-heading">
        <h2 id="controller-menu-heading" className={styles.menuTitle}>
          관리자 메뉴
        </h2>
        <div className={styles.menuList}>{menuButtons}</div>
      </section>
    </div>
  );

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUser.name}
            onLogout={onLogout}
            onOpenMenu={() => setMenuOpen(true)}
            brand="한국 종합 안전"
            accountLabel="관리자 계정"
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>{navigation}</WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>{activeSectionMeta.label}</h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <section className={styles.mobileSectionRail} aria-label="관리자 섹션 빠른 이동">
                  {CONTROLLER_SECTIONS.map((section) => (
                    <button
                      key={`mobile-${section.key}`}
                      type="button"
                      className={`${styles.mobileSectionButton} ${
                        activeSection === section.key ? styles.mobileSectionButtonActive : ''
                      }`}
                      onClick={() => selectSection(section.key)}
                    >
                      {section.label}
                    </button>
                  ))}
                </section>

                <section className={styles.contentStack}>
                  {dashboard.error ? (
                    <div className={styles.bannerError}>{dashboard.error}</div>
                  ) : null}
                  {dashboard.notice ? (
                    <div className={styles.bannerNotice}>{dashboard.notice}</div>
                  ) : null}
                  {renderSection()}
                </section>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className={styles.drawerBackdrop}
            onClick={() => setMenuOpen(false)}
            aria-label="메뉴 닫기"
          />
          <aside className={styles.drawer}>{navigation}</aside>
        </>
      ) : null}
    </main>
  );
}
