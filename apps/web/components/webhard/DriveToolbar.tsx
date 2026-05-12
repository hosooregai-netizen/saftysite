'use client';

import type { ChangeEvent, RefObject } from 'react';
import styles from '@/components/webhard/WebhardShared.module.css';
import type { ListingMode, SortMode } from '@/lib/webhard/driveTypes';

export function DriveToolbar({
  listingMode,
  onCreateFolder,
  onCreateLink,
  onCreateNote,
  onUpload,
  query,
  setListingMode,
  setQuery,
  setSortMode,
  sortMode,
  uploadInputRef,
}: {
  listingMode: ListingMode;
  onCreateFolder: () => void;
  onCreateLink: () => void;
  onCreateNote: () => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  query: string;
  setListingMode: (mode: ListingMode) => void;
  setQuery: (value: string) => void;
  setSortMode: (mode: SortMode) => void;
  sortMode: SortMode;
  uploadInputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <div className={styles.toolbar}>
        <input className="erp-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="파일명, 메모, 링크 검색" />
        <select className="erp-select" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
          <option value="updated">최종 수정순</option>
          <option value="name">이름순</option>
          <option value="size">용량순</option>
          <option value="type">유형순</option>
        </select>
        <select className="erp-select" value={listingMode} onChange={(event) => setListingMode(event.target.value as ListingMode)}>
          <option value="list">리스트</option>
          <option value="grid">그리드</option>
        </select>
      </div>
      <div className={styles.toolbar}>
        <button type="button" className="erp-button erp-button-secondary" onClick={onCreateFolder}>
          새 폴더
        </button>
        <button type="button" className="erp-button erp-button-secondary" onClick={onCreateNote}>
          새 메모
        </button>
        <button type="button" className="erp-button erp-button-secondary" onClick={onCreateLink}>
          새 링크
        </button>
        <button type="button" className="erp-button erp-button-primary" onClick={() => uploadInputRef.current?.click()}>
          업로드
        </button>
        <input ref={uploadInputRef} hidden type="file" multiple onChange={onUpload} />
      </div>
    </>
  );
}
