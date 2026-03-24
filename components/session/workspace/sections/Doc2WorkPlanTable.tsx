'use client';

import { useEffect, useState } from 'react';
import {
  WORK_PLAN_ITEMS,
  WORK_PLAN_STATUS_OPTIONS,
  WORK_PLAN_STATUS_OPTIONS_COMPACT,
} from '@/components/session/workspace/constants';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import type { WorkPlanCheckKey } from '@/types/inspectionSession';
import { WORK_PLAN_STATUS_FULL_LABEL } from './doc2Shared';

export default function Doc2WorkPlanTable({
  session,
  onChange,
}: {
  session: OverviewSectionProps['session'];
  onChange: (key: WorkPlanCheckKey, value: string) => void;
}) {
  const [compactLabels, setCompactLabels] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompactLabels(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const statusOptions = compactLabels
    ? WORK_PLAN_STATUS_OPTIONS_COMPACT
    : WORK_PLAN_STATUS_OPTIONS;
  const pairRows = Array.from({ length: 6 }, (_, rowIndex) => ({
    left: WORK_PLAN_ITEMS[rowIndex * 2]!,
    right: WORK_PLAN_ITEMS[rowIndex * 2 + 1]!,
  }));

  return (
    <div className={styles.workPlanSection}>
      <table className={styles.workPlanTable}>
        <caption className={styles.workPlanCaption}>작업계획서 12종 상태</caption>
        <colgroup>
          <col className={styles.workPlanColTitle} />
          <col className={styles.workPlanColNarrow} />
          <col className={styles.workPlanColTitle} />
          <col className={styles.workPlanColNarrow} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={styles.workPlanThTitle}>작업명</th>
            <th scope="col" className={styles.workPlanThNarrow}>여부</th>
            <th scope="col" className={styles.workPlanThTitle}>작업명</th>
            <th scope="col" className={styles.workPlanThNarrow}>여부</th>
          </tr>
        </thead>
        <tbody>
          {pairRows.map(({ left, right }, rowIndex) => (
            <tr key={rowIndex}>
              <td className={styles.workPlanTdLabel}>{left.label}</td>
              <td className={styles.workPlanTdSelect}>
                <select
                  className="app-select"
                  value={session.document2Overview.workPlanChecks[left.key]}
                  onChange={(event) => onChange(left.key, event.target.value)}
                  aria-label={`${left.label} 여부`}
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      title={compactLabels ? WORK_PLAN_STATUS_FULL_LABEL[option.value] : undefined}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className={styles.workPlanTdLabel}>{right.label}</td>
              <td className={styles.workPlanTdSelect}>
                <select
                  className="app-select"
                  value={session.document2Overview.workPlanChecks[right.key]}
                  onChange={(event) => onChange(right.key, event.target.value)}
                  aria-label={`${right.label} 여부`}
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      title={compactLabels ? WORK_PLAN_STATUS_FULL_LABEL[option.value] : undefined}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
