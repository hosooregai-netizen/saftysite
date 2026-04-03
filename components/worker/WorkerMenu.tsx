'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkerShellSidebarOptional } from '@/components/worker/WorkerShellSidebarContext';
import {
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
}

interface WorkerMenuSection {
  id: string;
  title: string;
  ariaLabel: string;
  items: WorkerMenuItem[];
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
  currentSiteKey: currentSiteKeyOverride,
  onNavClick,
  forceExpanded = false,
}: WorkerMenuPanelProps) {
  const pathname = usePathname();
  const shell = useWorkerShellSidebarOptional();
  const collapsed = forceExpanded ? false : Boolean(shell?.collapsed);
  const currentSiteKey = currentSiteKeyOverride ?? getSiteKeyFromPath(pathname);
  const siteNavView = resolveSiteNavView({
    pathname,
    siteKey: currentSiteKey,
  });

  const workerMenuItems: WorkerMenuItem[] = [
    {
      label: '목록',
      description: '배정된 현장 목록으로 이동',
      href: '/',
      active: isWorkerListPath(pathname),
    },
  ];

  const siteMenuItems: WorkerMenuItem[] = currentSiteKey
    ? [
        {
          label: '현장 메인',
          description: '선택한 현장 개요와 작업 진입 화면',
          href: buildSiteHubHref(currentSiteKey),
          active: siteNavView === 'site-home',
        },
        {
          label: '기술지도 보고서',
          description: '이 현장의 보고서 목록과 작성 화면',
          href: buildSiteReportsHref(currentSiteKey),
          active: siteNavView === 'reports',
        },
        {
          label: '분기 종합 보고서',
          description: '현장 기준 분기 보고서 작성',
          href: buildSiteQuarterlyListHref(currentSiteKey),
          active: siteNavView === 'quarterly',
        },
        {
          label: '현장 사진첩',
          description: '이 현장의 사진 보기와 업로드',
          href: buildSitePhotoAlbumHref(currentSiteKey),
          active: siteNavView === 'photos',
        },
        {
          label: '불량사업장 신고',
          description: '최근 보고서를 바탕으로 신고서 작성',
          href: buildSiteBadWorkplaceHref(currentSiteKey, getCurrentReportMonth()),
          active: siteNavView === 'bad-workplace',
        },
      ]
    : [];

  const menuSections: WorkerMenuSection[] = [
    {
      id: 'worker-menu-nav',
      title: '작업 메뉴',
      ariaLabel: '작업 메뉴 항목',
      items: workerMenuItems,
    },
  ];

  if (siteMenuItems.length > 0 || items.length > 0) {
    menuSections.push({
      id: 'worker-site-nav',
      title: currentSiteKey ? '현장 메뉴' : '추가 메뉴',
      ariaLabel: currentSiteKey ? '현장 메뉴 항목' : '추가 메뉴 항목',
      items: [...siteMenuItems, ...items],
    });
  }

  const handleNav = () => {
    onNavClick?.();
  };

  const itemClass = (activeClass?: string) =>
    [styles.menuItem, activeClass, collapsed ? styles.menuItemCollapsed : '']
      .filter(Boolean)
      .join(' ');

  return (
    <div className={styles.panelScroll} id="worker-menu-nav-panel">
      {menuSections.map((section) => (
        <section
          key={section.id}
          className={`${styles.section} ${collapsed ? styles.sectionCollapsed : ''}`}
          aria-labelledby={`${section.id}-heading`}
        >
          <h2
            id={`${section.id}-heading`}
            className={`${styles.sectionTitle} ${collapsed ? styles.sectionTitleHidden : ''}`}
          >
            {section.title}
          </h2>
          <nav className={styles.menuList} aria-label={section.ariaLabel}>
            {section.items.map((item) => (
              <Link
                key={`${section.id}-${item.label}-${item.href}`}
                href={item.href}
                className={itemClass(item.active ? styles.menuItemActive : undefined)}
                onClick={handleNav}
                title={collapsed ? item.label : undefined}
              >
                {collapsed ? (
                  <>
                    <span className={styles.menuItemGlyph} aria-hidden="true">
                      {item.label.trim().charAt(0) || '메'}
                    </span>
                    <span className={styles.srOnly}>{item.label}</span>
                  </>
                ) : (
                  <span className={styles.menuItemLabel}>{item.label}</span>
                )}
              </Link>
            ))}
          </nav>
        </section>
      ))}
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
        aria-label="작업 메뉴 닫기"
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
