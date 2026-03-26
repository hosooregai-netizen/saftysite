'use client';

import { ReactNode, useEffect } from 'react';
import styles from './AppModal.module.css';

interface AppModalProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  size?: 'default' | 'large';
}

export default function AppModal({
  open,
  title,
  children,
  actions,
  onClose,
  closeOnBackdrop = true,
  size = 'default',
}: AppModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (!closeOnBackdrop) return;
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={[
          styles.dialog,
          size === 'large' ? styles.dialogLarge : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.body}>
          <div className={styles.header}>
            <h2 id="app-modal-title" className={styles.title}>
              {title}
            </h2>
          </div>
          {children ? <div className={styles.content}>{children}</div> : null}
          <div className={styles.actions}>{actions}</div>
        </div>
      </div>
    </div>
  );
}

