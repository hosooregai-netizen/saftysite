'use client';

import type { ReactNode } from 'react';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type {
  SortableColumnConfig,
  TableSortDirection,
  TableSortState,
} from '@/types/admin';

function getNextSortDirection(
  current: TableSortState,
  columnKey: string,
  defaultDirection: TableSortDirection,
) {
  if (current.key === columnKey) {
    return current.direction === 'asc' ? 'desc' : 'asc';
  }
  return defaultDirection;
}

export function buildNextTableSort(
  current: TableSortState,
  columnKey: string,
  defaultDirection: TableSortDirection = 'asc',
): TableSortState {
  return {
    direction: getNextSortDirection(current, columnKey, defaultDirection),
    key: columnKey,
  };
}

function resolveAriaSort(
  current: TableSortState,
  columnKey: string,
): 'ascending' | 'descending' | 'none' {
  if (current.key !== columnKey) return 'none';
  return current.direction === 'asc' ? 'ascending' : 'descending';
}

function getSortIndicator(
  current: TableSortState,
  columnKey: string,
): ReactNode {
  if (current.key !== columnKey) {
    return <span className={styles.sortHeaderIndicatorMuted}>↕</span>;
  }
  return (
    <span className={styles.sortHeaderIndicatorActive}>
      {current.direction === 'asc' ? '↑' : '↓'}
    </span>
  );
}

interface SortableHeaderCellProps<Key extends string = string> {
  current: TableSortState;
  defaultDirection?: TableSortDirection;
  label: ReactNode;
  onChange: (next: TableSortState) => void;
  title?: string;
  column: Pick<SortableColumnConfig<Key>, 'key'>;
}

export function SortableHeaderCell<Key extends string = string>({
  current,
  defaultDirection = 'asc',
  label,
  onChange,
  title,
  column,
}: SortableHeaderCellProps<Key>) {
  return (
    <th scope="col" aria-sort={resolveAriaSort(current, column.key)}>
      <button
        type="button"
        className={styles.sortHeaderButton}
        title={title || (typeof label === 'string' ? `${label} 정렬` : undefined)}
        onClick={() =>
          onChange(buildNextTableSort(current, column.key, defaultDirection))
        }
      >
        <span>{label}</span>
        {getSortIndicator(current, column.key)}
      </button>
    </th>
  );
}
