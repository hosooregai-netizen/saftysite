import { createPreviousGuidanceFollowUpItem } from '@/constants/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';

export default function Doc4Section(props: OverviewSectionProps) {
  const { applyDocumentUpdate, correctionResultOptions, session, withFileData } = props;

  return (
    <div className={`${styles.sectionStack} ${styles.doc4SectionStack}`}>
      <div className={`${styles.sectionToolbar} ${styles.doc4Toolbar}`}>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: [...current.document4FollowUps, createPreviousGuidanceFollowUpItem({ confirmationDate: current.meta.reportDate })] }))}>
          이행여부 추가
        </button>
      </div>
      {session.document4FollowUps.length === 0 ? (
        <div className={styles.doc4EmptyState} role="status">
          이전 기술지도 사항이 없습니다
        </div>
      ) : null}
      {session.document4FollowUps.map((item) => {
        const isDerived = Boolean(item.sourceSessionId && item.sourceFindingId);
        const canRemove = !isDerived;
        const updateField = (key: 'location' | 'guidanceDate' | 'confirmationDate' | 'result' | 'beforePhotoUrl' | 'afterPhotoUrl', value: string) => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: current.document4FollowUps.map((followUp) => followUp.id === item.id ? { ...followUp, [key]: value } : followUp) }));

        return (
          <article key={item.id} className={`${styles.card} ${styles.doc4Card}`}>
            <div className={`${styles.cardHeader} ${styles.doc4CardHeader}`}>
              {isDerived ? <div className={styles.cardEyebrow}>이전 보고서 연동</div> : <div aria-hidden className={styles.doc4CardHeaderSpacer} />}
              {canRemove ? (
                <button type="button" className={`app-button app-button-danger ${styles.doc4CardDeleteBtn}`} onClick={() => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: current.document4FollowUps.filter((followUp) => followUp.id !== item.id) }))}>
                  삭제
                </button>
              ) : null}
            </div>
            <div className={styles.doc4MetaRow}>
              {[['유해·위험장소', item.location, 'location'], ['지도일', item.guidanceDate, 'guidanceDate'], ['확인일', item.confirmationDate, 'confirmationDate']].map(([label, value, key]) => (
                <label key={String(key)} className={styles.field}>
                  <span className={styles.fieldLabel}>{label}</span>
                  <input type={key === 'location' ? 'text' : 'date'} className="app-input" value={String(value)} readOnly={isDerived && key === 'guidanceDate'} onChange={(event) => updateField(key as 'location' | 'guidanceDate' | 'confirmationDate', event.target.value)} />
                </label>
              ))}
            </div>
            <div className={styles.doc4PhotoRow}>
              <UploadBox id={`follow-up-before-${item.id}`} label="시정 전 사진" labelLayout="field" value={item.beforePhotoUrl} onClear={isDerived ? undefined : () => updateField('beforePhotoUrl', '')} onSelect={async (file) => { if (!isDerived) await withFileData(file, (dataUrl) => updateField('beforePhotoUrl', dataUrl)); }} />
              <UploadBox id={`follow-up-after-${item.id}`} label="시정 후 사진" labelLayout="field" value={item.afterPhotoUrl} onClear={() => updateField('afterPhotoUrl', '')} onSelect={async (file) => withFileData(file, (dataUrl) => updateField('afterPhotoUrl', dataUrl))} />
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
