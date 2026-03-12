import type { ChangeEvent } from 'react';
import type { GuidanceStatus, PreviousGuidanceItem } from '@/types/inspectionSession';
import { GUIDANCE_STATUS_OPTIONS } from './sessionUtils';
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

export default function SessionPreviousGuidanceSection({
  items,
  onChange,
  onPhotoChange,
}: SessionPreviousGuidanceSectionProps) {
  const handleStatusChange = (itemId: string, value: GuidanceStatus) => {
    onChange(itemId, { status: value });
  };

  return (
    <div className={styles.sectionStack}>
      {items.length > 0 ? (
        <div className={styles.guidanceList}>
          {items.map((item, index) => (
            <article key={item.id} className={styles.guidanceCard}>
              <div className={styles.guidanceCardHeader}>
                <div>
                  <h3 className={styles.itemTitle}>이전 지도 사항 #{index + 1}</h3>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>과거 위험 항목</label>
                  <input type="text" value={item.title} className="app-input" readOnly />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>이행 상태</label>
                  <div className={styles.statusRow}>
                    {GUIDANCE_STATUS_OPTIONS.map((option) => {
                      const className = [
                        styles.statusButton,
                        item.status === option.value ? styles.statusButtonActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleStatusChange(item.id, option.value)}
                          className={className}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`${styles.formField} ${styles.formFieldWide}`}>
                  <label className={styles.fieldLabel}>과거 현재 위험 데이터</label>
                  <textarea
                    value={item.description}
                    className="app-textarea"
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.photoCompareGrid}>
                <div className={styles.photoCard}>
                  <p className={styles.photoCardTitle}>과거 사진</p>
                  <div className={styles.photoFrame}>
                    {item.previousPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previousPhotoUrl}
                        alt="과거 현재 위험 사진"
                        className={styles.photoPreview}
                      />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        과거 보고서에 등록된 사진이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.photoCard}>
                  <p className={styles.photoCardTitle}>현재 사진</p>
                  <div className={styles.photoFrame}>
                    {item.currentPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.currentPhotoUrl}
                        alt="현재 조치 상태 사진"
                        className={styles.photoPreview}
                      />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        현재 조치 상태 사진을 올려 이행 여부를 남깁니다.
                      </div>
                    )}
                  </div>
                  <div className={styles.photoActions}>
                    <label
                      htmlFor={`${item.id}-current-photo`}
                      className="app-button app-button-secondary"
                    >
                      사진 선택
                    </label>
                    <input
                      id={`${item.id}-current-photo`}
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        onPhotoChange(item.id, 'currentPhotoUrl', event)
                      }
                      className={styles.hiddenInput}
                    />
                  </div>
                </div>
              </div>

              <div className={`${styles.formField} ${styles.formFieldWide}`}>
                <label className={styles.fieldLabel}>비고</label>
                <textarea
                  value={item.note}
                  onChange={(event) => onChange(item.id, { note: event.target.value })}
                  className="app-textarea"
                  placeholder="추가 확인 사항이나 미이행 사유를 기록합니다."
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyPanel}>
          같은 현장의 과거 현재 위험 데이터가 아직 없습니다.
        </div>
      )}
    </div>
  );
}
