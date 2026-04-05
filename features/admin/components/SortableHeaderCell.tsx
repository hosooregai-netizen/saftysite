'use client';

import { createPortal } from 'react-dom';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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

function getMenuDots(): ReactNode {
  return (
    <span className={styles.sortHeaderMenuCaret} aria-hidden="true">
      <svg viewBox="0 0 12 12" className={styles.sortHeaderIndicatorSvg}>
        <circle cx="6" cy="2.25" r="1" fill="currentColor" />
        <circle cx="6" cy="6" r="1" fill="currentColor" />
        <circle cx="6" cy="9.75" r="1" fill="currentColor" />
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

interface MenuPosition {
  left: number;
  minWidth: number;
  top: number;
}

const MENU_GAP = 8;
const VIEWPORT_GAP = 12;
const FALLBACK_MENU_HEIGHT = 140;
const FALLBACK_MENU_WIDTH = 176;

export function SortableHeaderCell<Key extends string = string>({
  current,
  defaultDirection = 'asc',
  label,
  onChange,
  sortMenuOptions,
  title,
  column,
}: SortableHeaderCellProps<Key>) {
  const menuId = useId();
  const rootRef = useRef<HTMLTableCellElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({
    left: VIEWPORT_GAP,
    minWidth: FALLBACK_MENU_WIDTH,
    top: VIEWPORT_GAP,
  });
  const hasMenu = Boolean(sortMenuOptions?.length);
  const canPortal = typeof document !== 'undefined';

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === 'undefined') return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = Math.max(menuRef.current?.offsetWidth ?? FALLBACK_MENU_WIDTH, FALLBACK_MENU_WIDTH);
    const menuHeight = menuRef.current?.offsetHeight ?? FALLBACK_MENU_HEIGHT;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const preferredLeft = triggerRect.right - menuWidth;
    const left = Math.min(
      Math.max(VIEWPORT_GAP, preferredLeft),
      viewportWidth - menuWidth - VIEWPORT_GAP,
    );

    const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_GAP;
    const spaceAbove = triggerRect.top - VIEWPORT_GAP;
    const shouldOpenUpward = spaceBelow < menuHeight + MENU_GAP && spaceAbove > spaceBelow;
    const top = shouldOpenUpward
      ? Math.max(VIEWPORT_GAP, triggerRect.top - menuHeight - MENU_GAP)
      : Math.min(
          triggerRect.bottom + MENU_GAP,
          viewportHeight - menuHeight - VIEWPORT_GAP,
        );

    setPosition({
      left,
      minWidth: Math.max(triggerRect.width, FALLBACK_MENU_WIDTH),
      top,
    });
  };

  useLayoutEffect(() => {
    if (!isMenuOpen) return;
    updatePosition();
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    const handleReposition = () => {
      updatePosition();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isMenuOpen]);

  return (
    <th
      ref={rootRef}
      scope="col"
      aria-sort={resolveAriaSort(current, column.key)}
      className={styles.sortHeaderCell}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.sortHeaderButton} ${hasMenu && isMenuOpen ? styles.sortHeaderButtonMenuOpen : ''}`}
        title={title || (typeof label === 'string' ? `${label} 정렬` : undefined)}
        aria-haspopup={hasMenu ? 'menu' : undefined}
        aria-expanded={hasMenu ? isMenuOpen : undefined}
        aria-controls={hasMenu ? menuId : undefined}
        onClick={() => {
          if (hasMenu) {
            setIsMenuOpen((open) => !open);
            return;
          }
          onChange(buildNextTableSort(current, column.key, defaultDirection));
        }}
      >
        <span className={styles.sortHeaderLabel}>{label}</span>
        <span className={styles.sortHeaderIcons}>
          {getSortIndicator(current, column.key)}
          {hasMenu ? getMenuDots() : null}
        </span>
      </button>
      {hasMenu && isMenuOpen && canPortal
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              className={styles.sortHeaderMenu}
              style={{
                bottom: 'auto',
                left: `${position.left}px`,
                minWidth: `${position.minWidth}px`,
                position: 'fixed',
                right: 'auto',
                top: `${position.top}px`,
                zIndex: 1000,
              }}
            >
              {sortMenuOptions?.map((option) => {
                const isActive =
                  current.key === option.next.key && current.direction === option.next.direction;
                return (
                  <button
                    key={`${option.next.key}-${option.next.direction}-${option.label}`}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={`${styles.sortHeaderMenuItem} ${isActive ? styles.sortHeaderMenuItemActive : ''}`}
                    onClick={() => {
                      onChange(option.next);
                      setIsMenuOpen(false);
                    }}
                  >
                    <span className={styles.sortHeaderMenuItemLabel}>{option.label}</span>
                    <span className={styles.sortHeaderMenuItemCheck} aria-hidden="true">
                      {isActive ? '선택됨' : ''}
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </th>
  );
}
