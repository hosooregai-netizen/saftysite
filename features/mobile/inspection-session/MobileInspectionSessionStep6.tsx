'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import styles from '@/features/mobile/components/MobileShell.module.css';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep6Props {
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep6({
  screen,
  session,
}: MobileInspectionSessionStep6Props) {
  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>12대 사망사고 기인물</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div className={styles.doc6FlatList}>
          {CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
            section.rows.flatMap((row) => [row.left, row.right]),
          ).map((measure) => {
            const currentMeasure = session.document6Measures.find((item) => item.key === measure.key);
            return (
              <label key={measure.key} className={styles.doc6FlatItem}>
                <span className={styles.doc6FlatLabel}>
                  {measure.number}. {measure.label}
                </span>
                <span className={styles.doc6FlatCheck}>
                  <input
                    type="checkbox"
                    className="app-checkbox"
                    checked={currentMeasure?.checked ?? false}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      screen.applyDocumentUpdate('doc6', 'manual', (current) => ({
                        ...current,
                        document6Measures: current.document6Measures.map((item) =>
                          item.key === measure.key ? { ...item, checked } : item,
                        ),
                      }));
                    }}
                    aria-label={`${measure.label} 해당`}
                  />
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}
