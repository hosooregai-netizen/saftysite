'use client';

import styles from './HazardDemoActions.module.css';

interface HazardDemoActionsProps {
  reportsCount: number;
  onAddReport: () => void;
  onRemoveLastReport: () => void;
  onPrint: () => void;
}

export default function HazardDemoActions({
  reportsCount,
  onAddReport,
  onRemoveLastReport,
  onPrint,
}: HazardDemoActionsProps) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        onClick={onAddReport}
        className="app-button app-button-primary"
      >
        보고서 추가
      </button>
      {reportsCount > 1 && (
        <button
          type="button"
          onClick={onRemoveLastReport}
          className="app-button app-button-secondary"
        >
          마지막 보고서 제거
        </button>
      )}
      <button
        type="button"
        onClick={onPrint}
        className="app-button app-button-accent"
      >
        인쇄
      </button>
    </div>
  );
}

