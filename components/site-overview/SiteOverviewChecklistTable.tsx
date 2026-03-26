'use client';

import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import type { CausativeAgentKey, CausativeAgentReport } from '@/types/siteOverview';
import ChecklistCell from './ChecklistCell';
import styles from './SiteOverviewChecklist.module.css';

interface SiteOverviewChecklistTableProps {
  report: CausativeAgentReport;
  disabled: boolean;
  onAgentToggle: (key: CausativeAgentKey, checked: boolean) => void;
}

export default function SiteOverviewChecklistTable({
  report,
  disabled,
  onAgentToggle,
}: SiteOverviewChecklistTableProps) {
  return (
    <table className={styles.checklistTable}>
      <colgroup>
        <col className={styles.colSection} />
        <col className={styles.colCheck} />
        <col className={styles.colLabel} />
        <col className={styles.colGuidanceWide} />
        <col className={styles.colCheck} />
        <col className={styles.colLabel} />
        <col className={styles.colGuidance} />
      </colgroup>
      <thead>
        <tr>
          <th colSpan={7} className={styles.tableTitleCell}>
            건설현장 12대 위험요인 기인물 및 예방조치
          </th>
        </tr>
        <tr className={styles.headerRow}>
          <th className={styles.headerCell}>구분</th>
          <th className={styles.headerCell}>체크</th>
          <th className={styles.headerCell}>위험사고 3대 기인물</th>
          <th className={styles.headerCell}>필수 지시사항</th>
          <th className={styles.headerCell}>체크</th>
          <th className={styles.headerCell}>위험사고 3대 기인물</th>
          <th className={styles.headerCell}>필수 지시사항</th>
        </tr>
      </thead>
      <tbody>
        {CAUSATIVE_AGENT_SECTIONS.map((section) =>
          section.rows.map((row, rowIndex) => (
            <tr key={row.left.key}>
              {rowIndex === 0 ? (
                <td rowSpan={section.rows.length} className={styles.sectionCell}>
                  {section.label}
                </td>
              ) : null}
              <ChecklistCell
                item={row.left}
                checked={report.agents[row.left.key]}
                disabled={disabled}
                onToggle={(checked) => onAgentToggle(row.left.key, checked)}
              />
              <ChecklistCell
                item={row.right}
                checked={report.agents[row.right.key]}
                disabled={disabled}
                onToggle={(checked) => onAgentToggle(row.right.key, checked)}
              />
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

