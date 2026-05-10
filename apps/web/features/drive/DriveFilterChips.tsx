'use client';

import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';

export type DriveTypeFilter = 'all' | 'folders' | 'files';
export type DrivePeopleFilter = 'all' | 'owned';
export type DriveUpdatedFilter = 'all' | '7d' | '30d';
export type DriveShareFilter = 'all' | 'shared';

export function DriveFilterChips({
  peopleFilter,
  setPeopleFilter,
  setShareFilter,
  setTypeFilter,
  setUpdatedFilter,
  shareFilter,
  typeFilter,
  updatedFilter,
}: {
  peopleFilter: DrivePeopleFilter;
  setPeopleFilter: (value: DrivePeopleFilter) => void;
  setShareFilter: (value: DriveShareFilter) => void;
  setTypeFilter: (value: DriveTypeFilter) => void;
  setUpdatedFilter: (value: DriveUpdatedFilter) => void;
  shareFilter: DriveShareFilter;
  typeFilter: DriveTypeFilter;
  updatedFilter: DriveUpdatedFilter;
}) {
  return (
    <div className={styles.filterChipRow}>
      <div className={styles.filterChip}>
        <DriveIcon name="folder" size={16} />
        <select className={styles.filterSelect} aria-label="유형 필터" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as DriveTypeFilter)}>
          <option value="all">유형</option>
          <option value="folders">폴더만</option>
          <option value="files">파일만</option>
        </select>
      </div>
      <div className={styles.filterChip}>
        <DriveIcon name="user" size={16} />
        <select className={styles.filterSelect} aria-label="사람 필터" value={peopleFilter} onChange={(event) => setPeopleFilter(event.target.value as DrivePeopleFilter)}>
          <option value="all">사람</option>
          <option value="owned">내가 소유한 항목</option>
        </select>
      </div>
      <div className={styles.filterChip}>
        <DriveIcon name="sort" size={16} />
        <select className={styles.filterSelect} aria-label="수정일 필터" value={updatedFilter} onChange={(event) => setUpdatedFilter(event.target.value as DriveUpdatedFilter)}>
          <option value="all">수정일</option>
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
        </select>
      </div>
      <div className={styles.filterChip}>
        <DriveIcon name="share" size={16} />
        <select className={styles.filterSelect} aria-label="공유 상태 필터" value={shareFilter} onChange={(event) => setShareFilter(event.target.value as DriveShareFilter)}>
          <option value="all">공유 상태</option>
          <option value="shared">공유 중만</option>
        </select>
      </div>
    </div>
  );
}
