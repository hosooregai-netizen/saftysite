'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './WorkerMenu.module.css';

const TECH_GUIDE_HREF = '/';

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

export function WorkerMenuPanel({ items = [], onNavClick }: WorkerMenuPanelProps) {
  const pathname = usePathname();
  const isTechGuideActive = isTechGuidePath(pathname);

  const handleNav = () => {
    onNavClick?.();
  };

  return (
    <div className={styles.panelScroll}>
      <section className={styles.section} aria-labelledby="worker-menu-nav-heading">
        <h2 id="worker-menu-nav-heading" className={styles.sectionTitle}>
          작업자 메뉴
        </h2>
        <nav className={styles.menuList} aria-label="작업자 메뉴 항목">
          <Link
            href={TECH_GUIDE_HREF}
            className={`${styles.menuItem} ${isTechGuideActive ? styles.menuItemActive : ''}`}
            onClick={handleNav}
          >
            <span className={styles.menuItemLabel}>기술 지도</span>
            <span className={styles.menuItemDescription}>배정된 고객사 현장</span>
          </Link>
          {items.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={`${styles.menuItem} ${item.active ? styles.menuItemActive : ''}`}
              onClick={handleNav}
            >
              <span className={styles.menuItemLabel}>{item.label}</span>
              {item.description ? (
                <span className={styles.menuItemDescription}>{item.description}</span>
              ) : null}
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
        <WorkerMenuPanel items={items} onNavClick={onClose} />
      </aside>
    </>
  );
}
