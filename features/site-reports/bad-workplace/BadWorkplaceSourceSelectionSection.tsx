import operationalStyles from '@/components/site/OperationalReports.module.css';
import { getSessionGuidanceDate, getSessionTitle } from '@/constants/inspectionSession';
import {
  countDocument7FindingsForDisplay,
  formatSessionProgressRateDisplay,
} from '@/lib/erpReports/badWorkplace';
import type { InspectionSession } from '@/types/inspectionSession';

interface BadWorkplaceSourceSelectionSectionProps {
  onOpenSelector: () => void;
  onReloadViolations: () => void;
  selectedSession: InspectionSession | null;
  siteSessions: InspectionSession[];
}

export function BadWorkplaceSourceSelectionSection({
  onOpenSelector,
  onReloadViolations,
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
              className="app-button app-button-secondary"
              onClick={onReloadViolations}
            >
              기본 항목 다시 불러오기
            </button>
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
                  {`지도일 ${getSessionGuidanceDate(selectedSession) || '-'} / 작성자 ${
                    selectedSession.meta.drafter || '-'
                  } / 지적사항 ${countDocument7FindingsForDisplay(
                    selectedSession,
                  )}건 / 진행률 ${formatSessionProgressRateDisplay(selectedSession)}`}
                </span>
              </div>
            </div>
          ) : null}
          <p className={operationalStyles.reportCardDescription}>
            선택한 기술지도 보고서의 이전 미이행과 당회차 신규 위험을 함께 불러옵니다.
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
