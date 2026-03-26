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
      <p className={styles.fieldAssist}>
        관리자 콘텐츠의 `계측 장비 템플릿`을 등록해 두면 장비명을 선택할 때 안전 기준이
        자동으로 채워지고, 이후에는 직접 수정할 수 있습니다.
      </p>
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

