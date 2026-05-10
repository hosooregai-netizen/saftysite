'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import { saasNavItems } from '@/lib/demoData';

export function DriveAppMenuDrawer({
  onClose,
  open,
  readOnly = false,
  supplemental,
}: {
  onClose: () => void;
  open: boolean;
  readOnly?: boolean;
  supplemental?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (!open) {
    return null;
  }

  return (
    <>
      <div className={`${styles.scrim} ${styles.appMenuScrim}`} role="presentation" onClick={onClose} />
      <aside className={`${styles.drawerPanel} ${styles.drawerLeft} ${styles.appMenuDrawer}`} aria-label="업무 메뉴">
        <div className={styles.appMenuHeader}>
          <div className={styles.appMenuTitle}>
            <strong>업무 메뉴</strong>
            <span className={styles.muted}>
              {readOnly ? '공유 자료를 보면서 다른 업무 화면으로 이동할 수 있습니다.' : 'ERP 업무 화면으로 바로 이동할 수 있습니다.'}
            </span>
          </div>
          <button type="button" className={styles.toolbarIconButton} aria-label="업무 메뉴 닫기" onClick={onClose}>
            <DriveIcon name="close" />
          </button>
        </div>

        <nav className={styles.appMenuNav}>
          {saasNavItems.map((item) => {
            const active =
              item.href === '/webhard'
                ? pathname === '/webhard' || pathname.startsWith('/share/')
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.appMenuLink} ${active ? styles.appMenuLinkActive : ''}`}
                onClick={onClose}
              >
                <span className={styles.appMenuLinkLabel}>{item.label}</span>
                <span className={styles.appMenuLinkDescription}>{item.description}</span>
              </Link>
            );
          })}
        </nav>

        {supplemental ? <div className={styles.appMenuSupplement}>{supplemental}</div> : null}

        <div className={styles.appMenuFooter}>
          <button
            type="button"
            className={styles.appMenuBackButton}
            onClick={() => {
              onClose();
              router.push('/reports');
            }}
          >
            <DriveIcon name="chevron-down" className={styles.appMenuBackIcon} />
            <span>업무 홈으로 돌아가기</span>
          </button>
        </div>
      </aside>
    </>
  );
}
