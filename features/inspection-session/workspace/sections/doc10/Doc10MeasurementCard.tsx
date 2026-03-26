import { useMemo } from 'react';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';
import type { InspectionSession } from '@/types/inspectionSession';

interface Doc10MeasurementCardProps {
  applyDocumentUpdate: HazardStatsSectionProps['applyDocumentUpdate'];
  index: number;
  item: InspectionSession['document10Measurements'][number];
  measurementTemplates: HazardStatsSectionProps['measurementTemplates'];
  totalCount: number;
  withFileData: HazardStatsSectionProps['withFileData'];
}

export function Doc10MeasurementCard({
  applyDocumentUpdate,
  index,
  item,
  measurementTemplates,
  totalCount,
  withFileData,
}: Doc10MeasurementCardProps) {
  const templateOptions = useMemo(
    () => [...measurementTemplates].sort((left, right) => left.sortOrder - right.sortOrder),
    [measurementTemplates],
  );
  const inTemplateList = templateOptions.some(
    (template) => template.instrumentName === item.instrumentType,
  );

  const updateMeasurement = (
    updater: (
      measurement: InspectionSession['document10Measurements'][number],
    ) => InspectionSession['document10Measurements'][number],
  ) => {
    applyDocumentUpdate('doc10', 'manual', (current) => ({
      ...current,
      document10Measurements: current.document10Measurements.map((measurement) =>
        measurement.id === item.id ? updater(measurement) : measurement,
      ),
    }));
  };

  const findMeasurementTemplate = (instrumentType: string) => {
    const normalized = instrumentType.trim().toLowerCase();
    if (!normalized) return null;

    return (
      measurementTemplates.find(
        (template) => template.instrumentName.trim().toLowerCase() === normalized,
      ) ?? null
    );
  };

  return (
    <article className={`${styles.card} ${styles.doc4Card}`}>
      <div className={styles.doc10CardInner}>
        <div
          className={`${styles.doc7Eyebrow} ${
            totalCount > 1 ? styles.doc7EyebrowWithCardDelete : ''
          }`}
        >
          <h3 className={styles.cardTitle}>{`계측 결과 ${index + 1}`}</h3>
        </div>
        <div className={styles.measurementCardBody}>
          <div className={`${styles.formGrid} ${styles.measurementMetaRow}`}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>계측 장비</span>
              <select
                className="app-input"
                value={item.instrumentType}
                onChange={(event) => {
                  const nextInstrumentType = event.target.value;
                  const matchedTemplate = findMeasurementTemplate(nextInstrumentType);

                  updateMeasurement((measurement) => ({
                    ...measurement,
                    instrumentType: nextInstrumentType,
                    safetyCriteria:
                      matchedTemplate?.safetyCriteria ?? measurement.safetyCriteria,
                  }));
                }}
              >
                <option value="">선택</option>
                {item.instrumentType && !inTemplateList ? (
                  <option value={item.instrumentType}>{item.instrumentType}</option>
                ) : null}
                {templateOptions.map((template) => (
                  <option key={template.id} value={template.instrumentName}>
                    {template.instrumentName}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>측정 위치</span>
              <input
                type="text"
                className="app-input"
                value={item.measurementLocation}
                onChange={(event) =>
                  updateMeasurement((measurement) => ({
                    ...measurement,
                    measurementLocation: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className={styles.measurementSplit}>
            <div className={styles.measurementPhotoSlot}>
              <UploadBox
                id={`measurement-photo-${item.id}`}
                label="계측 사진"
                labelLayout="field"
                fieldClearOverlay
                value={item.photoUrl}
                onClear={() =>
                  updateMeasurement((measurement) => ({ ...measurement, photoUrl: '' }))
                }
                onSelect={async (file) =>
                  withFileData(file, (dataUrl) =>
                    updateMeasurement((measurement) => ({ ...measurement, photoUrl: dataUrl })),
                  )
                }
              />
            </div>
            <div className={styles.measurementFieldsCol}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>측정치</span>
                <input
                  type="text"
                  className="app-input"
                  value={item.measuredValue}
                  onChange={(event) =>
                    updateMeasurement((measurement) => ({
                      ...measurement,
                      measuredValue: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>안전기준</span>
                <textarea
                  className={`${styles.tableTextarea} app-textarea`}
                  value={item.safetyCriteria}
                  onChange={(event) =>
                    updateMeasurement((measurement) => ({
                      ...measurement,
                      safetyCriteria: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>조치 여부</span>
                <input
                  type="text"
                  className="app-input"
                  value={item.actionTaken}
                  onChange={(event) =>
                    updateMeasurement((measurement) => ({
                      ...measurement,
                      actionTaken: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </div>
      {totalCount > 1 ? (
        <button
          type="button"
          className={`${styles.inlineDangerButton} ${styles.doc4CardDeleteOverlay}`}
          onClick={() =>
            applyDocumentUpdate('doc10', 'manual', (current) => ({
              ...current,
              document10Measurements: current.document10Measurements.filter(
                (measurement) => measurement.id !== item.id,
              ),
            }))
          }
        >
          삭제
        </button>
      ) : null}
    </article>
  );
}

