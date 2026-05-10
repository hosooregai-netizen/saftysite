'use client';

import Image from 'next/image';
import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import { formatDateTime, isImageContentType } from '@/lib/webhard/drivePreview';
import type { DriveItemRecord, DriveShareSummary } from '@/features/drive/types';

export function DriveGrid({
  items,
  onActivateItem,
  onOpenContextMenu,
  onSelectItem,
  readOnly = false,
  selectedIds,
  shareSummaryById,
}: {
  items: DriveItemRecord[];
  onActivateItem: (item: DriveItemRecord) => void;
  onOpenContextMenu: (item: DriveItemRecord, x: number, y: number) => void;
  onSelectItem: (itemId: string, mode?: 'replace' | 'toggle' | 'range') => void;
  readOnly?: boolean;
  selectedIds: Set<string>;
  shareSummaryById: Record<string, DriveShareSummary>;
}) {
  const resolveShareClass = (itemId: string) => {
    const summary = shareSummaryById[itemId];
    if (!summary || summary.tone === 'muted') return styles.shareBadgeMuted;
    if (summary.tone === 'warning') return styles.shareBadgeWarning;
    if (summary.tone === 'stopped') return styles.shareBadgeStopped;
    return styles.sharedBadge;
  };

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <article
          key={item.id}
          tabIndex={0}
          className={`${styles.gridCard} ${selectedIds.has(item.id) ? styles.rowSelected : ''}`}
          onClick={(event) =>
            onSelectItem(
              item.id,
              event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'replace',
            )
          }
          onDoubleClick={() => onActivateItem(item)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onActivateItem(item);
              return;
            }
            if (event.key === ' ') {
              event.preventDefault();
              onSelectItem(item.id);
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
              <DriveIcon name={item.kind === 'folder' ? 'folder' : 'file'} size={28} />
            )}
          </div>
          <div className={styles.gridFooter}>
            <div className={styles.gridMeta}>
              <span className={styles.namePrimary}>{item.name}</span>
              <span className={styles.nameSecondary}>{formatDateTime(item.updatedAt)}</span>
              <span className={resolveShareClass(item.id)}>
                {shareSummaryById[item.id]?.label || '비공개'}
              </span>
            </div>
            {!readOnly ? (
              <button
                type="button"
                className={styles.kebabButton}
                aria-label={`${item.name} 더보기`}
                onClick={(event) => {
                  event.stopPropagation();
                  const rect = event.currentTarget.getBoundingClientRect();
                  onOpenContextMenu(item, rect.left, rect.bottom + 8);
                }}
              >
                <DriveIcon name="more" size={18} />
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
