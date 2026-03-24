import { createSafetyEducationRecord } from '@/constants/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';

export default function Doc11Section(props: SupportSectionProps) {
  const { applyDocumentUpdate, session, withFileData } = props;

  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 1건</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: [...current.document11EducationRecords, createSafetyEducationRecord()] }))}>
          교육 기록 추가
        </button>
      </div>
      {session.document11EducationRecords.map((item, index) => (
        <article key={item.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <div><div className={styles.cardEyebrow}>안전교육</div><h3 className={styles.cardTitle}>{`교육 ${index + 1}`}</h3></div>
            {session.document11EducationRecords.length > 1 ? <button type="button" className="app-button app-button-danger" onClick={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.filter((record) => record.id !== item.id) }))}>삭제</button> : null}
          </div>
          <div className={styles.dualUploadGrid}>
            <UploadBox id={`education-photo-${item.id}`} label="교육 사진" value={item.photoUrl} onClear={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, photoUrl: '' } : record) }))} onSelect={async (file) => withFileData(file, (dataUrl) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, photoUrl: dataUrl } : record) })))} />
            <UploadBox id={`education-material-${item.id}`} label="교육 자료" value={item.materialUrl} fileName={item.materialName} mode="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" onClear={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, materialUrl: '', materialName: '' } : record) }))} onSelect={async (file) => withFileData(file, (dataUrl, selectedFile) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, materialUrl: dataUrl, materialName: selectedFile.name } : record) })))} />
          </div>
          <div className={styles.formGrid}>
            <label className={styles.field}><span className={styles.fieldLabel}>참석인원</span><input type="text" className="app-input" value={item.attendeeCount} onChange={(event) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, attendeeCount: event.target.value } : record) }))} /></label>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>교육내용</span><textarea className="app-textarea" value={item.content} onChange={(event) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, content: event.target.value } : record) }))} /></label>
          </div>
        </article>
      ))}
    </div>
  );
}
