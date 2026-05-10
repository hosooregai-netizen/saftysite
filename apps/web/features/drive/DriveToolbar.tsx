'use client';

import type { ChangeEvent, ReactNode, RefObject } from 'react';
import styles from '@/features/drive/DriveWorkspace.module.css';
import type { DriveSortMode, DriveViewMode } from '@/features/drive/types';

export function DriveToolbar({
  createMenu,
  detailOpen,
  onToggleDetails,
  onToggleSidebar,
  onUploadChange,
  onUploadClick,
  query,
  readOnly = false,
  setQuery,
  setSortMode,
  setViewMode,
  sortMode,
  uploadInputRef,
  viewMode,
}: {
  createMenu?: ReactNode;
  detailOpen: boolean;
  onToggleDetails: () => void;
  onToggleSidebar: () => void;
  onUploadChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
  query: string;
  readOnly?: boolean;
  setQuery: (value: string) => void;
  setSortMode: (value: DriveSortMode) => void;
  setViewMode: (value: DriveViewMode) => void;
  sortMode: DriveSortMode;
  uploadInputRef?: RefObject<HTMLInputElement | null>;
  viewMode: DriveViewMode;
}) {
  return (
    <section className={styles.toolbarShell}>
      <div className={styles.toolbarLeft}>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.mobileOnly}`}
          aria-label="탐색 메뉴 열기"
          onClick={onToggleSidebar}
        >
          메뉴
        </button>
        <input
          aria-label="자료 검색"
          className={`erp-input ${styles.searchField}`}
          placeholder="파일명, 메모, 링크, 유형 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className={styles.toolbarRight}>
        {!readOnly ? createMenu : null}
        {!readOnly ? (
          <>
            <button type="button" className="erp-button erp-button-primary" onClick={onUploadClick}>
              업로드
            </button>
            {uploadInputRef ? (
              <input ref={uploadInputRef} hidden type="file" multiple onChange={onUploadChange} />
            ) : null}
          </>
        ) : null}
        <div className={styles.toolbarCluster}>
          <select
            aria-label="정렬 방식"
            className="erp-select"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as DriveSortMode)}
          >
            <option value="updated">최종 수정순</option>
            <option value="name">이름순</option>
            <option value="size">용량순</option>
            <option value="type">유형순</option>
          </select>
          <button
            type="button"
            className={`${styles.iconButton} ${viewMode === 'table' ? styles.iconButtonActive : ''}`}
            aria-label="리스트 보기"
            onClick={() => setViewMode('table')}
          >
            목록
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${viewMode === 'grid' ? styles.iconButtonActive : ''}`}
            aria-label="그리드 보기"
            onClick={() => setViewMode('grid')}
          >
            그리드
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${detailOpen ? styles.iconButtonActive : ''}`}
            aria-label="상세 패널 토글"
            onClick={onToggleDetails}
          >
            상세
          </button>
        </div>
      </div>
    </section>
  );
}
