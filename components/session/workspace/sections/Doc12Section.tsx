import { ACTIVITY_TYPE_OPTIONS, createActivityRecord } from '@/constants/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';

export default function Doc12Section(props: SupportSectionProps) {
  const { applyDocumentUpdate, session, withFileData } = props;

  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 1건</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc12', 'manual', (current) => ({ ...current, document12Activities: [...current.document12Activities, createActivityRecord()] }))}>
          활동 추가
        </button>
      </div>
      {session.document12Activities.map((item, index) => (
        <article key={item.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <div><div className={styles.cardEyebrow}>활동 실적</div><h3 className={styles.cardTitle}>{`활동 ${index + 1}`}</h3></div>
            {session.document12Activities.length > 1 ? <button type="button" className="app-button app-button-danger" onClick={() => applyDocumentUpdate('doc12', 'manual', (current) => ({ ...current, document12Activities: current.document12Activities.filter((activity) => activity.id !== item.id) }))}>삭제</button> : null}
          </div>
          <div className={styles.formGrid}>
            <UploadBox id={`activity-photo-${item.id}`} label="활동 사진" value={item.photoUrl} onClear={() => applyDocumentUpdate('doc12', 'manual', (current) => ({ ...current, document12Activities: current.document12Activities.map((activity) => activity.id === item.id ? { ...activity, photoUrl: '' } : activity) }))} onSelect={async (file) => withFileData(file, (dataUrl) => applyDocumentUpdate('doc12', 'manual', (current) => ({ ...current, document12Activities: current.document12Activities.map((activity) => activity.id === item.id ? { ...activity, photoUrl: dataUrl } : activity) })))} />
            <div className={styles.sectionStack}>
              <label className={styles.field}><span className={styles.fieldLabel}>활동구분</span><select className="app-select" value={item.activityType} onChange={(event) => applyDocumentUpdate('doc12', 'manual', (current) => ({ ...current, document12Activities: current.document12Activities.map((activity) => activity.id === item.id ? { ...activity, activityType: event.target.value } : activity) }))}><option value="">선택</option>{ACTIVITY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              <label className={styles.field}><span className={styles.fieldLabel}>활동내용</span><textarea className="app-textarea" value={item.content} onChange={(event) => applyDocumentUpdate('doc12', 'manual', (current) => ({ ...current, document12Activities: current.document12Activities.map((activity) => activity.id === item.id ? { ...activity, content: event.target.value } : activity) }))} /></label>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
