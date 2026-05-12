'use client';

import styles from '@/components/webhard/WebhardShared.module.css';
import { formatDateTime, formatSize } from '@/lib/webhard/drivePreview';
import type { DriveItemViewModel, DriveShareViewModel } from '@/lib/webhard/driveTypes';

export function DriveItemList({
  items,
  onOpenFolder,
  onSelectItem,
  selectedItemId,
  shares,
}: {
  items: DriveItemViewModel[];
  onOpenFolder: (folderId: string) => void;
  onSelectItem: (itemId: string) => void;
  selectedItemId: string;
  shares: DriveShareViewModel[];
}) {
  const sharedIds = new Set(shares.filter((share) => !share.isRevoked).map((share) => share.itemId));

  return (
    <div className={styles.itemList}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.itemButton} ${selectedItemId === item.id ? styles.itemButtonActive : ''}`}
          onClick={() => {
            if (item.kind === 'folder' && selectedItemId === item.id) {
              onOpenFolder(item.id);
              return;
            }
            onSelectItem(item.id);
          }}
        >
          <div className={styles.itemHeader}>
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.muted}>{formatDateTime(item.updatedAt)}</span>
          </div>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>{item.kind === 'folder' ? '폴더' : item.fileType || '파일'}</span>
            {item.sizeBytes > 0 ? <span className={styles.badge}>{formatSize(item.sizeBytes)}</span> : null}
            {sharedIds.has(item.id) ? <span className={styles.badge}>공유 중</span> : null}
          </div>
          <span className={styles.muted}>
            {item.kind === 'folder'
              ? '하위 자료 정리'
              : item.fileType === 'link'
                ? item.externalUrl
                : item.fileType === 'note'
                  ? item.textContent.slice(0, 80) || '메모'
                  : item.contentType}
          </span>
        </button>
      ))}
    </div>
  );
}
