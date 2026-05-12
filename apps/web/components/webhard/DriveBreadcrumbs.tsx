'use client';

import styles from '@/components/webhard/WebhardShared.module.css';
import type { DriveItemViewModel, NavigationMode } from '@/lib/webhard/driveTypes';

function getModeLabel(mode: NavigationMode) {
  if (mode === 'shared') return '공유된 항목';
  if (mode === 'trash') return '휴지통';
  if (mode === 'recent') return '최근 항목';
  return '현재 폴더';
}

export function DriveBreadcrumbs({
  currentPath,
  isLoading,
  navigationMode,
  onOpenFolder,
  visibleCount,
}: {
  currentPath: DriveItemViewModel[];
  isLoading: boolean;
  navigationMode: NavigationMode;
  onOpenFolder: (folderId: string) => void;
  visibleCount: number;
}) {
  return (
    <div className={styles.breadcrumbRow}>
      <div className={styles.badgeRow}>
        <span className={styles.badge}>{getModeLabel(navigationMode)}</span>
        {currentPath.map((item) => (
          <button key={item.id} type="button" className="erp-button erp-button-text" onClick={() => onOpenFolder(item.id)}>
            / {item.name}
          </button>
        ))}
      </div>
      <span className={styles.muted}>{isLoading ? '불러오는 중' : `${visibleCount}개 항목`}</span>
    </div>
  );
}
