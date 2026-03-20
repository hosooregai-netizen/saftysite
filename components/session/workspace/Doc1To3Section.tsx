'use client';

import SignaturePad from '@/components/ui/SignaturePad';
import { Doc3SceneSection } from '@/components/session/workspace/Doc3SceneSection';
import { ACCIDENT_OCCURRENCE_OPTIONS, ACCIDENT_TYPE_OPTIONS, NOTIFICATION_METHOD_OPTIONS, PREVIOUS_IMPLEMENTATION_OPTIONS, WORK_PLAN_ITEMS, WORK_PLAN_STATUS_OPTIONS } from '@/components/session/workspace/constants';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { InfoTable } from '@/components/session/workspace/widgets';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { InspectionSectionKey, WorkPlanCheckKey } from '@/types/inspectionSession';

export function renderDoc1(session: OverviewSectionProps['session']) {
  const snapshot = session.adminSiteSnapshot;
  return (
    <div className={styles.sectionStack}>
      <div className={styles.readonlyBanner}>
        문서 1은 관리자 기준 현장 정보 스냅샷입니다. 현장 사용자는 수정할 수 없습니다.
      </div>
      <div className={styles.infoTableGrid}>
        <InfoTable
          title="현장 정보"
          rows={[
            { label: '현장명', value: snapshot.siteName },
            { label: '사업장관리번호(사업개시번호)', value: snapshot.siteManagementNumber || snapshot.businessStartNumber },
            { label: '공사기간', value: snapshot.constructionPeriod },
            { label: '공사금액', value: snapshot.constructionAmount },
            { label: '책임자', value: snapshot.siteManagerName },
            { label: '연락처(이메일)', value: snapshot.siteContactEmail },
            { label: '현장주소', value: snapshot.siteAddress },
          ]}
        />
        <InfoTable
          title="본사 정보"
          rows={[
            { label: '회사명', value: snapshot.companyName || snapshot.customerName },
            { label: '법인등록번호(사업자등록번호)', value: snapshot.corporationRegistrationNumber || snapshot.businessRegistrationNumber },
            { label: '면허번호', value: snapshot.licenseNumber },
            { label: '연락처', value: snapshot.headquartersContact },
            { label: '본사주소', value: snapshot.headquartersAddress },
          ]}
        />
      </div>
    </div>
  );
}

function updateOverviewField(
  props: OverviewSectionProps,
  key: keyof OverviewSectionProps['session']['document2Overview'],
  value: string,
  source: 'manual' | 'derived' = 'manual'
) {
  props.applyDocumentUpdate('doc2', source, (current) => ({
    ...current,
    document2Overview: { ...current.document2Overview, [key]: value },
  }));
}

export function renderDoc2(props: OverviewSectionProps) {
  const { applyDocumentUpdate, session } = props;
  const updateWorkPlanCheck = (key: WorkPlanCheckKey, value: string) =>
    applyDocumentUpdate('doc2', 'manual', (current) => ({
      ...current,
      document2Overview: {
        ...current.document2Overview,
        workPlanChecks: {
          ...current.document2Overview.workPlanChecks,
          [key]: value as (typeof current.document2Overview.workPlanChecks)[WorkPlanCheckKey],
        },
      },
    }));
  return (
    <div className={styles.sectionStack}>
      <div className={styles.formGrid}>
        {[
          ['실시일', session.document2Overview.guidanceDate, 'guidanceDate', 'date'],
          ['공정율', session.document2Overview.progressRate, 'progressRate', 'text'],
          ['회차', session.document2Overview.visitCount, 'visitCount', 'text'],
          ['총회차', session.document2Overview.totalVisitCount, 'totalVisitCount', 'text'],
          ['담당요원', session.document2Overview.assignee, 'assignee', 'text'],
          ['연락처', session.document2Overview.contact, 'contact', 'text'],
        ].map(([label, value, key, type]) => (
          <label key={String(key)} className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <input type={type} className="app-input" value={String(value)} placeholder={label === '공정율' ? '예: 45%' : undefined} onChange={(event) => updateOverviewField(props, key as keyof typeof session.document2Overview, event.target.value)} />
          </label>
        ))}
        <label className={styles.field}>
          <span className={styles.fieldLabel}>이전기술지도 이행여부</span>
          <select className="app-select" value={session.document2Overview.previousImplementationStatus} onChange={(event) => updateOverviewField(props, 'previousImplementationStatus', event.target.value)}>
            {PREVIOUS_IMPLEMENTATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>지도기관명</span>
          <input type="text" className="app-input" value={session.document2Overview.guidanceAgencyName} readOnly />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>구분</span>
          <input type="text" className="app-input" value={session.document2Overview.constructionType} readOnly />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>통보방법</span>
          <select className="app-select" value={session.document2Overview.notificationMethod} onChange={(event) => updateOverviewField(props, 'notificationMethod', event.target.value)}>
            <option value="">선택</option>
            {NOTIFICATION_METHOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        {session.document2Overview.notificationMethod === 'direct' ? (
          <>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>직접전달 성함</span>
              <input type="text" className="app-input" value={session.document2Overview.notificationRecipientName} onChange={(event) => updateOverviewField(props, 'notificationRecipientName', event.target.value)} />
            </label>
            <div className={`${styles.field} ${styles.fieldWide}`}>
              <SignaturePad label="직접전달 서명" value={session.document2Overview.notificationRecipientSignature} onChange={(nextValue) => updateOverviewField(props, 'notificationRecipientSignature', nextValue)} />
            </div>
          </>
        ) : null}
        {session.document2Overview.notificationMethod === 'other' ? (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>기타 통보방법</span>
            <input type="text" className="app-input" value={session.document2Overview.otherNotificationMethod} onChange={(event) => updateOverviewField(props, 'otherNotificationMethod', event.target.value)} />
          </label>
        ) : null}
      </div>

      <section className={styles.matrixCard}>
        <div className={styles.matrixHeader}><h3 className={styles.matrixTitle}>작업계획서 13종 상태</h3></div>
        <div className={styles.planTable}>
          {WORK_PLAN_ITEMS.map((item) => (
            <div key={item.key} className={styles.planRow}>
              <div className={styles.planLabel}>{item.label}</div>
              <select className="app-select" value={session.document2Overview.workPlanChecks[item.key]} onChange={(event) => updateWorkPlanCheck(item.key, event.target.value)}>
                {WORK_PLAN_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>산업재해 발생유무</span>
          <select className="app-select" value={session.document2Overview.accidentOccurred} onChange={(event) => updateOverviewField(props, 'accidentOccurred', event.target.value)}>
            {ACCIDENT_OCCURRENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>최근 발생일자</span>
          <input type="date" className="app-input" disabled={session.document2Overview.accidentOccurred !== 'yes'} value={session.document2Overview.recentAccidentDate} onChange={(event) => updateOverviewField(props, 'recentAccidentDate', event.target.value)} />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>재해형태</span>
          <select className="app-select" disabled={session.document2Overview.accidentOccurred !== 'yes'} value={session.document2Overview.accidentType} onChange={(event) => updateOverviewField(props, 'accidentType', event.target.value)}>
            <option value="">선택</option>
            {ACCIDENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>재해개요</span>
          <textarea className="app-textarea" disabled={session.document2Overview.accidentOccurred !== 'yes'} value={session.document2Overview.accidentSummary} onChange={(event) => updateOverviewField(props, 'accidentSummary', event.target.value)} />
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>진행공정 및 특이사항</span>
          <textarea className="app-textarea" value={session.document2Overview.processAndNotes} onChange={(event) => updateOverviewField(props, 'processAndNotes', event.target.value)} />
        </label>
      </div>
    </div>
  );
}

export function renderDoc3(props: OverviewSectionProps) {
  return <Doc3SceneSection {...props} />;
}

export function renderOverviewSection(section: InspectionSectionKey, props: OverviewSectionProps) {
  if (section === 'doc1') return renderDoc1(props.session);
  if (section === 'doc2') return renderDoc2(props);
  if (section === 'doc3') return renderDoc3(props);
  return null;
}
