import { useMemo } from 'react';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';

export default function Doc10Section({
  applyDocumentUpdate,
  measurementTemplates,
  session,
  withFileData,
}: Pick<HazardStatsSectionProps, 'applyDocumentUpdate' | 'measurementTemplates' | 'session' | 'withFileData'>) {
  const templateOptions = useMemo(
    () =>
      [...measurementTemplates].sort((left, right) => left.sortOrder - right.sortOrder),
    [measurementTemplates],
  );

  const findMeasurementTemplate = (instrumentType: string) => {
    const normalized = instrumentType.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    return (
      measurementTemplates.find(
        (template) => template.instrumentName.trim().toLowerCase() === normalized,
      ) ?? null
    );
  };

  return (
    <div className={styles.sectionStack}>
      <p className={styles.fieldAssist}>
        관리자 콘텐츠의 `계측 점검 템플릿`에 등록된 장비명을 선택하면 안전 기준이 자동으로 채워지고, 이후에는 직접 수정할 수 있습니다.
      </p>
      {session.document10Measurements.map((item, index) => {
        const inTemplateList = templateOptions.some((t) => t.instrumentName === item.instrumentType);
        return (
        <article key={item.id} className={`${styles.card} ${styles.doc4Card}`}>
          <div className={styles.doc10CardInner}>
            <div
              className={`${styles.doc7Eyebrow} ${session.document10Measurements.length > 1 ? styles.doc7EyebrowWithCardDelete : ''}`}
            >
              <h3 className={styles.cardTitle}>{`계측 결과${index + 1}`}</h3>
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
                    applyDocumentUpdate('doc10', 'manual', (current) => ({
                      ...current,
                      document10Measurements: current.document10Measurements.map((measurement) =>
                        measurement.id === item.id
                          ? {
                              ...measurement,
                              instrumentType: nextInstrumentType,
                              safetyCriteria: matchedTemplate?.safetyCriteria ?? measurement.safetyCriteria,
                            }
                          : measurement,
                      ),
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
                    applyDocumentUpdate('doc10', 'manual', (current) => ({
                      ...current,
                      document10Measurements: current.document10Measurements.map((measurement) =>
                        measurement.id === item.id ? { ...measurement, measurementLocation: event.target.value } : measurement,
                      ),
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
                    applyDocumentUpdate('doc10', 'manual', (current) => ({
                      ...current,
                      document10Measurements: current.document10Measurements.map((measurement) =>
                        measurement.id === item.id ? { ...measurement, photoUrl: '' } : measurement,
                      ),
                    }))
                  }
                  onSelect={async (file) =>
                    withFileData(file, (dataUrl) =>
                      applyDocumentUpdate('doc10', 'manual', (current) => ({
                        ...current,
                        document10Measurements: current.document10Measurements.map((measurement) =>
                          measurement.id === item.id ? { ...measurement, photoUrl: dataUrl } : measurement,
                        ),
                      })),
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
                      applyDocumentUpdate('doc10', 'manual', (current) => ({
                        ...current,
                        document10Measurements: current.document10Measurements.map((measurement) =>
                          measurement.id === item.id ? { ...measurement, measuredValue: event.target.value } : measurement,
                        ),
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
                      applyDocumentUpdate('doc10', 'manual', (current) => ({
                        ...current,
                        document10Measurements: current.document10Measurements.map((measurement) =>
                          measurement.id === item.id ? { ...measurement, safetyCriteria: event.target.value } : measurement,
                        ),
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
                      applyDocumentUpdate('doc10', 'manual', (current) => ({
                        ...current,
                        document10Measurements: current.document10Measurements.map((measurement) =>
                          measurement.id === item.id ? { ...measurement, actionTaken: event.target.value } : measurement,
                        ),
                      }))
                    }
                  />
                </label>
              </div>
            </div>
            </div>
          </div>
          {session.document10Measurements.length > 1 ? (
            <button
              type="button"
              className={`${styles.inlineDangerButton} ${styles.doc4CardDeleteOverlay}`}
              onClick={() =>
                applyDocumentUpdate('doc10', 'manual', (current) => ({
                  ...current,
                  document10Measurements: current.document10Measurements.filter((measurement) => measurement.id !== item.id),
                }))
              }
            >
              삭제
            </button>
          ) : null}
        </article>
        );
      })}
    </div>
  );
}
