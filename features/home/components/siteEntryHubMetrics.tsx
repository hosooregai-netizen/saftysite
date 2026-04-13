'use client';

import styles from './SiteEntryScreens.module.css';

export function TechnicalGuidanceMiniChart({ count }: { count: number }) {
  const bars = Array.from({ length: 6 }, (_, index) => ({
    key: `tech-bar-${index + 1}`,
    height: 24 + index * 10,
    active: count >= index + 1,
  }));

  return (
    <div className={styles.metricVisual} aria-hidden="true">
      <div className={styles.barChart}>
        {bars.map((bar) => (
          <span
            key={bar.key}
            className={`${styles.barChartBar} ${bar.active ? styles.barChartBarActive : ''}`}
            style={{ height: `${bar.height}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export function QuarterlyRingChart({
  completedQuarters,
  displayYear,
  isLoading,
}: {
  completedQuarters: number[];
  displayYear: number;
  isLoading?: boolean;
}) {
  const segmentColors = [1, 2, 3, 4].map((quarter) => {
    if (isLoading) return 'var(--erp-line)';
    return completedQuarters.includes(quarter) ? 'var(--entry-accent)' : 'var(--erp-line)';
  });
  const background = `conic-gradient(${segmentColors[0]} 0deg 90deg, ${segmentColors[1]} 90deg 180deg, ${segmentColors[2]} 180deg 270deg, ${segmentColors[3]} 270deg 360deg)`;

  return (
    <div className={styles.metricVisual}>
      <div className={styles.quarterRingWrap}>
        <div
          className={styles.quarterRing}
          style={{ background }}
          role="img"
          aria-label={`${displayYear}년 분기 종합 보고서 작성 현황`}
        >
          <div className={styles.quarterRingCenter}>
            <strong>{isLoading ? '…' : `${completedQuarters.length}/4`}</strong>
            <span>{displayYear}</span>
          </div>
        </div>
        <div className={styles.quarterLabels} aria-hidden="true">
          {[1, 2, 3, 4].map((quarter) => (
            <span
              key={`quarter-${quarter}`}
              className={`${styles.quarterLabel} ${
                !isLoading && completedQuarters.includes(quarter) ? styles.quarterLabelActive : ''
              }`}
            >
              {quarter}Q
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
