import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';
import { Doc10MeasurementCard } from '@/features/inspection-session/workspace/sections/doc10/Doc10MeasurementCard';

export default function Doc10Section({
  applyDocumentUpdate,
  measurementTemplates,
  session,
  withFileData,
}: Pick<
  HazardStatsSectionProps,
  'applyDocumentUpdate' | 'measurementTemplates' | 'session' | 'withFileData'
>) {
  return (
    <div className={styles.sectionStack}>
      {session.document10Measurements.map((item, index) => (
        <Doc10MeasurementCard
          key={item.id}
          applyDocumentUpdate={applyDocumentUpdate}
          index={index}
          item={item}
          measurementTemplates={measurementTemplates}
          totalCount={session.document10Measurements.length}
          withFileData={withFileData}
        />
      ))}
    </div>
  );
}

