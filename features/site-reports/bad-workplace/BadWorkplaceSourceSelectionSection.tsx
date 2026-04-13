import operationalStyles from '@/components/site/OperationalReports.module.css';
import { getSessionGuidanceDate, getSessionTitle } from '@/constants/inspectionSession';
import {
  countDocument7FindingsForDisplay,
  formatSessionProgressRateDisplay,
} from '@/lib/erpReports/badWorkplace';
import type { BadWorkplaceReport } from '@/types/erpReports';
import type { InspectionSession } from '@/types/inspectionSession';
import { getBadWorkplaceSourceModeLabel } from './badWorkplaceHelpers';

interface BadWorkplaceSourceSelectionSectionProps {
  draft: BadWorkplaceReport;
  onChangeSourceMode: (sourceMode: BadWorkplaceReport['sourceMode']) => void;
  onOpenSelector: () => void;
  selectedSession: InspectionSession | null;
  siteSessions: InspectionSession[];
}

export function BadWorkplaceSourceSelectionSection({
  draft,
  onChangeSourceMode,
  onOpenSelector,
  selectedSession,
  siteSessions,
}: BadWorkplaceSourceSelectionSectionProps) {
  return (
    <article className={operationalStyles.reportCard}>
      <div className={operationalStyles.reportCardHeader}>
        <strong className={operationalStyles.reportCardTitle}>1. 원본 보고서 선택</strong>
        {siteSessions.length > 0 ? (
          <div className={operationalStyles.reportActions}>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={onOpenSelector}
            >
              보고서 선택
            </button>
          </div>
        ) : null}
      </div>

      {siteSessions.length > 0 ? (
        <>
          {selectedSession ? (
            <div className={operationalStyles.bannerInfo}>
              <div className={operationalStyles.sourceCardBody}>
                <strong className={operationalStyles.sourceCardTitle}>
                  {getSessionTitle(selectedSession)}
                </strong>
                <span className={operationalStyles.sourceCardMeta}>
                  지도일 {getSessionGuidanceDate(selectedSession) || '-'} / 작성자{' '}
                  {selectedSession.meta.drafter || '-'} / 지적사항{' '}
                  {countDocument7FindingsForDisplay(selectedSession)}건 / 진행률{' '}
                  {formatSessionProgressRateDisplay(selectedSession)}
                </span>
              </div>
            </div>
          ) : null}
          <div className={operationalStyles.reportActions}>
            <button
              type="button"
              className={
                draft.sourceMode === 'previous_unresolved'
                  ? 'app-button app-button-primary'
                  : 'app-button app-button-secondary'
              }
              onClick={() => onChangeSourceMode('previous_unresolved')}
            >
              이전 지적사항 미이행
            </button>
            <button
              type="button"
              className={
                draft.sourceMode === 'current_new_hazard'
                  ? 'app-button app-button-primary'
                  : 'app-button app-button-secondary'
              }
              onClick={() => onChangeSourceMode('current_new_hazard')}
            >
              당회차 신규 위험
            </button>
          </div>
          <p className={operationalStyles.reportCardDescription}>
            현재 기준: {getBadWorkplaceSourceModeLabel(draft.sourceMode)}
          </p>
        </>
      ) : (
        <div className={operationalStyles.emptyState}>
          원본으로 사용할 기술지도 보고서가 아직 없습니다.
        </div>
      )}
    </article>
  );
}
