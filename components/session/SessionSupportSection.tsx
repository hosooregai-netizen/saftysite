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
    <div className={styles.supportGrid}>
      <article className={styles.supportCard}>
        <h3 className={styles.supportTitle}>기술자료 배포</h3>
        <p className={styles.supportDescription}>
          배포 자료명, 전달 방식, 수량 등을 기록합니다.
        </p>
        <div className={styles.supportBody}>
          <textarea
            value={items.technicalMaterials}
            onChange={(event) => onChange('technicalMaterials', event.target.value)}
            className="app-textarea"
            placeholder="예: 추락방지 안전작업지침 1부 배포"
          />
        </div>
      </article>

      <article className={styles.supportCard}>
        <h3 className={styles.supportTitle}>교육 실적</h3>
        <p className={styles.supportDescription}>
          TBM, 특별교육, 전달교육 등 현장 교육 내용을 적습니다.
        </p>
        <div className={styles.supportBody}>
          <textarea
            value={items.educationResults}
            onChange={(event) => onChange('educationResults', event.target.value)}
            className="app-textarea"
            placeholder="예: 신규 작업자 추락방지 교육 실시"
          />
        </div>
      </article>

      <article className={styles.supportCard}>
        <h3 className={styles.supportTitle}>장비 점검</h3>
        <p className={styles.supportDescription}>
          장비 상태, 점검 결과, 조치 필요사항을 남깁니다.
        </p>
        <div className={styles.supportBody}>
          <textarea
            value={items.equipmentInspection}
            onChange={(event) => onChange('equipmentInspection', event.target.value)}
            className="app-textarea"
            placeholder="예: 이동식 비계 바퀴 고정상태 확인"
          />
        </div>
      </article>

      <article className={styles.supportCard}>
        <h3 className={styles.supportTitle}>기타 지원사항</h3>
        <p className={styles.supportDescription}>
          사업장 요청사항, 현장 지원 내역, 추가 메모를 기록합니다.
        </p>
        <div className={styles.supportBody}>
          <textarea
            value={items.otherSupport}
            onChange={(event) => onChange('otherSupport', event.target.value)}
            className="app-textarea"
            placeholder="예: 통로 정리 요청 및 즉시 조치 확인"
          />
        </div>
      </article>

      <article className={styles.supportCard}>
        <h3 className={styles.supportTitle}>산업재해 발생 유무</h3>
        <p className={styles.supportDescription}>
          현장 확인 결과를 선택하고 필요한 경우 상세 내용을 적습니다.
        </p>
        <div className={styles.supportBody}>
          <div className={styles.accidentRow}>
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

            <textarea
              value={items.accidentNotes}
              onChange={(event) => onChange('accidentNotes', event.target.value)}
              className="app-textarea"
              placeholder="사고 발생 시 일시, 유형, 현재 조치 상태를 적습니다."
            />
          </div>
        </div>
      </article>
    </div>
  );
}
