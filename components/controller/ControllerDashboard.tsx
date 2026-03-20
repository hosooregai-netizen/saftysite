'use client';

import { useMemo, useState } from 'react';
import type { SafetyUser } from '@/types/backend';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useControllerDashboard } from '@/hooks/controller/useControllerDashboard';
import styles from './ControllerDashboard.module.css';
import ContentItemsSection from './ContentItemsSection';
import HeadquartersSection from './HeadquartersSection';
import OverviewPanel from './OverviewPanel';
import SitesSection from './SitesSection';
import UsersSection from './UsersSection';
import {
  CONTROLLER_SECTIONS,
  getUserRoleLabel,
  type ControllerSectionKey,
} from './shared';

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
  const activeMeta = useMemo(
    () => CONTROLLER_SECTIONS.find((section) => section.key === activeSection),
    [activeSection]
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <UsersSection busy={busy} styles={styles} assignments={dashboard.data.assignments} sessions={sessions} sites={dashboard.data.sites} users={dashboard.data.users} onCreate={dashboard.createUser} onSaveEdit={dashboard.saveUserEdit} onDeactivate={dashboard.deactivateUser} />;
      case 'headquarters':
        return <HeadquartersSection busy={busy} styles={styles} headquarters={dashboard.data.headquarters} onCreate={dashboard.createHeadquarter} onUpdate={dashboard.updateHeadquarter} onDeactivate={dashboard.deactivateHeadquarter} />;
      case 'sites':
        return <SitesSection busy={busy} styles={styles} assignments={dashboard.data.assignments} headquarters={dashboard.data.headquarters} sites={dashboard.data.sites} users={dashboard.data.users} onCreate={dashboard.createSite} onUpdate={dashboard.updateSite} onDeactivate={dashboard.deactivateSite} onAssignFieldAgent={dashboard.assignFieldAgentToSite} />;
      case 'content':
        return <ContentItemsSection busy={busy} styles={styles} items={dashboard.data.contentItems} onCreate={dashboard.createContentItem} onUpdate={dashboard.updateContentItem} onDeactivate={dashboard.deactivateContentItem} />;
      default:
        return <OverviewPanel data={dashboard.data} sessions={sessions} styles={styles} onSelectSection={selectSection} />;
    }
  };

  const selectSection = (next: ControllerSectionKey) => {
    setActiveSection(next);
    setMenuOpen(false);
  };

  const navigation = (
    <>
      <p className={styles.navTitle}>관리자 메뉴</p>
      <div className={styles.navList}>
        {CONTROLLER_SECTIONS.map((section) => (
          <button key={section.key} type="button" className={`${styles.navButton} ${activeSection === section.key ? styles.navButtonActive : ''}`} onClick={() => selectSection(section.key)}>
            <span className={styles.navLabel}>{section.label}</span>
            <span className={styles.navDescription}>{section.description}</span>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.hero}>
            <div className={styles.heroTop}>
              <div>
                <div className={styles.heroMeta}>
                  <span className="app-chip">관리자 페이지</span>
                  <span className="app-chip">{currentUser.name}</span>
                  <span className="app-chip">{getUserRoleLabel(currentUser.role)}</span>
                </div>
                <h1 className={styles.heroTitle}>관리자 대시보드</h1>
                <p className={styles.heroDescription}>
                  {activeMeta?.label} 섹션에서 사업장, 현장, 지도요원 배정, 콘텐츠 데이터를 직접 관리할 수 있습니다.
                </p>
              </div>
              <div className={styles.heroActions}>
                <button type="button" className={`app-button app-button-secondary ${styles.mobileMenuButton}`} onClick={() => setMenuOpen(true)}>메뉴</button>
                <button type="button" className="app-button app-button-secondary" onClick={() => void dashboard.reload()} disabled={busy}>새로고침</button>
                <button type="button" className="app-button app-button-secondary" onClick={onLogout}>로그아웃</button>
              </div>
            </div>
          </header>

          <div className={styles.workspace}>
            <aside className={styles.nav}>{navigation}</aside>
            <section className={styles.content}>
              {dashboard.error ? <div className={styles.bannerError}>{dashboard.error}</div> : null}
              {dashboard.notice ? <div className={styles.bannerNotice}>{dashboard.notice}</div> : null}
              {renderSection()}
            </section>
          </div>
        </section>
      </div>

      {menuOpen ? (
        <>
          <button type="button" className={styles.drawerBackdrop} onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기" />
          <aside className={styles.drawer}>{navigation}</aside>
        </>
      ) : null}
    </main>
  );
}
