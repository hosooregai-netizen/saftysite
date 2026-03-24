'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
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

export default function ActionMenu({
  items,
  label = '작업 메뉴 열기',
}: ActionMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (detailsRef.current?.contains(target)) return;
      detailsRef.current?.removeAttribute('open');
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const closeMenu = () => {
    detailsRef.current?.removeAttribute('open');
  };

  return (
    <details ref={detailsRef} className={styles.menu}>
      <summary className={styles.trigger} aria-label={label}>
        <span className={styles.triggerDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </summary>

      <div className={styles.dropdown} role="menu">
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
      </div>
    </details>
  );
}
