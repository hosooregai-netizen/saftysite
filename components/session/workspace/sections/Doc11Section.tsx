import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';

export default function Doc11Section(props: SupportSectionProps) {
  const { applyDocumentUpdate, session, withFileData } = props;

  return (
    <div className={styles.sectionStack}>
      {session.document11EducationRecords.map((item, index) => (
        <article key={item.id} className={`${styles.card} ${styles.doc4Card}`}>
          <div className={styles.doc10CardInner}>
            <div className={styles.doc11EducationPhotoRow}>
              <UploadBox
                id={`education-photo-${item.id}`}
                label="교육 사진"
                labelLayout="field"
                fieldClearOverlay
                value={item.photoUrl}
                onClear={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, photoUrl: '' } : record) }))}
                onSelect={async (file) => withFileData(file, (dataUrl) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, photoUrl: dataUrl } : record) })))}
              />
              <UploadBox
                id={`education-material-${item.id}`}
                label="교육 자료"
                labelLayout="field"
                fieldClearOverlay
                value={item.materialUrl}
                onClear={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, materialUrl: '', materialName: '' } : record) }))}
                onSelect={async (file) => withFileData(file, (dataUrl, selectedFile) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, materialUrl: dataUrl, materialName: selectedFile.name } : record) })))}
              />
            </div>
            {session.document11EducationRecords.length > 1 ? (
              <div className={`${styles.doc7Eyebrow} ${styles.doc7EyebrowWithCardDelete}`}>
                <h3 className={styles.cardTitle}>{`교육 기록 ${index + 1}`}</h3>
              </div>
            ) : null}
            <div className={styles.measurementCardBody}>
              <div className={`${styles.formGrid} ${styles.measurementMetaRow}`}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>참석인원</span>
                  <input type="text" className="app-input" value={item.attendeeCount} onChange={(event) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, attendeeCount: event.target.value } : record) }))} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>교육 주제</span>
                  <input type="text" className="app-input" value={item.topic} onChange={(event) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, topic: event.target.value } : record) }))} />
                </label>
              </div>
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span className={styles.fieldLabel}>교육내용</span>
                  <textarea className="app-textarea" value={item.content} onChange={(event) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, content: event.target.value } : record) }))} />
                </label>
              </div>
            </div>
          </div>
          {session.document11EducationRecords.length > 1 ? (
            <button
              type="button"
              className={`${styles.inlineDangerButton} ${styles.doc4CardDeleteOverlay}`}
              onClick={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.filter((record) => record.id !== item.id) }))}
            >
              삭제
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
