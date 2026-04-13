'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useWorkerShellSidebarOptional } from '@/components/worker/WorkerShellSidebarContext';
import { getSiteKeyFromPath, resolveWorkerMobileSwitchHref, resolveSiteNavView } from '@/features/home/lib/siteEntry';
import { WorkerMenuTree } from './WorkerMenuTree';
import { buildWorkerTopLevelMenuItems } from './workerMenuConfig';
import styles from './WorkerMenu.module.css';

export interface WorkerMenuItem {
  label: string;
  description?: string;
  href: string;
  active?: boolean;
  children?: WorkerMenuItem[];
}

interface WorkerMenuPanelProps {
  items?: WorkerMenuItem[];
  currentSiteKey?: string | null;
  onNavClick?: () => void;
  forceExpanded?: boolean;
}

interface WorkerMenuButtonProps {
  onClick: () => void;
  label?: string;
}

interface WorkerMenuDrawerProps extends WorkerMenuPanelProps {
  open: boolean;
  onClose: () => void;
}

const WORKER_MENU_TITLE = '작업 메뉴';
const WORKER_MENU_CLOSE_LABEL = '작업 메뉴 닫기';

export function WorkerMenuButton({
  onClick,
  label = '작업 메뉴 열기',
}: WorkerMenuButtonProps) {
  return (
    <button
      type="button"
      className={styles.triggerButton}
      onClick={onClick}
      aria-label={label}
    >
      <span className={styles.triggerButtonBars} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}

export function WorkerMenuPanel({
  items = [],
  currentSiteKey: currentSiteKeyOverride,
  onNavClick,
  forceExpanded = false,
}: WorkerMenuPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shell = useWorkerShellSidebarOptional();
  const collapsed = forceExpanded ? false : Boolean(shell?.collapsed);
  const currentSiteKey = currentSiteKeyOverride ?? getSiteKeyFromPath(pathname);
  const mailboxBox = searchParams.get('box');
  const resolvedMailboxBox = mailboxBox === 'sent' ? 'sent' : 'inbox';
  const siteNavView = resolveSiteNavView({
    pathname,
    siteKey: currentSiteKey,
  });
  const mobileSwitchHref = resolveWorkerMobileSwitchHref({
    pathname,
    searchParams,
  });
  const topLevelItems = buildWorkerTopLevelMenuItems({
    currentSiteKey,
    extraItems: items,
    pathname,
    resolvedMailboxBox,
    siteNavView,
  });

  return (
    <div className={styles.menuPanel} id="worker-menu-nav-panel">
      <section className={`${styles.menuSection} ${collapsed ? styles.menuSectionCollapsed : ''}`} aria-labelledby="worker-menu-heading">
        <h2
          id="worker-menu-heading"
          className={`${styles.menuTitle} ${collapsed ? styles.menuTitleHidden : ''}`}
        >
          {WORKER_MENU_TITLE}
        </h2>
        <WorkerMenuTree collapsed={collapsed} items={topLevelItems} onNavClick={onNavClick} />
      </section>

      {!collapsed ? (
        <div className={styles.menuFooter}>
          <Link href={mobileSwitchHref} className={styles.modeSwitchButton} onClick={onNavClick}>
            <span className={styles.modeSwitchLabel}>작업자 모바일</span>
            <span className={styles.modeSwitchMeta}>모바일 전용 흐름으로 전환</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function WorkerMenuDrawer({
  open,
  onClose,
  items = [],
  currentSiteKey,
}: WorkerMenuDrawerProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className={styles.drawerBackdrop}
        onClick={onClose}
        aria-label={WORKER_MENU_CLOSE_LABEL}
      />
      <aside className={styles.drawer}>
        <WorkerMenuPanel
          items={items}
          currentSiteKey={currentSiteKey}
          onNavClick={onClose}
          forceExpanded
        />
      </aside>
    </>
  );
}
