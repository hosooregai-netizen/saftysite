'use client';

import type { ReactNode } from 'react';
import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';

export function DriveTopbar({
  accountLabel = '계정',
  onOpenInfo,
  onOpenMenu,
  onOpenWorkspaceMenu,
  onOpenAccount,
  query,
  secondaryActions,
  sectionTitle,
  setQuery,
  title,
}: {
  accountLabel?: string;
  onOpenInfo: () => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu: () => void;
  onOpenAccount?: () => void;
  query: string;
  readOnly?: boolean;
  secondaryActions?: ReactNode;
  sectionTitle?: string;
  setQuery: (value: string) => void;
  title: string;
}) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLead}>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.mobileNavButton}`}
          aria-label="탐색 메뉴 열기"
          onClick={onOpenMenu}
        >
          <DriveIcon name="menu" />
        </button>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark} aria-hidden="true">
            <DriveIcon name="folder" size={22} />
          </div>
          <div className={styles.brandText}>
            <strong>{title}</strong>
            <span>{sectionTitle || '웹하드'}</span>
          </div>
        </div>
      </div>

      <label className={styles.searchPill} aria-label="자료 검색">
        <DriveIcon name="search" className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="파일명, 메모, 링크, 유형 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className={styles.topbarActions}>
        {secondaryActions}
        <button
          type="button"
          className={styles.actionPillButton}
          aria-label="업무 메뉴 열기"
          onClick={onOpenWorkspaceMenu}
        >
          <DriveIcon name="menu" />
          <span>업무 메뉴</span>
        </button>
        <button type="button" className={styles.toolbarIconButton} aria-label="상세 패널 토글" onClick={onOpenInfo}>
          <DriveIcon name="info" />
        </button>
        <button type="button" className={styles.userButton} aria-label="계정 열기" onClick={onOpenAccount}>
          <DriveIcon name="user" />
          <span className={styles.userButtonLabel}>{accountLabel}</span>
        </button>
      </div>
    </header>
  );
}
