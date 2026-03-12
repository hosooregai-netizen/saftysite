import type { DraftState, FutureProcessRiskItem } from '@/types/inspectionSession';
import { DRAFT_OPTIONS } from './sessionUtils';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionFutureRisksSectionProps {
  items: FutureProcessRiskItem[];
  onAdd: () => void;
  onChange: (itemId: string, patch: Partial<FutureProcessRiskItem>) => void;
  onRemove: (itemId: string) => void;
  onStatusChange: (itemId: string, status: DraftState) => void;
}

export default function SessionFutureRisksSection({
  items,
  onAdd,
  onChange,
  onRemove,
  onStatusChange,
}: SessionFutureRisksSectionProps) {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.futureToolbar}>
        <p className={styles.relatedHint}>
          다음 진행 공정을 먼저 적고 예상 위험요인과 대책 초안을 누적합니다.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="app-button app-button-primary"
        >
          공정 항목 추가
        </button>
      </div>

      <div className={styles.futureList}>
        {items.map((item, index) => (
          <article key={item.id} className={styles.futureCard}>
            <div className={styles.futureCardHeader}>
              <div>
                <h3 className={styles.itemTitle}>향후 공정 #{index + 1}</h3>
                <p className={styles.fieldHint}>
                  다음 공정별 예상 위험과 대책을 출력 문서에 맞게 정리합니다.
                </p>
              </div>

              <div className={styles.bottomActions}>
                <div className={styles.statusRow}>
                  {DRAFT_OPTIONS.map((option) => {
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
                        onClick={() => onStatusChange(item.id, option.value)}
                        className={className}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
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
                <label className={styles.fieldLabel}>다음 진행 공정</label>
                <input
                  type="text"
                  value={item.processName}
                  onChange={(event) =>
                    onChange(item.id, { processName: event.target.value })
                  }
                  className="app-input"
                  placeholder="예: 외부 비계 해체 작업"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>예상 위험요인</label>
                <input
                  type="text"
                  value={item.expectedHazard}
                  onChange={(event) =>
                    onChange(item.id, { expectedHazard: event.target.value })
                  }
                  className="app-input"
                  placeholder="예: 추락, 낙하, 협착"
                />
              </div>

              <div className={`${styles.formField} ${styles.formFieldWide}`}>
                <label className={styles.fieldLabel}>대책 초안</label>
                <textarea
                  value={item.countermeasure}
                  onChange={(event) =>
                    onChange(item.id, { countermeasure: event.target.value })
                  }
                  className="app-textarea"
                  placeholder="예상 위험에 대한 사전 조치 계획을 적습니다."
                />
              </div>

              <div className={`${styles.formField} ${styles.formFieldWide}`}>
                <label className={styles.fieldLabel}>비고</label>
                <textarea
                  value={item.note}
                  onChange={(event) => onChange(item.id, { note: event.target.value })}
                  className="app-textarea"
                  placeholder="착수 전 전달할 메모나 확인사항을 적습니다."
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
