import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';

export default function Doc4Section(props: OverviewSectionProps) {
  const { applyDocumentUpdate, correctionResultOptions, session, withFileData } = props;

  return (
    <div className={`${styles.sectionStack} ${styles.doc4SectionStack}`}>
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
            <div className={`${styles.doc4CardInner} ${isDerived ? styles.doc4CardInnerWithEyebrow : ''}`}>
              {isDerived ? (
                <div className={styles.doc4DerivedEyebrow}>
                  <span className={styles.cardEyebrow}>이전 보고서 연동</span>
                </div>
              ) : null}
              <div className={styles.doc4MetaBundle}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>유해·위험장소</span>
                  <input type="text" className="app-input" value={item.location} onChange={(event) => updateField('location', event.target.value)} />
                </label>
                <div className={styles.doc4MetaBundleRow2}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>지도일</span>
                    <input type="date" className="app-input" value={item.guidanceDate} readOnly={isDerived} onChange={(event) => updateField('guidanceDate', event.target.value)} />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>확인일</span>
                    <input type="date" className="app-input" value={item.confirmationDate} onChange={(event) => updateField('confirmationDate', event.target.value)} />
                  </label>
                </div>
                <label className={`${styles.field} ${styles.doc4ResultField}`}>
                  <span className={styles.fieldLabel}>시정조치 결과</span>
                  <input type="text" list={`correction-result-options-${item.id}`} className="app-input" value={item.result} onChange={(event) => updateField('result', event.target.value)} />
                  {correctionResultOptions.length > 0 ? <datalist id={`correction-result-options-${item.id}`}>{correctionResultOptions.map((option) => <option key={option} value={option} />)}</datalist> : null}
                </label>
              </div>
              <div className={styles.doc4PhotoRow}>
                <UploadBox id={`follow-up-before-${item.id}`} label="시정 전 사진" labelLayout="field" value={item.beforePhotoUrl} onClear={isDerived ? undefined : () => updateField('beforePhotoUrl', '')} onSelect={async (file) => { if (!isDerived) await withFileData(file, (dataUrl) => updateField('beforePhotoUrl', dataUrl)); }} />
                <UploadBox id={`follow-up-after-${item.id}`} label="시정 후 사진" labelLayout="field" value={item.afterPhotoUrl} onClear={() => updateField('afterPhotoUrl', '')} onSelect={async (file) => withFileData(file, (dataUrl) => updateField('afterPhotoUrl', dataUrl))} />
              </div>
            </div>
            {canRemove ? (
              <button type="button" className={`${styles.inlineDangerButton} ${styles.doc4CardDeleteOverlay}`} onClick={() => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: current.document4FollowUps.filter((followUp) => followUp.id !== item.id) }))}>
                삭제
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

