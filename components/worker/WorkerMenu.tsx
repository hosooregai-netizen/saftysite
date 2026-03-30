'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkerShellSidebarOptional } from '@/components/worker/WorkerShellSidebarContext';
import {
  buildSiteHubHref,
  buildWorkerPickerHref,
  getWorkerSiteEntryLabel,
  type WorkerSitePickerIntent,
} from '@/features/home/lib/siteEntry';
import styles from './WorkerMenu.module.css';

function isSiteHubPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/') return true;
  if (pathname.startsWith('/sessions/')) return true;
  return /^\/sites\/[^/]+(?:\/entry)?$/.test(pathname);
}

function isOperationalPickerPath(
  pathname: string | null,
  intent: WorkerSitePickerIntent,
): boolean {
  if (!pathname) return false;
  return pathname === buildWorkerPickerHref(intent) || pathname.includes(`/${intent}/`);
}

function getSiteKeyFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const matched = pathname.match(/^\/sites\/([^/]+)/);
  return matched ? decodeURIComponent(matched[1]) : null;
}

export interface WorkerMenuItem {
  label: string;
  description?: string;
  href: string;
  active?: boolean;
}

interface WorkerMenuPanelProps {
  items?: WorkerMenuItem[];
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

export function WorkerMenuButton({
  onClick,
  label = '작업 메뉴 열기',
}: WorkerMenuButtonProps) {
  return (
    <button
      type="button"
      className={styles.menuButton}
      onClick={onClick}
      aria-label={label}
    >
      <span className={styles.menuButtonBars} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}

export function WorkerMenuPanel({
  items = [],
  onNavClick,
  forceExpanded = false,
}: WorkerMenuPanelProps) {
  const pathname = usePathname();
  const shell = useWorkerShellSidebarOptional();
  const collapsed = forceExpanded ? false : Boolean(shell?.collapsed);
  const currentSiteKey = getSiteKeyFromPath(pathname);

  const builtInItems: WorkerMenuItem[] = [
    {
      label: getWorkerSiteEntryLabel('site'),
      description: '배정된 현장과 보고서 진입',
      href: currentSiteKey ? buildSiteHubHref(currentSiteKey) : '/',
      active: isSiteHubPath(pathname),
    },
    {
      label: getWorkerSiteEntryLabel('quarterly'),
      description: '현장을 선택해 분기 보고서로 이동',
      href: currentSiteKey
        ? buildSiteHubHref(currentSiteKey, 'quarterly')
        : buildWorkerPickerHref('quarterly'),
      active: isOperationalPickerPath(pathname, 'quarterly'),
    },
    {
      label: getWorkerSiteEntryLabel('bad-workplace'),
      description: '현장을 선택해 신고 초안을 작성',
      href: currentSiteKey
        ? buildSiteHubHref(currentSiteKey, 'bad-workplace')
        : buildWorkerPickerHref('bad-workplace'),
      active: isOperationalPickerPath(pathname, 'bad-workplace'),
    },
  ];

  const menuItems = [...builtInItems, ...items];

  const handleNav = () => {
    onNavClick?.();
  };

  const itemClass = (activeClass?: string) =>
    [styles.menuItem, activeClass, collapsed ? styles.menuItemCollapsed : '']
      .filter(Boolean)
      .join(' ');

  return (
    <div className={styles.panelScroll} id="worker-menu-nav-panel">
      <section
        className={`${styles.section} ${collapsed ? styles.sectionCollapsed : ''}`}
        aria-labelledby="worker-menu-nav-heading"
      >
        <h2
          id="worker-menu-nav-heading"
          className={`${styles.sectionTitle} ${collapsed ? styles.sectionTitleHidden : ''}`}
        >
          작업자 메뉴
        </h2>
        <nav className={styles.menuList} aria-label="작업자 메뉴 항목">
          {menuItems.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={itemClass(item.active ? styles.menuItemActive : undefined)}
              onClick={handleNav}
              title={
                collapsed
                  ? `${item.label}${item.description ? ` - ${item.description}` : ''}`
                  : undefined
              }
            >
              {collapsed ? (
                <>
                  <span className={styles.menuItemGlyph} aria-hidden="true">
                    {item.label.trim().charAt(0) || '메'}
                  </span>
                  <span className={styles.srOnly}>
                    {item.label}
                    {item.description ? `, ${item.description}` : ''}
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.menuItemLabel}>{item.label}</span>
                  {item.description ? (
                    <span className={styles.menuItemDescription}>{item.description}</span>
                  ) : null}
                </>
              )}
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}

export function WorkerMenuDrawer({
  open,
  onClose,
  items = [],
}: WorkerMenuDrawerProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className={styles.drawerBackdrop}
        onClick={onClose}
        aria-label="작업자 메뉴 닫기"
      />
      <aside className={styles.drawer}>
        <WorkerMenuPanel items={items} onNavClick={onClose} forceExpanded />
      </aside>
    </>
  );
}
