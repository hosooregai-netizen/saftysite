'use client';

import type { ReactNode } from 'react';
import styles from '@/features/drive/DriveWorkspace.module.css';

export function DriveShell({
  detail,
  detailOpen,
  main,
  navDrawer,
  sidebar,
  snackbar,
  topbar,
}: {
  detail?: ReactNode;
  detailOpen?: boolean;
  main: ReactNode;
  navDrawer?: ReactNode;
  sidebar?: ReactNode;
  snackbar?: ReactNode;
  topbar: ReactNode;
}) {
  return (
    <div className={styles.host}>
      {topbar}
      <div className={styles.layout}>
        {sidebar ? <aside className={styles.sidebarPane}>{sidebar}</aside> : null}
        <main className={styles.mainPane}>{main}</main>
        {detailOpen ? <aside className={styles.detailPane}>{detail}</aside> : null}
      </div>
      {navDrawer}
      {snackbar}
    </div>
  );
}
