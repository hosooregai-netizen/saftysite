'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import {
  formatDateTime,
  formatSize,
  isImageContentType,
  isPdfContentType,
  isTextLikeItem,
} from '@/lib/webhard/drivePreview';
import type { DriveItemRecord } from '@/features/drive/types';

function PreviewCanvas({ item }: { item: DriveItemRecord | null }) {
  if (!item) {
    return (
      <div className={styles.preview}>
        <div className={styles.detailEmpty}>
          <DriveIcon name="info" size={28} />
          <strong>항목을 선택하세요</strong>
          <span className={styles.muted}>미리보기와 메타데이터를 여기서 확인할 수 있습니다.</span>
        </div>
      </div>
    );
  }
  if (item.kind === 'folder') {
    return (
      <div className={styles.preview}>
        <div className={styles.detailEmpty}>
          <DriveIcon name="folder" size={28} />
          <strong>폴더 미리보기</strong>
          <span className={styles.muted}>하위 파일과 폴더는 중앙 목록에서 탐색합니다.</span>
        </div>
      </div>
    );
  }
  if (item.fileType === 'link') {
    return (
      <div className={styles.preview}>
        <div className={styles.detailEmpty}>
          <DriveIcon name="share" size={28} />
          <strong>외부 링크</strong>
          <span className={styles.muted}>{item.externalUrl || '연결된 링크가 없습니다.'}</span>
        </div>
      </div>
    );
  }
  if (item.fileType === 'binary' && isImageContentType(item.contentType) && item.dataUrl) {
    return (
      <div className={styles.preview}>
        <Image src={item.thumbnailDataUrl || item.dataUrl} alt={item.name} width={900} height={640} unoptimized />
      </div>
    );
  }
  if (item.fileType === 'binary' && isPdfContentType(item.contentType) && item.dataUrl) {
    return (
      <div className={styles.preview}>
        <iframe title={item.name} src={item.dataUrl} />
      </div>
    );
  }
  if (item && isTextLikeItem({ contentType: item.contentType, fileType: item.fileType })) {
    return (
      <div className={styles.preview}>
        <pre>{item.textContent || '내용이 없습니다.'}</pre>
      </div>
    );
  }
  return (
    <div className={styles.preview}>
      <div className={styles.detailEmpty}>
        <DriveIcon name="file" size={28} />
        <strong>미리보기를 지원하지 않는 형식입니다.</strong>
        <span className={styles.muted}>{item?.contentType || '다운로드로 열 수 있습니다.'}</span>
      </div>
    </div>
  );
}

export function DrivePreviewPanel({
  activeFolders,
  accessTagLabel = null,
  canManageShares = true,
  currentPath,
  detailOpen,
  isShared,
  item,
  moveTargetId,
  nameDraft,
  onChangeMoveTargetId,
  onChangeNameDraft,
  onDownload,
  onOpenFolder,
  onRestore,
  onSaveMeta,
  onShare,
  onToggleStar,
  onTrash,
  readOnly = false,
  userLabel,
}: {
  activeFolders: DriveItemRecord[];
  accessTagLabel?: string | null;
  canManageShares?: boolean;
  currentPath: string;
  detailOpen: boolean;
  isShared: boolean;
  item: DriveItemRecord | null;
  moveTargetId: string;
  nameDraft: string;
  onChangeMoveTargetId: (value: string) => void;
  onChangeNameDraft: (value: string) => void;
  onDownload: (item: DriveItemRecord) => void;
  onOpenFolder: (folderId: string) => void;
  onRestore: (itemId: string) => void;
  onSaveMeta: (item: DriveItemRecord) => void;
  onShare: (item: DriveItemRecord) => void;
  onToggleStar: (item: DriveItemRecord) => void;
  onTrash: (item: DriveItemRecord) => void;
  readOnly?: boolean;
  userLabel: string;
}) {
  const [tab, setTab] = useState<'activity' | 'details'>('details');

  if (!detailOpen) {
    return null;
  }

  return (
    <article className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <div className={styles.detailTitleBlock}>
          <strong>{item?.name || '상세 정보'}</strong>
          <span className={styles.muted}>선택한 항목의 정보와 작업</span>
        </div>
        <div className={styles.metaInline}>
          {item?.isStarred ? <span className={styles.typePill}>중요</span> : null}
          {isShared ? <span className={styles.sharedBadge}>공유 중</span> : null}
          {accessTagLabel ? <span className={styles.roleBadge}>{accessTagLabel}</span> : null}
        </div>
      </div>

      <div className={styles.detailTabs}>
        <button
          type="button"
          className={`${styles.detailTab} ${tab === 'details' ? styles.detailTabActive : ''}`}
          onClick={() => setTab('details')}
        >
          Details
        </button>
        <button
          type="button"
          className={`${styles.detailTab} ${tab === 'activity' ? styles.detailTabActive : ''}`}
          onClick={() => setTab('activity')}
        >
          Activity
        </button>
      </div>

      <PreviewCanvas item={item} />

      {tab === 'details' ? (
        <>
          <div className={styles.detailFieldGrid}>
            <div className={styles.detailField}>
              <span className={styles.fieldLabel}>이름</span>
              <span className={styles.detailValue}>{item?.name || '항목을 선택하세요'}</span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.fieldLabel}>유형</span>
              <span className={styles.detailValue}>{item ? (item.kind === 'folder' ? '폴더' : item.fileType || '파일') : '-'}</span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.fieldLabel}>위치</span>
              <span className={styles.detailValueMuted}>{currentPath || '-'}</span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.fieldLabel}>소유자</span>
              <span className={styles.detailValue}>{userLabel}</span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.fieldLabel}>생성일</span>
              <span className={styles.detailValue}>{item ? formatDateTime(item.createdAt) : '-'}</span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.fieldLabel}>수정일</span>
              <span className={styles.detailValue}>{item ? formatDateTime(item.updatedAt) : '-'}</span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.fieldLabel}>크기</span>
              <span className={styles.detailValue}>{item ? (item.kind === 'folder' ? '-' : formatSize(item.sizeBytes)) : '-'}</span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.fieldLabel}>공유 상태</span>
              <span className={styles.detailValue}>{isShared ? '공유 중' : '비공개'}</span>
            </div>
          </div>

          {item && !readOnly ? (
            <div className={styles.detailForm}>
              <label className={styles.detailField}>
                <span className={styles.fieldLabel}>이름 변경</span>
                <input className={styles.detailInput} value={nameDraft || item.name} onChange={(event) => onChangeNameDraft(event.target.value)} />
              </label>
              <label className={styles.detailField}>
                <span className={styles.fieldLabel}>이동</span>
                <select className={styles.detailInput} value={moveTargetId} onChange={(event) => onChangeMoveTargetId(event.target.value)}>
                  <option value="">내 드라이브</option>
                  {activeFolders.filter((folder) => folder.id !== item.id).map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          <div className={styles.detailQuickActions}>
            {item ? (
              <>
                {!readOnly && canManageShares ? (
                  <button type="button" className={styles.quickActionButton} onClick={() => onShare(item)}>
                    <DriveIcon name="share" size={18} />
                    <span>공유</span>
                  </button>
                ) : null}
                {item.kind === 'folder' ? (
                  <button type="button" className={styles.quickActionButton} onClick={() => onOpenFolder(item.id)}>
                    <DriveIcon name="folder" size={18} />
                    <span>열기</span>
                  </button>
                ) : item.fileType === 'link' ? (
                  <Link href={item.externalUrl} target="_blank" className={styles.quickActionButton}>
                    <DriveIcon name="share" size={18} />
                    <span>링크 열기</span>
                  </Link>
                ) : (
                  <button type="button" className={styles.quickActionButton} onClick={() => onDownload(item)}>
                    <DriveIcon name="download" size={18} />
                    <span>다운로드</span>
                  </button>
                )}
                {!readOnly ? (
                  <>
                    <button type="button" className={styles.quickActionButton} onClick={() => onSaveMeta(item)}>
                      <DriveIcon name="edit" size={18} />
                      <span>이름 변경</span>
                    </button>
                    <button type="button" className={styles.quickActionButton} onClick={() => onToggleStar(item)}>
                      <DriveIcon name="star" size={18} />
                      <span>{item.isStarred ? '중요 해제' : '중요'}</span>
                    </button>
                    {!item.isDeleted ? (
                      <button type="button" className={styles.quickActionButton} onClick={() => onTrash(item)}>
                        <DriveIcon name="trash" size={18} />
                        <span>휴지통</span>
                      </button>
                    ) : (
                      <button type="button" className={styles.quickActionButton} onClick={() => onRestore(item.id)}>
                        <DriveIcon name="move" size={18} />
                        <span>복원</span>
                      </button>
                    )}
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </>
      ) : (
        <div className={styles.detailFieldGrid}>
          <div className={styles.detailField}>
            <span className={styles.fieldLabel}>최근 활동</span>
            <span className={styles.detailValueMuted}>{item ? `${formatDateTime(item.updatedAt)}에 마지막으로 수정되었습니다.` : '선택한 항목이 없습니다.'}</span>
          </div>
          <div className={styles.detailField}>
            <span className={styles.fieldLabel}>생성 기록</span>
            <span className={styles.detailValueMuted}>{item ? `${formatDateTime(item.createdAt)}에 생성되었습니다.` : '-'}</span>
          </div>
          {isShared ? (
            <div className={styles.detailField}>
              <span className={styles.fieldLabel}>공유 상태</span>
              <span className={styles.detailValueMuted}>이 항목에는 공유 링크 또는 접근 권한이 설정되어 있습니다.</span>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
