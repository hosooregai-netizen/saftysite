'use client';

import layoutStyles from '@/components/WebhardScreen.module.css';
import styles from '@/components/webhard/WebhardShared.module.css';
import { formatDateTime } from '@/lib/webhard/drivePreview';
import type { DriveItemViewModel } from '@/lib/webhard/driveTypes';

export function DriveFolderTree({
  currentParentId,
  folders,
  onOpenFolder,
  onOpenRoot,
}: {
  currentParentId: string | null;
  folders: DriveItemViewModel[];
  onOpenFolder: (folderId: string) => void;
  onOpenRoot: () => void;
}) {
  return (
    <article className={layoutStyles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>폴더 트리</h2>
          <p className={styles.cardMeta}>현재 자료함의 폴더 구조를 빠르게 이동합니다.</p>
        </div>
      </div>
      <div className={styles.treeList}>
        <button
          type="button"
          className={`${styles.treeButton} ${currentParentId === null ? styles.treeButtonActive : ''}`}
          onClick={onOpenRoot}
        >
          <span className={styles.navPrimary}>루트</span>
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            className={`${styles.treeButton} ${currentParentId === folder.id ? styles.treeButtonActive : ''}`}
            onClick={() => onOpenFolder(folder.id)}
          >
            <span className={styles.navPrimary}>{folder.name}</span>
            <span className={styles.muted}>{formatDateTime(folder.updatedAt)}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
