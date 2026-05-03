'use client';

import styles from './InstituteWordmark.module.css';

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
  showSecondary = true,
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
      <span className={styles.primary}>대한안전산업연구원</span>
      {showSecondary ? <span className={styles.secondary}>大韓安全産業硏究院</span> : null}
      {productLine ? <span className={styles.product}>{productLine}</span> : null}
    </span>
  );
}

export default InstituteWordmark;
