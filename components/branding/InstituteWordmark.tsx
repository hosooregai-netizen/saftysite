'use client';

import styles from './InstituteWordmark.module.css';
import { SERVICE_NAME } from '@/lib/branding';

interface InstituteWordmarkProps {
  className?: string;
  compact?: boolean;
  tone?: 'light' | 'dark';
  productLine?: string | null;
  showSecondary?: boolean;
}

function joinClassNames(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(' ');
}

export function InstituteWordmark({
  className,
  compact = false,
  tone = 'dark',
  productLine = null,
  showSecondary = false,
}: InstituteWordmarkProps) {
  return (
    <span
      className={joinClassNames(
        styles.wordmark,
        tone === 'light' ? styles.light : styles.dark,
        compact ? styles.compact : '',
        className,
      )}
    >
      <span className={styles.primary}>{SERVICE_NAME}</span>
      {showSecondary ? <span className={styles.secondary}>KOREA SAFETY</span> : null}
      {productLine ? <span className={styles.product}>{productLine}</span> : null}
    </span>
  );
}

export default InstituteWordmark;
