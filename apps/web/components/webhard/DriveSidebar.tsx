'use client';

import layoutStyles from '@/components/WebhardScreen.module.css';
import styles from '@/components/webhard/WebhardShared.module.css';
import { DriveFolderTree } from '@/components/webhard/DriveFolderTree';
import type { DriveItemViewModel, NavigationMode } from '@/lib/webhard/driveTypes';

export function DriveSidebar({
  activeFolders,
  currentParentId,
  navigationMode,
  onOpenFolder,
  onOpenRoot,
  onSelectNavigation,
  sharedCount,
  trashCount,
}: {
  activeFolders: DriveItemViewModel[];
  currentParentId: string | null;
  navigationMode: NavigationMode;
  onOpenFolder: (folderId: string) => void;
  onOpenRoot: () => void;
  onSelectNavigation: (mode: NavigationMode) => void;
  sharedCount: number;
  trashCount: number;
}) {
  return (
    <>
      <article className={layoutStyles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>탐색</h2>
            <p className={styles.cardMeta}>자주 쓰는 보기와 폴더 트리로 자료를 찾습니다.</p>
          </div>
        </div>
        <div className={styles.navList}>
          {([
            ['root', '내 자료함'],
            ['recent', '최근 항목'],
            ['shared', '공유됨'],
            ['trash', '휴지통'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={`${styles.navButton} ${navigationMode === mode ? styles.navButtonActive : ''}`}
              onClick={() => onSelectNavigation(mode)}
            >
              <span className={styles.navPrimary}>{label}</span>
              <span className={styles.muted}>{mode === 'shared' ? sharedCount : mode === 'trash' ? trashCount : '-'}</span>
            </button>
          ))}
        </div>
      </article>
      <DriveFolderTree
        currentParentId={currentParentId}
        folders={activeFolders}
        onOpenFolder={onOpenFolder}
        onOpenRoot={onOpenRoot}
      />
    </>
  );
}
