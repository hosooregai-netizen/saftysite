'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useWorkerShellSidebarOptional } from '@/components/worker/WorkerShellSidebarContext';
import {
  buildWorkerCalendarHref,
  buildSiteBadWorkplaceHref,
  buildSiteHubHref,
  buildSitePhotoAlbumHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
  getSiteKeyFromPath,
  resolveSiteNavView,
} from '@/features/home/lib/siteEntry';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import styles from './WorkerMenu.module.css';

function isWorkerListPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/' || pathname === '/quarterly' || pathname === '/bad-workplace';
}

export interface WorkerMenuItem {
  label: string;
  description?: string;
  href: string;
  active?: boolean;
  children?: WorkerMenuItem[];
}

interface WorkerTopLevelMenuItem {
  active: boolean;
  children?: WorkerMenuItem[];
  expandMode?: 'active' | 'always';
  href?: string | null;
  label: string;
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

function joinClassNames(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(' ');
}

function resolveMenuItemActive(item: WorkerMenuItem, pathname: string | null): boolean {
  if (typeof item.active === 'boolean') {
    return item.active;
  }

  if (!pathname) {
    return false;
  }

  try {
    return new URL(item.href, 'https://worker-menu.local').pathname === pathname;
  } catch {
    return item.href === pathname;
  }
}

function normalizeMenuItems(items: WorkerMenuItem[], pathname: string | null): WorkerMenuItem[] {
  return items.map((item) => ({
    ...item,
    active: resolveMenuItemActive(item, pathname),
    children: item.children ? normalizeMenuItems(item.children, pathname) : undefined,
  }));
}

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
  const resolvedMailboxBox =
    mailboxBox === 'sent' || mailboxBox === 'accounts' ? mailboxBox : 'inbox';
  const siteNavView = resolveSiteNavView({
    pathname,
    siteKey: currentSiteKey,
  });

  const mailboxMenuItems: WorkerMenuItem[] = [
    {
      label: '받은편지함',
      href: '/mailbox?box=inbox',
      active: pathname === '/mailbox' && resolvedMailboxBox === 'inbox',
    },
    {
      label: '보낸편지함',
      href: '/mailbox?box=sent',
      active: pathname === '/mailbox' && resolvedMailboxBox === 'sent',
    },
    {
      label: '연결 계정',
      href: '/mailbox?box=accounts',
      active: pathname === '/mailbox' && resolvedMailboxBox === 'accounts',
    },
  ];

  const siteMenuItems: WorkerMenuItem[] = currentSiteKey
    ? [
        {
          label: '현장 메인',
          href: buildSiteHubHref(currentSiteKey),
          active: siteNavView === 'site-home',
        },
        {
          label: '기술지도 보고서',
          href: buildSiteReportsHref(currentSiteKey),
          active: siteNavView === 'reports',
        },
        {
          label: '분기 종합 보고서',
          href: buildSiteQuarterlyListHref(currentSiteKey),
          active: siteNavView === 'quarterly',
        },
        {
          label: '현장 사진첩',
          href: buildSitePhotoAlbumHref(currentSiteKey),
          active: siteNavView === 'photos',
        },
        {
          label: '불량사업장 신고',
          href: buildSiteBadWorkplaceHref(currentSiteKey, getCurrentReportMonth()),
          active: siteNavView === 'bad-workplace',
        },
      ]
    : [];

  const extraMenuItems = normalizeMenuItems(items, pathname);
  const extraMenuActive = extraMenuItems.some(
    (item) => item.active || item.children?.some((child) => child.active),
  );

  const topLevelItems: WorkerTopLevelMenuItem[] = [
    {
      label: '목록',
      href: '/',
      active: isWorkerListPath(pathname),
    },
    {
      label: '내 일정',
      href: buildWorkerCalendarHref(),
      active: pathname === '/calendar',
    },
    {
      label: '메일함',
      href: '/mailbox?box=inbox',
      active: pathname === '/mailbox',
      children: mailboxMenuItems,
      expandMode: 'active',
    },
  ];

  if (currentSiteKey) {
    topLevelItems.push({
      label: '현장 메뉴',
      href: buildSiteHubHref(currentSiteKey),
      active: siteNavView === 'site-home' || siteMenuItems.some((item) => item.active),
      children: siteMenuItems,
      expandMode: 'always',
    });
  }

  if (extraMenuItems.length > 0) {
    topLevelItems.push({
      label: '추가 메뉴',
      active: extraMenuActive,
      children: extraMenuItems,
      expandMode: 'always',
    });
  }

  const handleNav = () => {
    onNavClick?.();
  };

  return (
    <div className={styles.menuPanel} id="worker-menu-nav-panel">
      <section
        className={joinClassNames(styles.menuSection, collapsed && styles.menuSectionCollapsed)}
        aria-labelledby="worker-menu-heading"
      >
        <h2
          id="worker-menu-heading"
          className={joinClassNames(styles.menuTitle, collapsed && styles.menuTitleHidden)}
        >
          {WORKER_MENU_TITLE}
        </h2>

        <div className={styles.menuList}>
          {topLevelItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const showChildren = !collapsed && hasChildren && item.expandMode === 'always'
              ? true
              : !collapsed && hasChildren && item.active;
            const menuButtonClassName = joinClassNames(
              styles.menuButton,
              hasChildren && styles.menuButtonGrouped,
              item.active && styles.menuButtonActive,
              collapsed && styles.menuButtonCollapsed,
              !item.href && styles.menuButtonStatic,
            );

            const menuButtonContent = collapsed ? (
              <>
                <span className={styles.menuGlyph} aria-hidden="true">
                  {item.label.trim().charAt(0) || '메'}
                </span>
                <span className={styles.srOnly}>{item.label}</span>
              </>
            ) : (
              <span className={styles.menuLabel}>{item.label}</span>
            );

            return (
              <div
                key={`${item.label}-${item.href ?? 'group'}`}
                className={joinClassNames(
                  styles.menuTreeItem,
                  showChildren && styles.menuTreeItemExpanded,
                )}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className={menuButtonClassName}
                    onClick={handleNav}
                    title={collapsed ? item.label : undefined}
                  >
                    {menuButtonContent}
                  </Link>
                ) : (
                  <div className={menuButtonClassName} title={collapsed ? item.label : undefined}>
                    {menuButtonContent}
                  </div>
                )}

                {showChildren ? (
                  <div
                    className={styles.menuTreeChildren}
                    role="group"
                    aria-label={`${item.label} 하위 메뉴`}
                  >
                    {item.children?.map((child) => (
                      <Link
                        key={`${item.label}-${child.href}`}
                        href={child.href}
                        className={joinClassNames(
                          styles.subMenuButton,
                          child.active && styles.subMenuButtonActive,
                        )}
                        onClick={handleNav}
                      >
                        <span className={styles.subMenuLabel}>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
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
