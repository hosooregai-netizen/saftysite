'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkerShellSidebarOptional } from '@/components/worker/WorkerShellSidebarContext';
import styles from './WorkerMenu.module.css';

const TECH_GUIDE_HREF = '/';

function TechGuideIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 19.5V7a2 2 0 012-2h6l6 6v8.5a1 1 0 01-1 1H5a1 1 0 01-1-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 5v4h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 기술 지도: 현장 목록 → 보고서 목록 → 작성 화면까지 동일 섹션으로 취급 */
function isTechGuidePath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/') return true;
  return pathname.startsWith('/sites/') || pathname.startsWith('/sessions/');
}

export interface WorkerMenuItem {
  label: string;
  description?: string;
  href: string;
  active?: boolean;
}

interface WorkerMenuPanelProps {
  items?: WorkerMenuItem[];
  /** 드로어 등에서 링크 선택 후 호출 */
  onNavClick?: () => void;
  /** 모바일 드로어 등: 축소(아이콘만) 레이아웃을 쓰지 않음 */
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
  label = '작업자 메뉴 열기',
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
  const isTechGuideActive = isTechGuidePath(pathname);

  const handleNav = () => {
    onNavClick?.();
  };

  const itemClass = (activeClass?: string) =>
    [styles.menuItem, activeClass, collapsed ? styles.menuItemCollapsed : ''].filter(Boolean).join(' ');

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
          <Link
            href={TECH_GUIDE_HREF}
            className={itemClass(isTechGuideActive ? styles.menuItemActive : undefined)}
            onClick={handleNav}
            title={collapsed ? '기술 지도 — 배정된 고객사 현장' : undefined}
          >
            {collapsed ? (
              <>
                <TechGuideIcon className={styles.menuItemIcon} />
                <span className={styles.srOnly}>기술 지도, 배정된 고객사 현장</span>
              </>
            ) : (
              <>
                <span className={styles.menuItemLabel}>기술 지도</span>
                <span className={styles.menuItemDescription}>배정된 고객사 현장</span>
              </>
            )}
          </Link>
          {items.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={itemClass(item.active ? styles.menuItemActive : undefined)}
              onClick={handleNav}
              title={collapsed ? `${item.label}${item.description ? ` — ${item.description}` : ''}` : undefined}
            >
              {collapsed ? (
                <>
                  <span className={styles.menuItemGlyph} aria-hidden="true">
                    {item.label.trim().charAt(0) || '·'}
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
