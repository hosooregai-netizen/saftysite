import type { ChangeEvent } from 'react';
import HazardReportTable from '@/components/HazardReportTable';
import type { HazardReportItem } from '@/types/hazard';
import type { PreviousGuidanceItem } from '@/types/inspectionSession';
import hazardStyles from '@/components/HazardReportTable.module.css';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionPreviousGuidanceSectionProps {
  items: PreviousGuidanceItem[];
  onChange: (itemId: string, patch: Partial<PreviousGuidanceItem>) => void;
  onPhotoChange: (
    itemId: string,
    field: 'currentPhotoUrl',
    event: ChangeEvent<HTMLInputElement>
  ) => void;
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

export default function SessionPreviousGuidanceSection({
  items,
  onChange,
  onPhotoChange,
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
              readOnlyFields={{
                locationDetail: true,
                likelihood: true,
                severity: true,
                improvementItems: true,
                hazardFactors: true,
                legalInfo: true,
              }}
              text={{
                photoLabel: '과거 사진',
                photoAlt: '과거 지도 사항 사진',
                photoEmptyHint: '과거 보고서에 등록된 사진이 없습니다.',
                hazardFactorsLabel: '지적사항',
                implementationPeriodLabel: '이행 결과',
                implementationPeriodPlaceholder: '예: 안전난간 설치 완료, 추가 보완 예정',
              }}
              extraContent={
                <div className={`${hazardStyles.formField} ${hazardStyles.photoColumn}`}>
                  <label
                    className={hazardStyles.fieldLabel}
                    htmlFor={`${item.id}-current-photo`}
                  >
                    현재 사진
                  </label>
                  <div className={hazardStyles.photoField}>
                    {item.currentPhotoUrl ? (
                      <div className={hazardStyles.photoPreviewWrap}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.currentPhotoUrl}
                          alt="현재 조치 상태 사진"
                          className={hazardStyles.photoPreview}
                        />
                        <div className={hazardStyles.photoActions}>
                          <label
                            htmlFor={`${item.id}-current-photo`}
                            className={hazardStyles.photoAction}
                          >
                            사진 변경
                          </label>
                          <button
                            type="button"
                            onClick={() => onChange(item.id, { currentPhotoUrl: '' })}
                            className={hazardStyles.photoRemoveButton}
                          >
                            사진 제거
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor={`${item.id}-current-photo`}
                        className={hazardStyles.photoPlaceholder}
                      >
                        <span>이미지 선택</span>
                        <span className={hazardStyles.photoPlaceholderHint}>
                          현재 조치 상태 사진을 추가하세요.
                        </span>
                      </label>
                    )}
                    <input
                      id={`${item.id}-current-photo`}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => onPhotoChange(item.id, 'currentPhotoUrl', event)}
                      className={hazardStyles.hiddenInput}
                    />
                  </div>
                </div>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
