'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionDoc2ProcessModalProps {
  applyDoc2ProcessNotesDraft: () => void;
  doc2ProcessError: string | null;
  doc2ProcessNotice: string | null;
  doc2ProcessNoteDraft: string;
  handleDoc2ProcessFieldChange: (
    key:
      | 'processWorkContent'
      | 'processWorkerCount'
      | 'processEquipment'
      | 'processTools'
      | 'processHazardousMaterials',
    value: string,
  ) => void;
  handleGenerateDoc2ProcessNotes: () => Promise<void>;
  isDoc2ProcessModalOpen: boolean;
  isGeneratingDoc2ProcessNotes: boolean;
  session: InspectionSessionDraft;
  setIsDoc2ProcessModalOpen: (open: boolean) => void;
}

export function MobileInspectionSessionDoc2ProcessModal({
  applyDoc2ProcessNotesDraft,
  doc2ProcessError,
  doc2ProcessNotice,
  doc2ProcessNoteDraft,
  handleDoc2ProcessFieldChange,
  handleGenerateDoc2ProcessNotes,
  isDoc2ProcessModalOpen,
  isGeneratingDoc2ProcessNotes,
  session,
  setIsDoc2ProcessModalOpen,
}: MobileInspectionSessionDoc2ProcessModalProps) {
  return (
    <AppModal
      open={isDoc2ProcessModalOpen}
      title="진행공정 및 특이사항 자동생성"
      onClose={() => setIsDoc2ProcessModalOpen(false)}
      size="large"
      verticalAlign="center"
      actions={
        <>
          <button type="button" className="app-button app-button-secondary" onClick={() => setIsDoc2ProcessModalOpen(false)}>
            닫기
          </button>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => void handleGenerateDoc2ProcessNotes()}
            disabled={isGeneratingDoc2ProcessNotes}
          >
            {isGeneratingDoc2ProcessNotes ? 'AI 생성 중' : 'AI 생성'}
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={applyDoc2ProcessNotesDraft}
            disabled={isGeneratingDoc2ProcessNotes}
          >
            본문에 반영
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p className={styles.inlineNotice} style={{ margin: 0 }}>
          공사개요에 필요한 5개 항목을 입력하면, 개요 2줄은 즉시 정리되고 주요 위험 요인
          2줄은 AI로 생성합니다.
        </p>
        {doc2ProcessError ? (
          <p className={styles.errorNotice} style={{ margin: 0 }}>
            {doc2ProcessError}
          </p>
        ) : null}
        {doc2ProcessNotice ? (
          <p className={styles.inlineNotice} style={{ margin: 0 }}>
            {doc2ProcessNotice}
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>작업현재 공정</span>
            <input
              type="text"
              className="app-input"
              value={session.document2Overview.processWorkContent}
              onChange={(event) => handleDoc2ProcessFieldChange('processWorkContent', event.target.value)}
              placeholder="예: 철거작업, 금속작업"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>작업 인원</span>
            <input
              type="text"
              className="app-input"
              value={session.document2Overview.processWorkerCount}
              onChange={(event) => handleDoc2ProcessFieldChange('processWorkerCount', event.target.value)}
              placeholder="예: 6"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>건설기계 장비</span>
            <input
              type="text"
              className="app-input"
              value={session.document2Overview.processEquipment}
              onChange={(event) => handleDoc2ProcessFieldChange('processEquipment', event.target.value)}
              placeholder="예: 트럭, 굴착기"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>유해위험기구</span>
            <input
              type="text"
              className="app-input"
              value={session.document2Overview.processTools}
              onChange={(event) => handleDoc2ProcessFieldChange('processTools', event.target.value)}
              placeholder="예: 핸드브레이커, 용접기"
            />
          </label>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>유해위험물질</span>
          <input
            type="text"
            className="app-input"
            value={session.document2Overview.processHazardousMaterials}
            onChange={(event) => handleDoc2ProcessFieldChange('processHazardousMaterials', event.target.value)}
            placeholder="예: 페인트, LPG, 용접봉"
          />
        </label>
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            padding: '12px',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#334155' }}>
            4줄 미리보기
          </strong>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#475569',
            }}
          >
            {doc2ProcessNoteDraft}
          </pre>
        </div>
      </div>
    </AppModal>
  );
}
