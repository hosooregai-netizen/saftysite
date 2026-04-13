'use client';

import type { MutableRefObject } from 'react';
import SignaturePad from '@/components/ui/SignaturePad';
import { NOTIFICATION_METHOD_OPTIONS, PREVIOUS_IMPLEMENTATION_OPTIONS } from '@/components/session/workspace/constants';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { buildAutoReportTitle, parsePositiveRound } from './mobileInspectionSessionHelpers';
import { MobileInspectionSessionStep2ProcessSection } from './MobileInspectionSessionStep2ProcessSection';
import styles from '@/features/mobile/components/MobileShell.module.css';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep2Props {
  directSignatureSectionRef: MutableRefObject<HTMLDivElement | null>;
  onOpenDoc2ProcessModal: () => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep2({
  directSignatureSectionRef,
  onOpenDoc2ProcessModal,
  screen,
  session,
}: MobileInspectionSessionStep2Props) {
  const updateOverview = (patch: Partial<InspectionSessionDraft['document2Overview']>) => {
    screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
      ...current,
      document2Overview: { ...current.document2Overview, ...patch },
    }));
  };

  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>기술지도 개요</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>지도일</span>
              <input className="app-input" type="date" value={session.document2Overview.guidanceDate} onChange={(event) => updateOverview({ guidanceDate: event.target.value })} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>공정률 (%)</span>
              <input className="app-input" type="number" value={session.document2Overview.progressRate} onChange={(event) => updateOverview({ progressRate: event.target.value })} placeholder="0" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>회차</span>
              <input
                className="app-input"
                type="number"
                min={1}
                step={1}
                value={session.document2Overview.visitCount || String(session.reportNumber || '')}
                onChange={(event) => {
                  const value = event.target.value;
                  screen.applyDocumentUpdate('doc2', 'manual', (current) => {
                    const nextRound = parsePositiveRound(value);
                    if (!nextRound) {
                      return { ...current, document2Overview: { ...current.document2Overview, visitCount: value } };
                    }
                    const preferredDate = current.document2Overview.guidanceDate.trim() || current.meta.reportDate.trim();
                    const currentTitle = current.meta.reportTitle.trim();
                    const autoTitleCandidates = new Set([
                      buildAutoReportTitle(preferredDate, current.reportNumber),
                      buildAutoReportTitle(current.meta.reportDate.trim(), current.reportNumber),
                      `보고서 ${current.reportNumber}`,
                    ]);
                    return {
                      ...current,
                      reportNumber: nextRound,
                      meta: {
                        ...current.meta,
                        reportTitle: autoTitleCandidates.has(currentTitle) ? buildAutoReportTitle(preferredDate, nextRound) : current.meta.reportTitle,
                      },
                      document2Overview: { ...current.document2Overview, visitCount: String(nextRound) },
                    };
                  });
                }}
                placeholder="1"
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>총회차</span>
              <input className="app-input" value={session.document2Overview.totalVisitCount} onChange={(event) => updateOverview({ totalVisitCount: event.target.value })} placeholder="예: 12" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>이전기술지도 이행</span>
              <select className="app-select" value={session.document2Overview.previousImplementationStatus} onChange={(event) => updateOverview({ previousImplementationStatus: event.target.value as typeof session.document2Overview.previousImplementationStatus })}>
                {PREVIOUS_IMPLEMENTATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>담당자</span>
              <input className="app-input" value={session.document2Overview.assignee} onChange={(event) => updateOverview({ assignee: event.target.value })} placeholder="담당자 이름" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>연락처</span>
              <input className="app-input" value={session.document2Overview.contact} onChange={(event) => updateOverview({ contact: event.target.value })} placeholder="연락처를 입력하세요" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>통지 방법</span>
              <select className="app-select" value={session.document2Overview.notificationMethod} onChange={(event) => updateOverview({ notificationMethod: event.target.value as 'direct' | 'registered_mail' | 'email' | 'mobile' | 'other' | '' })}>
                <option value="">선택</option>
                {NOTIFICATION_METHOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          {session.document2Overview.notificationMethod === 'other' ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>기타 통보방법</span>
              <input className="app-input" value={session.document2Overview.otherNotificationMethod} onChange={(event) => updateOverview({ otherNotificationMethod: event.target.value })} placeholder="기타 통보방법 입력" />
            </label>
          ) : null}
          {session.document2Overview.notificationMethod === 'direct' ? (
            <div ref={directSignatureSectionRef} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>직접전달 수령자 성함</span>
                <input className="app-input" value={session.document2Overview.notificationRecipientName} onChange={(event) => updateOverview({ notificationRecipientName: event.target.value })} placeholder="수령자 성함 입력" />
              </label>
              <SignaturePad label="수령자 서명" value={session.document2Overview.notificationRecipientSignature} onChange={(value) => updateOverview({ notificationRecipientSignature: value })} />
            </div>
          ) : null}
          <MobileInspectionSessionStep2ProcessSection onOpenDoc2ProcessModal={onOpenDoc2ProcessModal} screen={screen} session={session} />
        </div>
      </div>
    </section>
  );
}
