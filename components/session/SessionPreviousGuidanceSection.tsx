import HazardReportTable from '@/components/HazardReportTable';
import hazardStyles from '@/components/HazardReportTable.module.css';
import { PREVIOUS_GUIDANCE_RESULT_OPTIONS } from '@/constants/inspectionSession';
import type { HazardReportItem } from '@/types/hazard';
import type { PreviousGuidanceItem } from '@/types/inspectionSession';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionPreviousGuidanceSectionProps {
  items: PreviousGuidanceItem[];
  onChange: (itemId: string, patch: Partial<PreviousGuidanceItem>) => void;
}

function toHazardReportItem(item: PreviousGuidanceItem): HazardReportItem {
  return {
    location: item.location,
    locationDetail: item.locationDetail,
    likelihood: item.likelihood,
    severity: item.severity,
    riskAssessmentResult: item.riskAssessmentResult,
    hazardFactors: item.hazardFactors,
    improvementItems: item.improvementItems,
    photoUrl: item.photoUrl,
    legalInfo: item.legalInfo,
    implementationPeriod: item.implementationResult,
  };
}

function PreviousGuidanceDateFields({
  item,
  index,
}: {
  item: PreviousGuidanceItem;
  index: number;
}) {
  return (
    <>
      <div className={hazardStyles.formField}>
        <label
          className={hazardStyles.fieldLabel}
          htmlFor={`previous-guidance-date-${index}`}
        >
          지도일
        </label>
        <input
          id={`previous-guidance-date-${index}`}
          type="text"
          value={item.guidanceDate}
          readOnly
          className="app-input"
        />
      </div>

      <div className={hazardStyles.formField}>
        <label
          className={hazardStyles.fieldLabel}
          htmlFor={`previous-guidance-confirmation-date-${index}`}
        >
          확인일
        </label>
        <input
          id={`previous-guidance-confirmation-date-${index}`}
          type="text"
          value={item.confirmationDate}
          readOnly
          className="app-input"
        />
      </div>
    </>
  );
}

export default function SessionPreviousGuidanceSection({
  items,
  onChange,
}: SessionPreviousGuidanceSectionProps) {
  if (items.length === 0) {
    return (
      <div className={styles.sectionStack}>
        <div className={styles.emptyPanel}>
          같은 현장의 과거 지도 사항 데이터가 아직 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sectionStack}>
      <div className={styles.hazardReportList}>
        {items.map((item, index) => (
          <div key={item.id} className={styles.hazardReportCard}>
            <HazardReportTable
              data={toHazardReportItem(item)}
              onChange={(data) =>
                onChange(item.id, { implementationResult: data.implementationPeriod })
              }
              index={index + 200}
              photoMode="readonly"
              topGridExtraContent={
                <PreviousGuidanceDateFields item={item} index={index + 200} />
              }
              implementationPeriodOptions={[...PREVIOUS_GUIDANCE_RESULT_OPTIONS]}
              readOnlyFields={{
                locationDetail: true,
                likelihood: true,
                severity: true,
                improvementItems: true,
                hazardFactors: true,
                legalInfo: true,
              }}
              text={{
                locationDetailLabel: '유해 위험장소',
                photoLabel: '과거 사진',
                photoAlt: '과거 지도 사항 사진',
                photoEmptyHint: '과거 보고서에 등록된 사진이 없습니다.',
                hazardFactorsLabel: '유해위험요인',
                implementationPeriodLabel: '이행 결과',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
