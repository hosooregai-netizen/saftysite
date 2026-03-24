'use client';

import Link from 'next/link';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './ActionMenu.module.css';

export interface ActionMenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  tone?: 'default' | 'danger';
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  label?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  minWidth: number;
  origin: 'top' | 'bottom';
}

const MENU_GAP = 8;
const VIEWPORT_GAP = 12;
const FALLBACK_MENU_HEIGHT = 140;

export default function ActionMenu({
  items,
  label = '작업 메뉴 열기',
}: ActionMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
    minWidth: 148,
    origin: 'top',
  });

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === 'undefined') return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = Math.max(menuRef.current?.offsetWidth ?? 148, 148);
    const menuHeight = menuRef.current?.offsetHeight ?? FALLBACK_MENU_HEIGHT;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const preferredLeft = triggerRect.right - menuWidth;
    const left = Math.min(
      Math.max(VIEWPORT_GAP, preferredLeft),
      viewportWidth - menuWidth - VIEWPORT_GAP
    );

    const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_GAP;
    const spaceAbove = triggerRect.top - VIEWPORT_GAP;
    const shouldOpenUpward = spaceBelow < menuHeight + MENU_GAP && spaceAbove > spaceBelow;

    const top = shouldOpenUpward
      ? Math.max(VIEWPORT_GAP, triggerRect.top - menuHeight - MENU_GAP)
      : Math.min(triggerRect.bottom + MENU_GAP, viewportHeight - menuHeight - VIEWPORT_GAP);

    setPosition({
      top,
      left,
      minWidth: Math.max(triggerRect.width, 148),
      origin: shouldOpenUpward ? 'bottom' : 'top',
    });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, items.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
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

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.triggerDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {isMounted && isOpen
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className={`${styles.dropdown} ${
                position.origin === 'bottom' ? styles.dropdownUpward : ''
              }`}
              role="menu"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                minWidth: `${position.minWidth}px`,
              }}
            >
              {items.map((item) =>
                item.href ? (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className={`${styles.item} ${item.tone === 'danger' ? styles.danger : ''}`}
                    role="menuitem"
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    className={`${styles.item} ${item.tone === 'danger' ? styles.danger : ''}`}
                    role="menuitem"
                    onClick={() => {
                      closeMenu();
                      item.onSelect?.();
                    }}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
