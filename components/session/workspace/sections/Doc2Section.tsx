import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import type { WorkPlanCheckKey } from '@/types/inspectionSession';
import { Doc2AccidentFields } from '@/features/inspection-session/workspace/sections/doc2/Doc2AccidentFields';
import { Doc2OverviewFields } from '@/features/inspection-session/workspace/sections/doc2/Doc2OverviewFields';
import Doc2WorkPlanTable from './Doc2WorkPlanTable';

export default function Doc2Section(props: OverviewSectionProps) {
  const { applyDocumentUpdate, session } = props;

  const updateWorkPlanCheck = (key: WorkPlanCheckKey, value: string) =>
    applyDocumentUpdate('doc2', 'manual', (current) => ({
      ...current,
      document2Overview: {
        ...current.document2Overview,
        workPlanChecks: {
          ...current.document2Overview.workPlanChecks,
          [key]: value as (typeof current.document2Overview.workPlanChecks)[WorkPlanCheckKey],
        },
      },
    }));

  return (
    <div className={styles.sectionStack}>
      <Doc2OverviewFields props={props} />
      <Doc2WorkPlanTable session={session} onChange={updateWorkPlanCheck} />
      <Doc2AccidentFields props={props} />
    </div>
  );
}

