'use client';

import { useState, type ReactNode } from 'react';
import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import type { DriveItemRecord, DriveScope } from '@/features/drive/types';

function folderDepth(item: DriveItemRecord, folders: DriveItemRecord[]) {
  let depth = 0;
  let currentParentId = item.parentId;
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  while (currentParentId) {
    const parent = byId.get(currentParentId);
    if (!parent) break;
    depth += 1;
    currentParentId = parent.parentId;
  }
  return Math.min(depth, 3);
}

export function DriveSidebar({
  createMenu,
  currentParentId,
  headquarterId,
  onOpenFolder,
  onSelectScope,
  scope,
  sharedCount,
  siteId,
  starredCount,
  trashCount,
  folders,
}: {
  createMenu?: ReactNode;
  currentParentId: string | null;
  headquarterId: string | null;
  onOpenFolder: (folderId: string | null) => void;
  onSelectScope: (scope: DriveScope) => void;
  scope: DriveScope;
  sharedCount: number;
  siteId: string | null;
  starredCount: number;
  trashCount: number;
  folders: DriveItemRecord[];
}) {
  const [foldersOpen, setFoldersOpen] = useState(true);
  const treeFolders = [...folders].sort((left, right) => {
    const leftDepth = folderDepth(left, folders);
    const rightDepth = folderDepth(right, folders);
    if (leftDepth !== rightDepth) return leftDepth - rightDepth;
    return left.name.localeCompare(right.name, 'ko');
  });

  return (
    <div className={styles.sidebar}>
      {createMenu}

      <section className={styles.navSection}>
        {([
          ['root', '내 드라이브', '-'],
          ['shared', '공유 문서함', String(sharedCount)],
          ['recent', '최근', '-'],
          ['starred', '중요', String(starredCount)],
          ['trash', '휴지통', String(trashCount)],
        ] as const).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            className={`${styles.navButton} ${scope === value ? styles.navButtonActive : ''}`}
            onClick={() => onSelectScope(value)}
          >
            <span className={styles.navButtonLabel}>
              <DriveIcon name={value === 'trash' ? 'trash' : value === 'shared' ? 'share' : value === 'starred' ? 'star' : 'folder'} size={18} />
              <span className={styles.navPrimary}>{label}</span>
            </span>
            <span className={styles.navMeta}>{count}</span>
          </button>
        ))}
      </section>

      <section className={styles.navSection}>
        <button type="button" className={styles.folderTreeToggle} onClick={() => setFoldersOpen((value) => !value)}>
          <span className={styles.navSectionLabel}>폴더</span>
          <DriveIcon
            name="chevron-down"
            className={`${styles.folderTreeToggleIcon} ${foldersOpen ? styles.folderTreeToggleOpen : ''}`}
            size={16}
          />
        </button>
        {foldersOpen ? (
          <div className={styles.folderTree}>
            <button
              type="button"
              className={`${styles.folderTreeButton} ${scope === 'root' && !currentParentId ? styles.folderTreeButtonActive : ''} ${styles.folderTreeDepth0}`}
              onClick={() => {
                onSelectScope('root');
                onOpenFolder(null);
              }}
            >
              <span className={styles.folderTreeLabel}>
                <DriveIcon name="folder" size={18} />
                <span className={styles.navPrimary}>내 자료함</span>
              </span>
            </button>
            {treeFolders.map((folder) => {
              const depth = folderDepth(folder, folders);
              return (
                <button
                  key={folder.id}
                  type="button"
                  className={`${styles.folderTreeButton} ${scope === 'root' && currentParentId === folder.id ? styles.folderTreeButtonActive : ''} ${styles[`folderTreeDepth${depth}` as keyof typeof styles] || ''}`}
                  onClick={() => {
                    onSelectScope('root');
                    onOpenFolder(folder.id);
                  }}
                >
                  <span className={styles.folderTreeLabel}>
                    <DriveIcon name="folder" size={18} />
                    <span className={styles.navPrimary}>{folder.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {(headquarterId || siteId) && (
        <section className={styles.assistPanel}>
          <strong className={styles.navSectionLabel}>사업장/현장 필터</strong>
          <div className={styles.assistTags}>
            {headquarterId ? <span className={styles.tag}>사업장 {headquarterId}</span> : null}
            {siteId ? <span className={styles.tag}>현장 {siteId}</span> : null}
          </div>
          <span className={styles.muted}>현재 자료 연결 범위를 우선해서 보여줍니다.</span>
        </section>
      )}
    </div>
  );
}
