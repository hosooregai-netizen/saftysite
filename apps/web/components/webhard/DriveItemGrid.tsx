'use client';

import Image from 'next/image';
import styles from '@/components/webhard/WebhardShared.module.css';
import { formatDateTime, formatSize, isImageContentType } from '@/lib/webhard/drivePreview';
import type { DriveItemViewModel } from '@/lib/webhard/driveTypes';

export function DriveItemGrid({
  items,
  onOpenFolder,
  onSelectItem,
}: {
  items: DriveItemViewModel[];
  onOpenFolder: (folderId: string) => void;
  onSelectItem: (itemId: string) => void;
}) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <article
          key={item.id}
          className={styles.gridItem}
          onClick={() => onSelectItem(item.id)}
          onDoubleClick={() => {
            if (item.kind === 'folder') {
              onOpenFolder(item.id);
            }
          }}
        >
          <div className={styles.thumb}>
            {item.fileType === 'binary' && isImageContentType(item.contentType) && item.dataUrl ? (
              <Image
                src={item.thumbnailDataUrl || item.dataUrl}
                alt={item.name}
                width={640}
                height={440}
                unoptimized
              />
            ) : (
              <strong>{item.kind === 'folder' ? '폴더' : item.fileType === 'link' ? '링크' : item.fileType === 'note' ? '메모' : '파일'}</strong>
            )}
          </div>
          <div className={styles.itemHeader}>
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.muted}>{formatDateTime(item.updatedAt)}</span>
          </div>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>{item.kind === 'folder' ? '폴더' : item.fileType || '파일'}</span>
            {item.sizeBytes > 0 ? <span className={styles.badge}>{formatSize(item.sizeBytes)}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
