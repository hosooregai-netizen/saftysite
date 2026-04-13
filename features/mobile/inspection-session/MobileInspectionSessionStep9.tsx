'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { CHECKLIST_RATING_OPTIONS } from '@/components/session/workspace/constants';
import styles from '@/features/mobile/components/MobileShell.module.css';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep9Props {
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

function ChecklistGroup({
  items,
  onChange,
  title,
}: {
  items: InspectionSessionDraft['document9SafetyChecks']['tbm'];
  onChange: (itemId: string, key: 'note' | 'rating', value: string) => void;
  title: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>
        {title}
      </div>
      {items.map((item) => (
        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderBottom: '1px solid rgba(215, 224, 235, 0.72)' }}>
          <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#0f172a' }}>{item.prompt}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 88px', gap: '8px', alignItems: 'center' }}>
            <input className="app-input" value={item.note} onChange={(event) => onChange(item.id, 'note', event.target.value)} placeholder="메모" />
            <select className="app-select" value={item.rating} onChange={(event) => onChange(item.id, 'rating', event.target.value)} style={{ width: '100%', padding: '4px 8px', fontSize: '13px', height: '38px' }}>
              {CHECKLIST_RATING_OPTIONS.map((option) => <option key={option.value || 'empty'} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MobileInspectionSessionStep9({
  screen,
  session,
}: MobileInspectionSessionStep9Props) {
  const updateChecklist = (
    target: 'tbm' | 'riskAssessment',
    itemId: string,
    key: 'note' | 'rating',
    value: string,
  ) => {
    screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
      ...current,
      document9SafetyChecks: {
        ...current.document9SafetyChecks,
        [target]: current.document9SafetyChecks[target].map((item) =>
          item.id === itemId ? { ...item, [key]: value } : item,
        ),
      },
    }));
  };

  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>위험성평가 / TBM</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ChecklistGroup items={session.document9SafetyChecks.tbm} onChange={(itemId, key, value) => updateChecklist('tbm', itemId, key, value)} title="TBM 체크리스트" />
          <ChecklistGroup items={session.document9SafetyChecks.riskAssessment} onChange={(itemId, key, value) => updateChecklist('riskAssessment', itemId, key, value)} title="위험성평가 체크리스트" />
        </div>
      </div>
    </section>
  );
}
