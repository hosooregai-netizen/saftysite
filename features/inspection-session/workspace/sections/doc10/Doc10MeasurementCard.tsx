import { useMemo } from 'react';

import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { UploadBox } from '@/components/session/workspace/widgets';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';
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
          <div className={styles.measurementSplit}>
            <div className={`${styles.tableCard} ${styles.doc10PhotoTableWrap}`}>
              <table className={styles.doc10PhotoTable}>
                <thead>
                  <tr>
                    <th scope="col">계측 사진</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.doc10PhotoCell}>
                      <div className={styles.doc10PhotoUpload}>
                        <UploadBox
                          id={`measurement-photo-${item.id}`}
                          label=""
                          labelLayout="field"
                          fieldClearOverlay
                          value={item.photoUrl}
                          onClear={() =>
                            updateMeasurement((measurement) => ({ ...measurement, photoUrl: '' }))
                          }
                          onSelect={async (file) =>
                            withFileData(file, (dataUrl) =>
                              updateMeasurement((measurement) => ({
                                ...measurement,
                                photoUrl: dataUrl,
                              })),
                            )
                          }
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={`${styles.tableCard} ${styles.doc10InfoTableWrap}`}>
              <table className={styles.doc10InfoTable}>
                <colgroup>
                  <col className={styles.doc10InfoLabelCol} />
                  <col className={styles.doc10InfoValueCol} />
                  <col className={styles.doc10InfoLabelCol} />
                  <col className={styles.doc10InfoValueCol} />
                </colgroup>
                <tbody>
                  <tr>
                    <th scope="row">계측 장비</th>
                    <td>
                      <select
                        className={`${styles.doc10CellControl} app-input`}
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
                    </td>
                    <th scope="row">측정 위치</th>
                    <td>
                      <input
                        type="text"
                        className={`${styles.doc10CellControl} app-input`}
                        value={item.measurementLocation}
                        onChange={(event) =>
                          updateMeasurement((measurement) => ({
                            ...measurement,
                            measurementLocation: event.target.value,
                          }))
                        }
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">측정치</th>
                    <td>
                      <input
                        type="text"
                        className={`${styles.doc10CellControl} app-input`}
                        value={item.measuredValue}
                        onChange={(event) =>
                          updateMeasurement((measurement) => ({
                            ...measurement,
                            measuredValue: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <th scope="row">조치 여부</th>
                    <td>
                      <input
                        type="text"
                        className={`${styles.doc10CellControl} app-input`}
                        value={item.actionTaken}
                        onChange={(event) =>
                          updateMeasurement((measurement) => ({
                            ...measurement,
                            actionTaken: event.target.value,
                          }))
                        }
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">안전기준</th>
                    <td colSpan={3} className={styles.doc10SafetyCell}>
                      <textarea
                        className={`${styles.doc10CellTextarea} app-textarea`}
                        value={item.safetyCriteria}
                        onChange={(event) =>
                          updateMeasurement((measurement) => ({
                            ...measurement,
                            safetyCriteria: event.target.value,
                          }))
                        }
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
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
