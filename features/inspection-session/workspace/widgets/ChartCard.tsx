import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { buildDonutSlices } from '@/components/session/workspace/chartDonutUtils';
import type { ChartEntry } from '@/components/session/workspace/utils';

interface ChartCardProps {
  entries: ChartEntry[];
  title: string;
  variant?: 'default' | 'erp';
}

export function ChartCard({
  entries,
  title,
  variant = 'default',
}: ChartCardProps) {
  const list = Array.isArray(entries) ? entries : [];
  const total = list.reduce((sum, item) => sum + item.count, 0);
  const slices = total > 0 ? buildDonutSlices(list, total) : [];
  const summaryLabel = `${title}: 총 ${total}건`;
  const formatPercent = (count: number) => {
    if (total <= 0) return '0%';
    const percent = (count / total) * 100;
    const rounded = Math.round(percent * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
  };

  const isErp = variant === 'erp';
  const cardClassName = isErp
    ? `${styles.chartCard} ${styles.chartCardErp}`
    : styles.chartCard;
  const titleClassName = isErp
    ? `${styles.chartTitle} ${styles.chartTitleErp}`
    : styles.chartTitle;
  const bodyClassName = isErp
    ? `${styles.chartDonutBody} ${styles.chartDonutBodyErp}`
    : styles.chartDonutBody;

  return (
    <article className={cardClassName}>
      <h3 className={titleClassName}>{title}</h3>
      {list.length > 0 && total > 0 ? (
        <div className={bodyClassName}>
          <div className={styles.chartDonutFigure}>
            <svg
              className={styles.chartDonutSvg}
              viewBox="-50 -50 100 100"
              role="img"
              aria-label={summaryLabel}
            >
              <title>{summaryLabel}</title>
              {slices.map((slice) => (
                <path key={slice.label} d={slice.path} fill={slice.color} stroke="none" />
              ))}
            </svg>
          </div>
          <ul className={styles.chartDonutLegend}>
            {list.map((item, index) => (
              <li key={item.label} className={styles.chartDonutLegendItem}>
                <span
                  className={styles.chartDonutSwatch}
                  style={{ backgroundColor: slices[index]?.color }}
                  aria-hidden="true"
                />
                <span className={styles.chartDonutLegendLabel}>{item.label}</span>
                <span className={styles.chartDonutLegendCount}>
                  {item.count}건 · {formatPercent(item.count)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={styles.emptyInline}>집계할 위험요인 데이터가 없습니다.</div>
      )}
    </article>
  );
}
