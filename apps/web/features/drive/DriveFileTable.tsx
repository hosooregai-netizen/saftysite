'use client';

import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import { formatDateTime, formatSize } from '@/lib/webhard/drivePreview';
import type { DriveItemRecord, DriveShareSummary } from '@/features/drive/types';

function creatorLabel(item: DriveItemRecord, userNameById: Record<string, string>, readOnly: boolean) {
  if (readOnly) return '공유 링크';
  const userId = item.ownerUserId || item.createdBy || '';
  if (!userId) return '임시 작성';
  return userNameById[userId] || userId;
}

export function DriveFileTable({
  items,
  onActivateItem,
  onOpenContextMenu,
  onSelectItem,
  readOnly = false,
  selectedIds,
  shareSummaryById,
  userNameById,
}: {
  items: DriveItemRecord[];
  onActivateItem: (item: DriveItemRecord) => void;
  onOpenContextMenu: (item: DriveItemRecord, x: number, y: number) => void;
  onSelectItem: (itemId: string, mode?: 'replace' | 'toggle' | 'range') => void;
  readOnly?: boolean;
  selectedIds: Set<string>;
  shareSummaryById: Record<string, DriveShareSummary>;
  userNameById: Record<string, string>;
}) {
  const renderShareSummary = (summary: DriveShareSummary | undefined) => {
    if (!summary) return <span className={styles.shareBadgeMuted}>비공개</span>;
    const toneClass =
      summary.tone === 'shared'
        ? styles.sharedBadge
        : summary.tone === 'warning'
          ? styles.shareBadgeWarning
          : summary.tone === 'stopped'
            ? styles.shareBadgeStopped
            : styles.shareBadgeMuted;
    return (
      <span className={styles.shareBadgeStack}>
        <span className={toneClass}>{summary.label}</span>
        {summary.detail ? <span className={styles.shareBadgeDetail}>{summary.detail}</span> : null}
      </span>
    );
  };

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>이름</th>
            <th>소유자</th>
            <th>최종 수정</th>
            <th>크기</th>
            <th>공유 상태</th>
            <th aria-label="더보기" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const selected = selectedIds.has(item.id);
            const isFolder = item.kind === 'folder';
            const summary = shareSummaryById[item.id];
            return (
              <tr
                key={item.id}
                tabIndex={0}
                className={`${styles.tableRow} ${selected ? styles.rowSelected : ''}`}
                onClick={(event) =>
                  onSelectItem(
                    item.id,
                    event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'replace',
                  )
                }
                onDoubleClick={() => onActivateItem(item)}
                onContextMenu={(event) => {
                  if (readOnly || window.innerWidth < 1180) return;
                  event.preventDefault();
                  onOpenContextMenu(item, event.clientX, event.clientY);
                }}
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
                <td>
                  <div className={styles.itemLeading}>
                    <DriveIcon name={isFolder ? 'folder' : 'file'} size={22} />
                    <div className={styles.nameCell}>
                      <span className={styles.namePrimary}>{item.name}</span>
                      <span className={styles.nameSecondary}>
                        {isFolder
                          ? '폴더'
                          : item.fileType === 'link'
                            ? item.externalUrl || '링크'
                            : item.fileType === 'note'
                              ? item.textContent.slice(0, 40) || '메모'
                              : item.contentType}
                      </span>
                    </div>
                  </div>
                </td>
                <td>{creatorLabel(item, userNameById, readOnly)}</td>
                <td>{formatDateTime(item.updatedAt)}</td>
                <td>{isFolder ? '-' : formatSize(item.sizeBytes)}</td>
                <td>{renderShareSummary(summary)}</td>
                <td>
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
