import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';

const DOC6_MEASURE_ITEMS = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
  section.rows.flatMap((row) => [row.left, row.right])
);

const DOC6_PAIR_ROWS = Array.from({ length: 7 }, (_, rowIndex) => ({
  left: DOC6_MEASURE_ITEMS[rowIndex * 2]!,
  right: DOC6_MEASURE_ITEMS[rowIndex * 2 + 1]!,
}));

export default function Doc6Section({
  applyDocumentUpdate,
  session,
}: {
  applyDocumentUpdate: OverviewSectionProps['applyDocumentUpdate'];
  session: OverviewSectionProps['session'];
}) {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.workPlanSection}>
        <table className={`${styles.workPlanTable} ${styles.doc6MeasureTable}`}>
          <colgroup>
            <col className={styles.workPlanColTitle} />
            <col className={styles.workPlanColNarrow} />
            <col className={styles.workPlanColTitle} />
            <col className={styles.workPlanColNarrow} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={styles.workPlanThTitle}>
                조치항목
              </th>
              <th scope="col" className={styles.workPlanThNarrow}>
                해당
              </th>
              <th scope="col" className={styles.workPlanThTitle}>
                조치항목
              </th>
              <th scope="col" className={styles.workPlanThNarrow}>
                해당
              </th>
            </tr>
          </thead>
          <tbody>
            {DOC6_PAIR_ROWS.map(({ left, right }, rowIndex) => {
              const leftMeasure = session.document6Measures.find((m) => m.key === left.key);
              const rightMeasure = session.document6Measures.find((m) => m.key === right.key);
              return (
                <tr key={rowIndex}>
                  <td className={styles.workPlanTdLabel}>
                    <div className={styles.doc6MeasureHeading}>
                      {left.number}. {left.label}
                    </div>
                    <p className={styles.measureText}>{left.guidance}</p>
                  </td>
                  <td className={styles.workPlanTdSelect}>
                    <input
                      type="checkbox"
                      className="app-checkbox"
                      checked={leftMeasure?.checked ?? false}
                      onChange={(event) =>
                        applyDocumentUpdate('doc6', 'manual', (current) => ({
                          ...current,
                          document6Measures: current.document6Measures.map((measure) =>
                            measure.key === left.key ? { ...measure, checked: event.target.checked } : measure
                          ),
                        }))
                      }
                      aria-label={`${left.label} 해당`}
                    />
                  </td>
                  <td className={styles.workPlanTdLabel}>
                    <div className={styles.doc6MeasureHeading}>
                      {right.number}. {right.label}
                    </div>
                    <p className={styles.measureText}>{right.guidance}</p>
                  </td>
                  <td className={styles.workPlanTdSelect}>
                    <input
                      type="checkbox"
                      className="app-checkbox"
                      checked={rightMeasure?.checked ?? false}
                      onChange={(event) =>
                        applyDocumentUpdate('doc6', 'manual', (current) => ({
                          ...current,
                          document6Measures: current.document6Measures.map((measure) =>
                            measure.key === right.key ? { ...measure, checked: event.target.checked } : measure
                          ),
                        }))
                      }
                      aria-label={`${right.label} 해당`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
