'use client';

import Link from 'next/link';
import styles from './AdminMenu.module.css';
import {
  ADMIN_SECTIONS,
  getAdminSectionHref,
  type AdminSectionKey,
} from '@/lib/admin/adminSections';

interface AdminMenuPanelProps {
  activeSection: AdminSectionKey;
  forceExpanded?: boolean;
  onNavClick?: () => void;
  onSelectSection?: (section: AdminSectionKey) => void;
  panelId?: string;
}

interface AdminMenuDrawerProps extends AdminMenuPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AdminMenuPanel({
  activeSection,
  forceExpanded = false,
  onNavClick,
  onSelectSection,
  panelId = 'worker-menu-nav-panel',
}: AdminMenuPanelProps) {
  const handleSelect = (section: AdminSectionKey) => {
    if (onSelectSection) {
      onSelectSection(section);
      return;
    }

    onNavClick?.();
  };

  return (
    <div className={styles.menuPanel} id={panelId}>
      <section className={styles.menuSection} aria-labelledby="controller-menu-heading">
        <h2 id="controller-menu-heading" className={styles.menuTitle}>
          관리자 메뉴
        </h2>
        <div className={styles.menuList}>
          {ADMIN_SECTIONS.map((section) =>
            onSelectSection ? (
              <button
                key={section.key}
                type="button"
                className={`${styles.menuButton} ${
                  activeSection === section.key ? styles.menuButtonActive : ''
                }`}
                onClick={() => handleSelect(section.key)}
              >
                <span className={styles.menuLabel}>{section.label}</span>
                <span className={styles.menuDescription}>{section.description}</span>
              </button>
            ) : (
              <Link
                key={section.key}
                href={getAdminSectionHref(section.key)}
                className={`${styles.menuButton} ${
                  activeSection === section.key ? styles.menuButtonActive : ''
                }`}
                onClick={() => handleSelect(section.key)}
                title={
                  forceExpanded
                    ? undefined
                    : `${section.label}${section.description ? ` - ${section.description}` : ''}`
                }
              >
                <span className={styles.menuLabel}>{section.label}</span>
                <span className={styles.menuDescription}>{section.description}</span>
              </Link>
            ),
          )}
        </div>
      </section>
    </div>
  );
}

export function AdminMenuDrawer({
  open,
  onClose,
  activeSection,
  onSelectSection,
}: AdminMenuDrawerProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className={styles.drawerBackdrop}
        onClick={onClose}
        aria-label="관리자 메뉴 닫기"
      />
      <aside className={styles.drawer}>
        <AdminMenuPanel
          activeSection={activeSection}
          forceExpanded
          onNavClick={onClose}
          onSelectSection={onSelectSection}
        />
      </aside>
    </>
  );
}

