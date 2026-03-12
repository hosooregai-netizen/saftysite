import type { InspectionCover } from '@/types/inspectionSession';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionCoverSectionProps {
  cover: InspectionCover;
  onChange: (field: keyof InspectionCover, value: string) => void;
}

export default function SessionCoverSection({
  cover,
  onChange,
}: SessionCoverSectionProps) {
  return (
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label className={styles.fieldLabel} htmlFor="businessName">
          사업장명
        </label>
        <input
          id="businessName"
          type="text"
          value={cover.businessName}
          onChange={(event) => onChange('businessName', event.target.value)}
          className="app-input"
          placeholder="예: OO건설 남양주 현장"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.fieldLabel} htmlFor="projectName">
          공사명
        </label>
        <input
          id="projectName"
          type="text"
          value={cover.projectName}
          onChange={(event) => onChange('projectName', event.target.value)}
          className="app-input"
          placeholder="예: 지하주차장 증축공사"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.fieldLabel} htmlFor="inspectionDate">
          점검일
        </label>
        <input
          id="inspectionDate"
          type="date"
          value={cover.inspectionDate}
          onChange={(event) => onChange('inspectionDate', event.target.value)}
          className="app-input"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.fieldLabel} htmlFor="consultantName">
          담당 컨설턴트
        </label>
        <input
          id="consultantName"
          type="text"
          value={cover.consultantName}
          onChange={(event) => onChange('consultantName', event.target.value)}
          className="app-input"
          placeholder="예: 홍길동"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.fieldLabel} htmlFor="siteAddress">
          현장 주소
        </label>
        <input
          id="siteAddress"
          type="text"
          value={cover.siteAddress}
          onChange={(event) => onChange('siteAddress', event.target.value)}
          className="app-input"
          placeholder="예: 경기도 남양주시 ..."
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.fieldLabel} htmlFor="contractorName">
          시공사
        </label>
        <input
          id="contractorName"
          type="text"
          value={cover.contractorName}
          onChange={(event) => onChange('contractorName', event.target.value)}
          className="app-input"
          placeholder="예: OO건설"
        />
      </div>

      <div className={`${styles.formField} ${styles.formFieldWide}`}>
        <label className={styles.fieldLabel} htmlFor="processSummary">
          공정 개요
        </label>
        <textarea
          id="processSummary"
          value={cover.processSummary}
          onChange={(event) => onChange('processSummary', event.target.value)}
          className="app-textarea"
          placeholder="현재 진행 공정과 현장 상태를 짧게 정리합니다."
        />
      </div>

      <div className={`${styles.formField} ${styles.formFieldWide}`}>
        <label className={styles.fieldLabel} htmlFor="coverNotes">
          메모
        </label>
        <textarea
          id="coverNotes"
          value={cover.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          className="app-textarea"
          placeholder="출력 전 확인할 특이사항이나 현장 메모를 남깁니다."
        />
      </div>
    </div>
  );
}
