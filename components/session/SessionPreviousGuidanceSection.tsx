import type { ChangeEvent } from 'react';
import type { GuidanceStatus, PreviousGuidanceItem } from '@/types/inspectionSession';
import { GUIDANCE_STATUS_OPTIONS } from './sessionUtils';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionPreviousGuidanceSectionProps {
  items: PreviousGuidanceItem[];
  relatedSessionsCount: number;
  canImport: boolean;
  onImportLatest: () => void;
  onAdd: () => void;
  onChange: (itemId: string, patch: Partial<PreviousGuidanceItem>) => void;
  onPhotoChange: (
    itemId: string,
    field: 'previousPhotoUrl' | 'currentPhotoUrl',
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onRemove: (itemId: string) => void;
}

export default function SessionPreviousGuidanceSection({
  items,
  relatedSessionsCount,
  canImport,
  onImportLatest,
  onAdd,
  onChange,
  onPhotoChange,
  onRemove,
}: SessionPreviousGuidanceSectionProps) {
  const handleStatusChange = (itemId: string, value: GuidanceStatus) => {
    onChange(itemId, { status: value });
  };

  return (
    <div className={styles.sectionStack}>
      <div className={styles.guidanceToolbar}>
        <p className={styles.relatedHint}>
          같은 사업장 기준 과거 세션 {relatedSessionsCount}건을 참조할 수 있습니다.
        </p>
        <div className={styles.bottomActions}>
          {canImport && (
            <button
              type="button"
              onClick={onImportLatest}
              className="app-button app-button-secondary"
            >
              최근 지적사항 불러오기
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            className="app-button app-button-primary"
          >
            항목 추가
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className={styles.guidanceList}>
          {items.map((item, index) => (
            <article key={item.id} className={styles.guidanceCard}>
              <div className={styles.guidanceCardHeader}>
                <div>
                  <h3 className={styles.itemTitle}>이전 지적사항 #{index + 1}</h3>
                  <p className={styles.fieldHint}>
                    과거 지적 내용과 현재 이행 상태를 함께 기록합니다.
                  </p>
                </div>

                <div className={styles.bottomActions}>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="app-button app-button-secondary"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>지적사항 제목</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(event) =>
                      onChange(item.id, { title: event.target.value })
                    }
                    className="app-input"
                    placeholder="예: 개구부 방호 미설치"
                  />
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
                  <label className={styles.fieldLabel}>지적 내용</label>
                  <textarea
                    value={item.description}
                    onChange={(event) =>
                      onChange(item.id, { description: event.target.value })
                    }
                    className="app-textarea"
                    placeholder="과거 기술지도 시 지적했던 내용을 적습니다."
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
                        alt="과거 지적 사진"
                        className={styles.photoPreview}
                      />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        과거 사진을 등록해 비교 기준을 남깁니다.
                      </div>
                    )}
                  </div>
                  <div className={styles.photoActions}>
                    <label
                      htmlFor={`${item.id}-previous-photo`}
                      className="app-button app-button-secondary"
                    >
                      사진 선택
                    </label>
                    <input
                      id={`${item.id}-previous-photo`}
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        onPhotoChange(item.id, 'previousPhotoUrl', event)
                      }
                      className={styles.hiddenInput}
                    />
                  </div>
                </div>

                <div className={styles.photoCard}>
                  <p className={styles.photoCardTitle}>현재 사진</p>
                  <div className={styles.photoFrame}>
                    {item.currentPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.currentPhotoUrl}
                        alt="현재 이행 상태 사진"
                        className={styles.photoPreview}
                      />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        현재 상태 사진을 올려 이행 여부를 남깁니다.
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
                  placeholder="추가 확인사항이나 미이행 사유를 적습니다."
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyPanel}>
          이전 지적사항 항목이 없습니다. 필요하면 수동으로 추가하거나 같은 사업장
          과거 세션에서 불러올 수 있습니다.
        </div>
      )}
    </div>
  );
}
