import AppModal from '@/components/ui/AppModal';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { FieldInput } from './QuarterlyFieldControls';

export function QuarterlyDocumentInfoModal(props: {
  open: boolean;
  draft: QuarterlySummaryReport;
  onClose: () => void;
  onChange: (field: 'drafter' | 'reviewer' | 'approver', value: string) => void;
}) {
  const { draft, onChange, onClose, open } = props;

  return (
    <AppModal
      open={open}
      title="문서 정보"
      size="large"
      onClose={onClose}
      actions={
        <button
          type="button"
          className="app-button app-button-primary"
          onClick={onClose}
        >
          완료
        </button>
      }
    >
      <div className={operationalStyles.snapshotSectionGrid}>
        <div className={operationalStyles.documentHeading}>
          <strong className={operationalStyles.documentTitle}>{draft.title}</strong>
          <p className={operationalStyles.documentSubtitle}>
            표지 결재란에 들어갈 담당, 검토, 승인 정보를 관리합니다.
          </p>
        </div>
        <div className={operationalStyles.periodFieldGrid}>
          <FieldInput
            label="담당"
            value={draft.drafter}
            onChange={(value) => onChange('drafter', value)}
            placeholder="예: 홍길동"
          />
          <FieldInput
            label="검토"
            value={draft.reviewer}
            onChange={(value) => onChange('reviewer', value)}
            placeholder="예: 김검토"
          />
          <FieldInput
            label="승인"
            value={draft.approver}
            onChange={(value) => onChange('approver', value)}
            placeholder="예: 이승인"
          />
        </div>
      </div>
    </AppModal>
  );
}

export function QuarterlyTitleEditorModal(props: {
  open: boolean;
  titleDraft: string;
  onClose: () => void;
  onApply: () => void;
  onChangeTitleDraft: (value: string) => void;
}) {
  return (
    <AppModal
      open={props.open}
      title="보고서 제목 수정"
      onClose={props.onClose}
      actions={
        <>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={props.onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={props.onApply}
            disabled={!props.titleDraft.trim()}
          >
            저장
          </button>
        </>
      }
    >
      <FieldInput
        label="보고서 제목"
        value={props.titleDraft}
        onChange={props.onChangeTitleDraft}
        placeholder="예: 2026년 2분기 종합보고서"
      />
    </AppModal>
  );
}
