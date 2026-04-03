'use client';

import type { ReactNode } from 'react';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { TableSortDirection } from '@/types/admin';

interface SortOption {
  label: string;
  value: string;
}

interface TableToolbarProps {
  countLabel?: string;
  exportLabel?: string;
  filters?: ReactNode;
  onExport?: () => void;
  onQueryChange?: (value: string) => void;
  onSortDirectionChange?: (value: TableSortDirection) => void;
  onSortKeyChange?: (value: string) => void;
  query?: string;
  queryPlaceholder?: string;
  sortDirection?: TableSortDirection;
  sortKey?: string;
  sortOptions?: SortOption[];
}

export function TableToolbar({
  countLabel,
  exportLabel = '엑셀 내보내기',
  filters = null,
  onExport,
  onQueryChange,
  onSortDirectionChange,
  onSortKeyChange,
  query = '',
  queryPlaceholder = '검색',
  sortDirection = 'desc',
  sortKey = '',
  sortOptions = [],
}: TableToolbarProps) {
  return (
    <div className={styles.tableToolbar}>
      <div className={styles.tableToolbarMain}>
        {onQueryChange ? (
          <input
            className={`app-input ${styles.filterSearch}`}
            placeholder={queryPlaceholder}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        ) : null}
        {filters}
        {onSortKeyChange && sortOptions.length > 0 ? (
          <select
            className={`app-select ${styles.toolbarSelect}`}
            aria-label="정렬 기준"
            value={sortKey}
            onChange={(event) => onSortKeyChange(event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
        {onSortDirectionChange && sortOptions.length > 0 ? (
          <select
            className={`app-select ${styles.toolbarSelect}`}
            aria-label="정렬 방향"
            value={sortDirection}
            onChange={(event) =>
              onSortDirectionChange(event.target.value as TableSortDirection)
            }
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        ) : null}
      </div>
      <div className={styles.tableToolbarActions}>
        {countLabel ? <span className="app-chip">{countLabel}</span> : null}
        {onExport ? (
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onExport}
          >
            {exportLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
