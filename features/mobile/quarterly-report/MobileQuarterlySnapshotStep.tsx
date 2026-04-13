'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import {
  MOBILE_QUARTERLY_SNAPSHOT_FIELDS,
  MOBILE_QUARTERLY_SNAPSHOT_WIDE_FIELDS,
} from './types';

interface MobileQuarterlySnapshotStepProps {
  draft: QuarterlySummaryReport;
  onUpdateField: (field: keyof QuarterlySummaryReport['siteSnapshot'], value: string) => void;
}

export function MobileQuarterlySnapshotStep({
  draft,
  onUpdateField,
}: MobileQuarterlySnapshotStepProps) {
  return (
    <section className={styles.mobileEditorCard}>
      <div className={styles.mobileCompactFieldGrid}>
        {MOBILE_QUARTERLY_SNAPSHOT_FIELDS.map((field) => (
          <label
            key={field.key}
            className={`${styles.mobileEditorFieldGroup} ${
              MOBILE_QUARTERLY_SNAPSHOT_WIDE_FIELDS.has(field.key) ? styles.mobileCompactFieldWide : ''
            }`}
          >
            <span className={styles.mobileEditorFieldLabel}>{field.label}</span>
            <input
              className="app-input"
              value={String(draft.siteSnapshot[field.key] ?? '')}
              onChange={(event) => onUpdateField(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
