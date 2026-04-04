'use client';

import type { ReactNode } from 'react';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface TableToolbarProps {
  countLabel?: string;
  exportLabel?: string;
  filters?: ReactNode;
  onExport?: () => void;
  onQueryChange?: (value: string) => void;
  query?: string;
  queryPlaceholder?: string;
}

export function TableToolbar({
  countLabel,
  exportLabel = '엑셀 내보내기',
  filters = null,
  onExport,
  onQueryChange,
  query = '',
  queryPlaceholder = '검색',
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
