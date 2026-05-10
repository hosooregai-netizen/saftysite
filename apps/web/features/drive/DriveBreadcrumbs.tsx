'use client';

import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import type { DrivePathNode, DriveScope } from '@/features/drive/types';

function scopeLabel(scope: DriveScope) {
  if (scope === 'recent') return '최근';
  if (scope === 'shared') return '공유 문서함';
  if (scope === 'starred') return '중요';
  if (scope === 'trash') return '휴지통';
  return '내 드라이브';
}

export function DriveBreadcrumbs({
  currentPath,
  onOpenFolder,
  scope,
}: {
  currentPath: DrivePathNode[];
  onOpenFolder: (folderId: string | null) => void;
  scope: DriveScope;
}) {
  if (scope !== 'root') {
    return (
      <div className={styles.breadcrumbRow}>
        <span className={`${styles.breadcrumbButton} ${styles.breadcrumbCurrent}`}>{scopeLabel(scope)}</span>
      </div>
    );
  }

  return (
    <div className={styles.breadcrumbRow}>
      {currentPath.map((node, index) => {
        const isCurrent = index === currentPath.length - 1;
        return (
          <button
            key={node.id}
            type="button"
            className={`${styles.breadcrumbButton} ${isCurrent ? styles.breadcrumbCurrent : ''}`}
            onClick={() => onOpenFolder(index === 0 ? null : node.id)}
          >
            <span>{node.name}</span>
            {!isCurrent ? <DriveIcon name="chevron-down" size={14} style={{ transform: 'rotate(-90deg)' }} /> : null}
          </button>
        );
      })}
    </div>
  );
}
