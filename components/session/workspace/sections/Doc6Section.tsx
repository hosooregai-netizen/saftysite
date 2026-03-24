import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';

export default function Doc6Section({
  applyDocumentUpdate,
  recommendedAgentKeys,
  session,
}: {
  applyDocumentUpdate: OverviewSectionProps['applyDocumentUpdate'];
  recommendedAgentKeys: Set<string>;
  session: OverviewSectionProps['session'];
}) {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">추천 {recommendedAgentKeys.size}건</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc6', 'derived', (current) => ({ ...current, document6Measures: current.document6Measures.map((measure) => ({ ...measure, checked: recommendedAgentKeys.has(measure.key) })) }))}>
          추천값 다시 반영
        </button>
      </div>
      <div className={styles.measureTable}>
        {CAUSATIVE_AGENT_SECTIONS.flatMap((section) => section.rows).map((row) => (
          <div key={`${row.left.key}-${row.right.key}`} className={styles.measureRow}>
            {[row.left, row.right].map((item) => {
              const currentMeasure = session.document6Measures.find((measure) => measure.key === item.key);
              return (
                <label key={item.key} className={styles.measureCell}>
                  <div className={styles.measureMain}>
                    <input type="checkbox" className="app-checkbox" checked={currentMeasure?.checked ?? false} onChange={(event) => applyDocumentUpdate('doc6', 'manual', (current) => ({ ...current, document6Measures: current.document6Measures.map((measure) => measure.key === item.key ? { ...measure, checked: event.target.checked } : measure) }))} />
                    <div><div className={styles.measureTitle}><span className={styles.measureNumber}>{item.number}</span><span>{item.label}</span></div><p className={styles.measureText}>{item.guidance}</p></div>
                  </div>
                  {recommendedAgentKeys.has(item.key) ? <span className={styles.recommendBadge}>추천</span> : null}
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
