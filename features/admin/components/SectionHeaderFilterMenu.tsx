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

function HeaderMenuDotsIcon() {
  return (
    <svg viewBox="0 0 12 12" width="14" height="14" fill="none">
      <circle cx="6" cy="2.25" r="1" fill="currentColor" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="9.75" r="1" fill="currentColor" />
    </svg>
  );
}

interface SectionHeaderFilterMenuProps {
  activeCount?: number;
  ariaLabel: string;
  buttonLabel?: string;
  children: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
}

interface MenuPosition {
  left: number;
  maxWidth: number;
  minWidth: number;
  top: number;
}

const MENU_GAP = 10;
const VIEWPORT_GAP = 12;
const FALLBACK_MENU_HEIGHT = 240;
const FALLBACK_MENU_WIDTH = 360;

export function SectionHeaderFilterMenu({
  activeCount = 0,
  ariaLabel,
  buttonLabel = '필터',
  children,
  onReset,
  resetLabel = '필터 초기화',
}: SectionHeaderFilterMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({
    left: VIEWPORT_GAP,
    maxWidth: 760,
    minWidth: FALLBACK_MENU_WIDTH,
    top: VIEWPORT_GAP,
  });
  const canPortal = typeof document !== 'undefined';

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === 'undefined') return;

    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxWidth = Math.max(280, viewportWidth - VIEWPORT_GAP * 2);
    const measuredWidth = menuRef.current?.offsetWidth ?? FALLBACK_MENU_WIDTH;
    const measuredHeight = menuRef.current?.offsetHeight ?? FALLBACK_MENU_HEIGHT;
    const menuWidth = Math.min(
      Math.max(triggerRect.width, measuredWidth, FALLBACK_MENU_WIDTH),
      maxWidth,
    );

    const preferredLeft = triggerRect.right - menuWidth;
    const left = Math.min(
      Math.max(VIEWPORT_GAP, preferredLeft),
      viewportWidth - menuWidth - VIEWPORT_GAP,
    );

    const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_GAP;
    const spaceAbove = triggerRect.top - VIEWPORT_GAP;
    const shouldOpenUpward = spaceBelow < measuredHeight + MENU_GAP && spaceAbove > spaceBelow;
    const top = shouldOpenUpward
      ? Math.max(VIEWPORT_GAP, triggerRect.top - measuredHeight - MENU_GAP)
      : Math.min(
          triggerRect.bottom + MENU_GAP,
          viewportHeight - measuredHeight - VIEWPORT_GAP,
        );

    setPosition({
      left,
      maxWidth,
      minWidth: Math.min(
        Math.max(triggerRect.width, FALLBACK_MENU_WIDTH),
        maxWidth,
      ),
      top,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
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
  }, [isOpen]);

  return (
    <div ref={rootRef} className={styles.sectionHeaderMenuWrap}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.sectionHeaderMenuButton} ${
          activeCount > 0 ? styles.sectionHeaderMenuButtonActive : ''
        } ${isOpen ? styles.sectionHeaderMenuButtonOpen : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.sectionHeaderMenuButtonLabel}>{buttonLabel}</span>
        {activeCount > 0 ? (
          <span className={styles.sectionHeaderMenuButtonMeta}>{activeCount}</span>
        ) : null}
        <span className={styles.sectionHeaderMenuButtonIcon} aria-hidden="true">
          <HeaderMenuDotsIcon />
        </span>
      </button>

      {canPortal && isOpen
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="dialog"
              aria-label={ariaLabel}
              className={styles.sectionHeaderMenu}
              style={{
                bottom: 'auto',
                left: `${position.left}px`,
                maxWidth: `${position.maxWidth}px`,
                minWidth: `${position.minWidth}px`,
                position: 'fixed',
                right: 'auto',
                top: `${position.top}px`,
                zIndex: 1000,
              }}
            >
              {children}
              {onReset ? (
                <div className={styles.sectionHeaderMenuFooter}>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={() => {
                      onReset();
                      setIsOpen(false);
                    }}
                  >
                    {resetLabel}
                  </button>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
