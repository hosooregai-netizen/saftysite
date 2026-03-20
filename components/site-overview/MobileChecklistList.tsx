'use client';

import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import type {
  CausativeAgentKey,
  CausativeAgentReport,
} from '@/types/siteOverview';
import styles from './SiteOverviewChecklist.module.css';

interface MobileChecklistListProps {
  report: CausativeAgentReport;
  disabled: boolean;
  onAgentToggle: (key: CausativeAgentKey, checked: boolean) => void;
}

function joinClassNames(...values: Array<string | false>) {
  return values.filter(Boolean).join(' ');
}

const MOBILE_ITEMS = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
  section.rows.flatMap((row) => [
    { sectionLabel: section.label, item: row.left },
    { sectionLabel: section.label, item: row.right },
  ])
);

export default function MobileChecklistList({
  report,
  disabled,
  onAgentToggle,
}: MobileChecklistListProps) {
  return (
    <div className={styles.mobileChecklistList}>
      <div className={styles.mobileChecklistHeader}>
        건설현장 12대 위험요인 기인물 및 예방조치
      </div>
      <div className={styles.mobileChecklistHeaderMeta} aria-hidden="true">
        <span className={styles.mobileChecklistHeaderMetaItem}>체크</span>
        <span className={styles.mobileChecklistHeaderMetaItem}>기인물</span>
        <span className={styles.mobileChecklistHeaderMetaItem}>필수 지시사항</span>
      </div>
      {MOBILE_ITEMS.map(({ item }) => (
        <div
          key={item.key}
          className={joinClassNames(
            styles.mobileChecklistItem,
            report.agents[item.key] && styles.checkedCell
          )}
        >
          <label className={styles.mobileChecklistCheckField}>
            <input
              type="checkbox"
              checked={report.agents[item.key]}
              disabled={disabled}
              onChange={(event) => onAgentToggle(item.key, event.target.checked)}
              className={styles.checkbox}
              aria-label={`${item.number}. ${item.label}`}
            />
          </label>
          <p className={styles.mobileChecklistValue}>
            <span>
              {item.number}. {item.label}
            </span>
          </p>
          <p className={styles.mobileChecklistGuidance}>{item.guidance}</p>
        </div>
      ))}
    </div>
  );
}
