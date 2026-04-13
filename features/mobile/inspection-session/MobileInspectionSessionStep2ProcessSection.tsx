'use client';

import { ACCIDENT_OCCURRENCE_OPTIONS } from '@/components/session/workspace/constants';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep2ProcessSectionProps {
  onOpenDoc2ProcessModal: () => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep2ProcessSection({
  onOpenDoc2ProcessModal,
  screen,
  session,
}: MobileInspectionSessionStep2ProcessSectionProps) {
  const updateOverview = (
    patch: Partial<InspectionSessionDraft['document2Overview']>,
  ) => {
    screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
      ...current,
      document2Overview: { ...current.document2Overview, ...patch },
    }));
  };

  return (
    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>재해 및 공정 특이사항</div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>최근 사고 발생 여부</span>
        <select className="app-select" value={session.document2Overview.accidentOccurred || 'no'} onChange={(event) => updateOverview({ accidentOccurred: event.target.value as 'yes' | 'no' })}>
          {ACCIDENT_OCCURRENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      {session.document2Overview.accidentOccurred === 'yes' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>최근 사고일</span>
              <input className="app-input" type="date" value={session.document2Overview.recentAccidentDate} onChange={(event) => updateOverview({ recentAccidentDate: event.target.value })} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>사고 유형</span>
              <input className="app-input" value={session.document2Overview.accidentType} onChange={(event) => updateOverview({ accidentType: event.target.value })} placeholder="예: 떨어짐" />
            </label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>사고 개요</span>
            <textarea className="app-input" value={session.document2Overview.accidentSummary} onChange={(event) => updateOverview({ accidentSummary: event.target.value })} placeholder="사고 내용을 입력하세요" style={{ width: '100%', minHeight: '72px', resize: 'vertical' }} />
          </label>
        </>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>진행공정 및 특이사항</div>
        <button type="button" className={workspaceStyles.doc5SummaryDraftBtn} style={{ flexShrink: 0 }} onClick={onOpenDoc2ProcessModal}>
          자동생성
        </button>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>본문</span>
        <textarea className="app-input" value={session.document2Overview.processAndNotes} onChange={(event) => updateOverview({ processAndNotes: event.target.value })} placeholder="공정 특이사항을 입력하세요" style={{ width: '100%', minHeight: '96px', resize: 'vertical' }} />
      </label>
    </div>
  );
}
