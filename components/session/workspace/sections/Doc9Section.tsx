import { CHECKLIST_RATING_OPTIONS } from '@/components/session/workspace/constants';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';
import { ChecklistTable } from '@/components/session/workspace/widgets';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { ChecklistRating } from '@/types/inspectionSession';

const RATING_OPTIONS: Array<{ label: string; value: ChecklistRating }> = [
  ...CHECKLIST_RATING_OPTIONS,
];

export default function Doc9Section({
  applyDocumentUpdate,
  session,
}: Pick<HazardStatsSectionProps, 'applyDocumentUpdate' | 'session'>) {
  return (
    <div className={styles.sectionStack}>
      <ChecklistTable title="TBM 체크" items={session.document9SafetyChecks.tbm} ratingOptions={RATING_OPTIONS} onChange={(itemId, patch) => applyDocumentUpdate('doc9', 'manual', (current) => ({ ...current, document9SafetyChecks: { ...current.document9SafetyChecks, tbm: current.document9SafetyChecks.tbm.map((item) => item.id === itemId ? { ...item, ...patch } : item) } }))} />
      <ChecklistTable title="위험성평가 체크" items={session.document9SafetyChecks.riskAssessment} ratingOptions={RATING_OPTIONS} onChange={(itemId, patch) => applyDocumentUpdate('doc9', 'manual', (current) => ({ ...current, document9SafetyChecks: { ...current.document9SafetyChecks, riskAssessment: current.document9SafetyChecks.riskAssessment.map((item) => item.id === itemId ? { ...item, ...patch } : item) } }))} />
    </div>
  );
}
