'use client';

import Link from 'next/link';
import styles from './WorkerMenu.module.css';

export interface WorkerMenuItem {
  label: string;
  description?: string;
  href: string;
  active?: boolean;
}

interface WorkerMenuPanelProps {
  currentUserName?: string | null;
  siteCount: number;
  items?: WorkerMenuItem[];
  onLogout: () => void;
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
      <span className={styles.menuButtonDots} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}

export function WorkerMenuPanel({
  currentUserName,
  siteCount,
  items = [],
  onLogout,
}: WorkerMenuPanelProps) {
  return (
    <div className={styles.panel}>
      <div>
        <p className={styles.title}>작업자 메뉴</p>
      </div>

      {items.length > 0 ? (
        <nav className={styles.navList} aria-label="작업자 메뉴">
          {items.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={`${styles.navLink} ${item.active ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navLabel}>{item.label}</span>
              {item.description ? (
                <span className={styles.navDescription}>{item.description}</span>
              ) : null}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className={styles.metaCard}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>로그인 계정</span>
          <strong className={styles.metaValue}>{currentUserName || '작업자'}</strong>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>배정된 현장 수</span>
          <strong className={styles.metaValue}>{siteCount}개</strong>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className="app-button app-button-secondary">
          계정 설정
        </button>
        <button type="button" className="app-button app-button-secondary" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
}

export function WorkerMenuDrawer({
  open,
  onClose,
  currentUserName,
  siteCount,
  items = [],
  onLogout,
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
        <WorkerMenuPanel
          currentUserName={currentUserName}
          siteCount={siteCount}
          items={items}
          onLogout={() => {
            onClose();
            onLogout();
          }}
        />
      </aside>
    </>
  );
}
