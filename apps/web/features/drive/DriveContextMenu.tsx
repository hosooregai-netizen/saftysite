'use client';

import type { ReactNode } from 'react';
import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import type { DriveItemRecord } from '@/features/drive/types';

export function DriveContextMenu({
  canOpenShare = true,
  canRename = true,
  isTrashScope = false,
  item,
  onClose,
  onCopyLink,
  onDownload,
  onDeletePermanently,
  onMove,
  onOpen,
  onOpenShare,
  onRename,
  onRestore,
  onToggleStar,
  onTrash,
  position,
  readOnly = false,
}: {
  canOpenShare?: boolean;
  canRename?: boolean;
  isTrashScope?: boolean;
  item: DriveItemRecord | null;
  onClose: () => void;
  onCopyLink: (item: DriveItemRecord) => void;
  onDownload: (item: DriveItemRecord) => void;
  onDeletePermanently: (item: DriveItemRecord) => void;
  onMove: (item: DriveItemRecord) => void;
  onOpen: (item: DriveItemRecord) => void;
  onOpenShare: (item: DriveItemRecord) => void;
  onRename: (item: DriveItemRecord) => void;
  onRestore: (item: DriveItemRecord) => void;
  onToggleStar: (item: DriveItemRecord) => void;
  onTrash: (item: DriveItemRecord) => void;
  position: { x: number; y: number } | null;
  readOnly?: boolean;
}) {
  if (!item || !position) return null;

  const actions: Array<{ icon: ReactNode; label: string; onClick: () => void }> = [
    {
      icon: <DriveIcon name={item.kind === 'folder' ? 'folder' : 'file'} size={18} />,
      label: item.kind === 'folder' ? '열기' : '미리보기',
      onClick: () => onOpen(item),
    },
  ];

  if (item.kind !== 'folder') {
    actions.push({
      icon: <DriveIcon name={item.fileType === 'link' ? 'share' : 'download'} size={18} />,
      label: item.fileType === 'link' ? '링크 열기' : '다운로드',
      onClick: () => onDownload(item),
    });
  }

  if (!readOnly && canOpenShare) {
    actions.push({ icon: <DriveIcon name="share" size={18} />, label: '공유 설정', onClick: () => onOpenShare(item) });
    actions.push({ icon: <DriveIcon name="share" size={18} />, label: '링크 복사', onClick: () => onCopyLink(item) });
  }

  if (!readOnly) {
    if (canRename) {
      actions.push({ icon: <DriveIcon name="edit" size={18} />, label: '이름 변경', onClick: () => onRename(item) });
      actions.push({ icon: <DriveIcon name="move" size={18} />, label: '이동', onClick: () => onMove(item) });
    }
    actions.push({ icon: <DriveIcon name="star" size={18} />, label: item.isStarred ? '중요 해제' : '중요 표시', onClick: () => onToggleStar(item) });
    if (item.isDeleted || isTrashScope) {
      actions.push({ icon: <DriveIcon name="move" size={18} />, label: '복원', onClick: () => onRestore(item) });
      actions.push({ icon: <DriveIcon name="trash" size={18} />, label: '영구 삭제', onClick: () => onDeletePermanently(item) });
    } else {
      actions.push({ icon: <DriveIcon name="trash" size={18} />, label: '휴지통으로 이동', onClick: () => onTrash(item) });
    }
  }

  return (
    <>
      <div className={styles.scrim} onClick={onClose} role="presentation" />
      <div className={styles.contextMenu} style={{ left: position.x, top: position.y }}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={styles.contextMenuButton}
            onClick={() => {
              action.onClick();
              onClose();
            }}
          >
            <span className={styles.navButtonLabel}>
              {action.icon}
              <span>{action.label}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
