'use client';

import type { MouseEvent } from 'react';
import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import type { DriveSortMode, DriveViewMode } from '@/features/drive/types';

const SORT_LABELS: Record<DriveSortMode, string> = {
  name: '이름순',
  size: '용량순',
  type: '유형순',
  updated: '최근 수정순',
};

export function DriveMainHeader({
  detailOpen,
  onDownloadSelection,
  onMoveSelection,
  onRenameSelection,
  onShareSelection,
  onToggleStarSelection,
  onToggleDetails,
  onTrashSelection,
  onOpenSelectionMore,
  selectionCount,
  setSortMode,
  setViewMode,
  sortMode,
  title,
  viewMode,
  canBulkDownload = false,
  canEditSingleSelection = false,
}: {
  detailOpen: boolean;
  onDownloadSelection?: () => void;
  onMoveSelection?: () => void;
  onRenameSelection?: () => void;
  onShareSelection?: () => void;
  onToggleStarSelection?: () => void;
  onToggleDetails: () => void;
  onTrashSelection?: () => void;
  onOpenSelectionMore?: (event: MouseEvent<HTMLButtonElement>) => void;
  selectionCount?: number;
  setSortMode: (value: DriveSortMode) => void;
  setViewMode: (value: DriveViewMode) => void;
  sortMode: DriveSortMode;
  title: string;
  viewMode: DriveViewMode;
  canBulkDownload?: boolean;
  canEditSingleSelection?: boolean;
}) {
  const hasSelection = Boolean(selectionCount && selectionCount > 0);

  return (
    <div className={styles.mainHeader}>
      <div className={styles.mainTitleRow}>
        {hasSelection ? (
          <>
            <strong className={styles.selectionTitle}>{selectionCount}개 선택됨</strong>
            <span className={styles.selectionSubtitle}>선택한 항목에 빠른 작업을 적용할 수 있습니다.</span>
          </>
        ) : (
          <>
            <strong className={styles.mainTitle}>{title}</strong>
            <button type="button" className={styles.headerDropdownButton} aria-label="현재 보기 메뉴">
              <DriveIcon name="chevron-down" />
            </button>
          </>
        )}
      </div>

      <div className={styles.canvasToolbar}>
        {hasSelection ? (
          <div className={styles.selectionToolbar} role="group" aria-label="선택 항목 작업">
            <button
              type="button"
              className={styles.toolbarActionButton}
              aria-label="공유"
              disabled={!canEditSingleSelection}
              onClick={onShareSelection}
            >
              <DriveIcon name="share" />
              <span>공유</span>
            </button>
            <button
              type="button"
              className={styles.toolbarActionButton}
              aria-label="다운로드"
              disabled={!canBulkDownload}
              onClick={onDownloadSelection}
            >
              <DriveIcon name="download" />
              <span>다운로드</span>
            </button>
            <button
              type="button"
              className={styles.toolbarActionButton}
              aria-label="이름 변경"
              disabled={!canEditSingleSelection}
              onClick={onRenameSelection}
            >
              <DriveIcon name="edit" />
              <span>이름 변경</span>
            </button>
            <button
              type="button"
              className={styles.toolbarActionButton}
              aria-label="이동"
              disabled={!canEditSingleSelection}
              onClick={onMoveSelection}
            >
              <DriveIcon name="move" />
              <span>이동</span>
            </button>
            <button type="button" className={styles.toolbarActionButton} aria-label="중요 표시" onClick={onToggleStarSelection}>
              <DriveIcon name="star" />
              <span>중요</span>
            </button>
            <button type="button" className={styles.toolbarActionButton} aria-label="휴지통" onClick={onTrashSelection}>
              <DriveIcon name="trash" />
              <span>휴지통</span>
            </button>
              <button
                type="button"
                className={styles.toolbarIconButton}
                aria-label="더보기"
                onClick={(event) => onOpenSelectionMore?.(event)}
              >
                <DriveIcon name="more" />
              </button>
          </div>
        ) : (
          <>
            <div className={styles.toolbarPill}>
              <DriveIcon name="sort" />
              <select
                aria-label="정렬 방식"
                className={styles.toolbarSelect}
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as DriveSortMode)}
              >
                {(Object.keys(SORT_LABELS) as DriveSortMode[]).map((value) => (
                  <option key={value} value={value}>
                    {SORT_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.viewToggleGroup} role="group" aria-label="보기 방식">
              <button
                type="button"
                className={`${styles.toolbarIconButton} ${viewMode === 'table' ? styles.toolbarIconButtonActive : ''}`}
                aria-label="리스트 보기"
                onClick={() => setViewMode('table')}
              >
                <DriveIcon name="list" />
              </button>
              <button
                type="button"
                className={`${styles.toolbarIconButton} ${viewMode === 'grid' ? styles.toolbarIconButtonActive : ''}`}
                aria-label="그리드 보기"
                onClick={() => setViewMode('grid')}
              >
                <DriveIcon name="grid" />
              </button>
            </div>
            <button
              type="button"
              className={`${styles.toolbarIconButton} ${detailOpen ? styles.toolbarIconButtonActive : ''}`}
              aria-label="상세 패널 토글"
              onClick={onToggleDetails}
            >
              <DriveIcon name="info" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
