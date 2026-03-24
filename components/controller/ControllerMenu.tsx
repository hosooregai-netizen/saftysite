'use client';

import Link from 'next/link';
import styles from './ControllerDashboard.module.css';
import {
  CONTROLLER_SECTIONS,
  getControllerSectionHref,
  type ControllerSectionKey,
} from './shared';

interface ControllerMenuPanelProps {
  activeSection: ControllerSectionKey;
  forceExpanded?: boolean;
  onNavClick?: () => void;
  onSelectSection?: (section: ControllerSectionKey) => void;
  panelId?: string;
}

interface ControllerMenuDrawerProps extends ControllerMenuPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ControllerMenuPanel({
  activeSection,
  forceExpanded = false,
  onNavClick,
  onSelectSection,
  panelId = 'worker-menu-nav-panel',
}: ControllerMenuPanelProps) {
  const handleSelect = (section: ControllerSectionKey) => {
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
          {CONTROLLER_SECTIONS.map((section) =>
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
                href={getControllerSectionHref(section.key)}
                className={`${styles.menuButton} ${
                  activeSection === section.key ? styles.menuButtonActive : ''
                }`}
                onClick={() => handleSelect(section.key)}
                title={
                  forceExpanded ? undefined : `${section.label}${section.description ? ` - ${section.description}` : ''}`
                }
              >
                <span className={styles.menuLabel}>{section.label}</span>
                <span className={styles.menuDescription}>{section.description}</span>
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  );
}

export function ControllerMenuDrawer({
  open,
  onClose,
  activeSection,
  onSelectSection,
}: ControllerMenuDrawerProps) {
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
        <ControllerMenuPanel
          activeSection={activeSection}
          forceExpanded
          onNavClick={onClose}
          onSelectSection={onSelectSection}
        />
      </aside>
    </>
  );
}
