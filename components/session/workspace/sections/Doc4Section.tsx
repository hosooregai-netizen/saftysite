import { createPreviousGuidanceFollowUpItem } from '@/constants/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';

export default function Doc4Section(props: OverviewSectionProps) {
  const { applyDocumentUpdate, correctionResultOptions, session, withFileData } = props;

  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 3블록</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: [...current.document4FollowUps, createPreviousGuidanceFollowUpItem({ confirmationDate: current.meta.reportDate })] }))}>
          블록 추가
        </button>
      </div>
      {session.document4FollowUps.map((item, index) => {
        const isDerived = Boolean(item.sourceSessionId && item.sourceFindingId);
        const canRemove = !isDerived && session.document4FollowUps.length > 3;
        const updateField = (key: 'location' | 'guidanceDate' | 'confirmationDate' | 'result' | 'beforePhotoUrl' | 'afterPhotoUrl', value: string) => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: current.document4FollowUps.map((followUp) => followUp.id === item.id ? { ...followUp, [key]: value } : followUp) }));

        return (
          <article key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div><div className={styles.cardEyebrow}>{isDerived ? '이전 보고서 연동' : '수동 블록'}</div><h3 className={styles.cardTitle}>{`후속조치 ${index + 1}`}</h3></div>
              {canRemove ? <button type="button" className="app-button app-button-danger" onClick={() => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: current.document4FollowUps.filter((followUp) => followUp.id !== item.id) }))}>삭제</button> : null}
            </div>
            <div className={styles.formGrid}>
              {[['유해·위험장소', item.location, 'location'], ['지도일', item.guidanceDate, 'guidanceDate'], ['확인일', item.confirmationDate, 'confirmationDate']].map(([label, value, key]) => (
                <label key={String(key)} className={styles.field}>
                  <span className={styles.fieldLabel}>{label}</span>
                  <input type={key === 'location' ? 'text' : 'date'} className="app-input" value={String(value)} readOnly={isDerived && key === 'guidanceDate'} onChange={(event) => updateField(key as 'location' | 'guidanceDate' | 'confirmationDate', event.target.value)} />
                </label>
              ))}
            </div>
            <div className={styles.dualUploadGrid}>
              <UploadBox id={`follow-up-before-${item.id}`} label="시정 전 사진" value={item.beforePhotoUrl} onClear={isDerived ? undefined : () => updateField('beforePhotoUrl', '')} onSelect={async (file) => { if (!isDerived) await withFileData(file, (dataUrl) => updateField('beforePhotoUrl', dataUrl)); }} />
              <UploadBox id={`follow-up-after-${item.id}`} label="시정 후 사진" value={item.afterPhotoUrl} onClear={() => updateField('afterPhotoUrl', '')} onSelect={async (file) => withFileData(file, (dataUrl) => updateField('afterPhotoUrl', dataUrl))} />
            </div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>시정조치 결과</span>
              <input type="text" list={`correction-result-options-${item.id}`} className="app-input" value={item.result} onChange={(event) => updateField('result', event.target.value)} />
              {correctionResultOptions.length > 0 ? <datalist id={`correction-result-options-${item.id}`}>{correctionResultOptions.map((option) => <option key={option} value={option} />)}</datalist> : null}
            </label>
          </article>
        );
      })}
    </div>
  );
}
