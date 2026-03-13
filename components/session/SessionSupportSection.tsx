import type { SupportItems } from '@/types/inspectionSession';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionSupportSectionProps {
  items: SupportItems;
  onChange: <T extends keyof SupportItems>(field: T, value: SupportItems[T]) => void;
}

export default function SessionSupportSection({
  items,
  onChange,
}: SessionSupportSectionProps) {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionIntro}>
        <p className={styles.sectionIntroLabel}>지원 사항</p>
        <p className={styles.sectionIntroText}>
          현장 지원 내역과 사고 여부를 표지처럼 항목별로 기록합니다.
        </p>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.fieldLabel}>기술자료 배포</label>
          <textarea
            value={items.technicalMaterials}
            onChange={(event) => onChange('technicalMaterials', event.target.value)}
            className="app-textarea"
            placeholder="예: 추락방지 안전작업지침 1부 배포"
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.fieldLabel}>교육 실적</label>
          <textarea
            value={items.educationResults}
            onChange={(event) => onChange('educationResults', event.target.value)}
            className="app-textarea"
            placeholder="예: 신규 작업자 추락방지 교육 실시"
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.fieldLabel}>장비 점검</label>
          <textarea
            value={items.equipmentInspection}
            onChange={(event) => onChange('equipmentInspection', event.target.value)}
            className="app-textarea"
            placeholder="예: 이동식 비계 바퀴 고정상태 확인"
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.fieldLabel}>기타 지원사항</label>
          <textarea
            value={items.otherSupport}
            onChange={(event) => onChange('otherSupport', event.target.value)}
            className="app-textarea"
            placeholder="예: 통로 정리 요청 및 즉시 조치 확인"
          />
        </div>

        <div className={`${styles.formField} ${styles.formFieldWide}`}>
          <div className={styles.statusField}>
            <label className={styles.fieldLabel}>산업재해 발생 유무</label>
            <div className={styles.statusRow}>
              <button
                type="button"
                onClick={() => onChange('accidentOccurred', false)}
                className={[
                  styles.statusButton,
                  !items.accidentOccurred ? styles.statusButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                없음
              </button>
              <button
                type="button"
                onClick={() => onChange('accidentOccurred', true)}
                className={[
                  styles.statusButton,
                  items.accidentOccurred ? styles.statusButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                있음
              </button>
            </div>
          </div>
        </div>

        <div className={`${styles.formField} ${styles.formFieldWide}`}>
          <label className={styles.fieldLabel}>사고 상세 내용</label>
          <textarea
            value={items.accidentNotes}
            onChange={(event) => onChange('accidentNotes', event.target.value)}
            className="app-textarea"
            placeholder="사고 발생 시 일시, 유형, 현재 조치 상태를 적습니다."
          />
        </div>
      </div>
    </div>
  );
}
