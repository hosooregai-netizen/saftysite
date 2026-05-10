'use client';

import type { ReactNode } from 'react';
import styles from '@/features/drive/DriveWorkspace.module.css';

export function DriveEmptyState({
  actions,
  body,
  title,
}: {
  actions?: ReactNode;
  body: string;
  title: string;
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <span className={styles.emptyBody}>{body}</span>
      {actions ? <div className={styles.emptyActions}>{actions}</div> : null}
    </div>
  );
}
