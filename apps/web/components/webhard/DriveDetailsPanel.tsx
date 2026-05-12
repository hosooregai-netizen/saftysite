'use client';

import Link from 'next/link';
import layoutStyles from '@/components/WebhardScreen.module.css';
import styles from '@/components/webhard/WebhardShared.module.css';
import { DrivePreview } from '@/components/webhard/DrivePreview';
import { DriveSharePanel } from '@/components/webhard/DriveSharePanel';
import { formatDateTime, formatSize, triggerDriveDownload } from '@/lib/webhard/drivePreview';
import type { DriveItemViewModel, DriveShareViewModel } from '@/lib/webhard/driveTypes';

export function DriveDetailsPanel({
  activeFolders,
  canManageShares,
  childCount,
  item,
  moveParentId,
  nameInput,
  onDelete,
  onOpenFolder,
  onPurge,
  onRestore,
  onRevokeShare,
  onSave,
  onShare,
  selectedItemShares,
  setMoveParentId,
  setNameInput,
}: {
  activeFolders: DriveItemViewModel[];
  canManageShares: boolean;
  childCount: number;
  item: DriveItemViewModel | null;
  moveParentId: string;
  nameInput: string;
  onDelete: (item: DriveItemViewModel) => void;
  onOpenFolder: (folderId: string) => void;
  onPurge: (item: DriveItemViewModel) => void;
  onRestore: (itemId: string) => void;
  onRevokeShare: (shareId: string) => void;
  onSave: (item: DriveItemViewModel) => void;
  onShare: () => void;
  selectedItemShares: DriveShareViewModel[];
  setMoveParentId: (value: string) => void;
  setNameInput: (value: string) => void;
}) {
  if (!item) {
    return (
      <article className={layoutStyles.card}>
        <div className={styles.emptyState}>
          <strong>항목을 선택하면 상세 작업을 이어서 할 수 있습니다.</strong>
          <span className={styles.muted}>이름 변경, 이동, 미리보기, 공유, 휴지통 복원은 오른쪽 패널에서 처리합니다.</span>
        </div>
      </article>
    );
  }

  return (
    <article className={layoutStyles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>{item.name}</h2>
          <p className={styles.cardMeta}>선택한 항목의 미리보기와 빠른 작업을 제공합니다.</p>
        </div>
      </div>
      <div className={styles.badgeRow}>
        <span className={styles.badge}>{item.kind === 'folder' ? '폴더' : item.fileType || '파일'}</span>
        {item.sizeBytes > 0 ? <span className={styles.badge}>{formatSize(item.sizeBytes)}</span> : null}
        {item.isDeleted ? <span className={styles.badge}>휴지통</span> : null}
      </div>
      <div className={styles.detailMeta}>
        <span className={styles.muted}>최종 수정 {formatDateTime(item.updatedAt)}</span>
        {item.siteId ? <span className={styles.muted}>현장 {item.siteId}</span> : null}
      </div>
      <DrivePreview childCount={childCount} item={item} />
      <label className={styles.fieldStack}>
        <span className={styles.fieldLabel}>이름 변경</span>
        <input className="erp-input" value={nameInput || item.name} onChange={(event) => setNameInput(event.target.value)} />
      </label>
      <label className={styles.fieldStack}>
        <span className={styles.fieldLabel}>이동 위치</span>
        <select className="erp-select" value={moveParentId} onChange={(event) => setMoveParentId(event.target.value)}>
          <option value="">루트</option>
          {activeFolders.filter((folder) => folder.id !== item.id).map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.detailActions}>
        {item.kind === 'folder' ? (
          <button type="button" className="erp-button erp-button-secondary" onClick={() => onOpenFolder(item.id)}>
            이 폴더 열기
          </button>
        ) : item.fileType === 'link' ? (
          <Link href={item.externalUrl} className="erp-button erp-button-secondary" target="_blank">
            링크 열기
          </Link>
        ) : item.fileType === 'binary' && item.dataUrl ? (
          <button type="button" className="erp-button erp-button-secondary" onClick={() => triggerDriveDownload(item)}>
            다운로드
          </button>
        ) : null}
        <button type="button" className="erp-button erp-button-secondary" onClick={() => onSave(item)}>
          저장
        </button>
      </div>
      <div className={styles.detailActions}>
        {!item.isDeleted ? (
          <>
            <button type="button" className="erp-button erp-button-secondary" onClick={onShare} disabled={!canManageShares}>
              공유 설정
            </button>
            <button type="button" className="erp-button erp-button-text" onClick={() => onDelete(item)}>
              휴지통으로 이동
            </button>
          </>
        ) : (
          <>
            <button type="button" className="erp-button erp-button-secondary" onClick={() => onRestore(item.id)}>
              복원
            </button>
            <button type="button" className="erp-button erp-button-text" onClick={() => onPurge(item)}>
              영구 삭제
            </button>
          </>
        )}
      </div>
      <DriveSharePanel onRevokeShare={onRevokeShare} shares={selectedItemShares} />
    </article>
  );
}
