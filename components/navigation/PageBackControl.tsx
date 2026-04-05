'use client';

import Link from 'next/link';
import type { MouseEventHandler } from 'react';
import styles from './PageBackControl.module.css';

interface PageBackControlProps {
  ariaLabel?: string;
  href?: string;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function PageBackControl({
  ariaLabel,
  href,
  label,
  onClick,
}: PageBackControlProps) {
  const resolvedAriaLabel = ariaLabel || `${label}으로 돌아가기`;
  const content = (
    <>
      <span className={styles.chevron} aria-hidden="true">
        {'<'}
      </span>
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={styles.backControl} aria-label={resolvedAriaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={styles.backControl} onClick={onClick} aria-label={resolvedAriaLabel}>
      {content}
    </button>
  );
}
