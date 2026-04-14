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

function getSortIndicator(current: TableSortState, columnKey: string): ReactNode {
  if (current.key !== columnKey) {
    return (
      <span className={styles.sortHeaderIndicatorMuted} aria-hidden="true">
        <svg viewBox="0 0 12 12" className={styles.sortHeaderIndicatorSvg}>
          <path d="M6 2.25 3.75 4.5h4.5L6 2.25Z" fill="currentColor" />
          <path d="M6 9.75 8.25 7.5h-4.5L6 9.75Z" fill="currentColor" />
        </svg>
      </span>
    );
  }

  return (
    <span className={styles.sortHeaderIndicatorActive} aria-hidden="true">
      <svg viewBox="0 0 12 12" className={styles.sortHeaderIndicatorSvg}>
        {current.direction === 'asc' ? (
          <path d="M6 2.25 3.75 4.5h4.5L6 2.25Z" fill="currentColor" />
        ) : (
          <path d="M6 9.75 8.25 7.5h-4.5L6 9.75Z" fill="currentColor" />
        )}
      </svg>
    </span>
  );
}

export interface SortHeaderMenuOption {
  label: string;
  next: TableSortState;
}

export function buildSortMenuOptions(
  columnKey: string,
  labels: { asc: string; desc: string },
): SortHeaderMenuOption[] {
  return [
    {
      label: labels.asc,
      next: {
        direction: 'asc',
        key: columnKey,
      },
    },
    {
      label: labels.desc,
      next: {
        direction: 'desc',
        key: columnKey,
      },
    },
  ];
}

interface SortableHeaderCellProps<Key extends string = string> {
  current: TableSortState;
  defaultDirection?: TableSortDirection;
  label: ReactNode;
  onChange: (next: TableSortState) => void;
  sortMenuOptions?: SortHeaderMenuOption[];
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
    <th
      scope="col"
      aria-sort={resolveAriaSort(current, column.key)}
      className={styles.sortHeaderCell}
    >
      <button
        type="button"
        className={styles.sortHeaderButton}
        title={title || (typeof label === 'string' ? `${label} 정렬` : undefined)}
        onClick={() => onChange(buildNextTableSort(current, column.key, defaultDirection))}
      >
        <span className={styles.sortHeaderIcons}>{getSortIndicator(current, column.key)}</span>
        <span className={styles.sortHeaderLabel}>{label}</span>
      </button>
    </th>
  );
}
