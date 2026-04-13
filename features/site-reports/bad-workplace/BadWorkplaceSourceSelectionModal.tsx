import AppModal from '@/components/ui/AppModal';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import {
  countDocument7FindingsForDisplay,
  formatSessionProgressRateDisplay,
} from '@/lib/erpReports/badWorkplace';
import { getSessionGuidanceDate, getSessionTitle } from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';

interface BadWorkplaceSourceSelectionModalProps {
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  open: boolean;
  selectedSessionId: string | null;
  siteSessions: InspectionSession[];
}

export function BadWorkplaceSourceSelectionModal({
  onClose,
  onSelectSession,
  open,
  selectedSessionId,
  siteSessions,
}: BadWorkplaceSourceSelectionModalProps) {
  return (
    <AppModal
      open={open}
      title="기술지도 보고서 선택"
      size="large"
      onClose={onClose}
      actions={
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={onClose}
        >
          닫기
        </button>
      }
    >
      <div className={operationalStyles.sourceList}>
        {siteSessions.map((session) => {
          const isSelected = session.id === selectedSessionId;
          return (
            <article
              key={session.id}
              className={`${operationalStyles.sourceCard} ${
                isSelected ? operationalStyles.sourceCardActive : ''
              }`}
            >
              <div className={operationalStyles.sourceCardTop}>
                <div className={operationalStyles.sourceCardBody}>
                  <strong className={operationalStyles.sourceCardTitle}>
                    {getSessionTitle(session)}
                  </strong>
                  <span className={operationalStyles.sourceCardMeta}>
                    지도일 {getSessionGuidanceDate(session) || '-'} / 작성자{' '}
                    {session.meta.drafter || '-'} / 지적사항{' '}
                    {countDocument7FindingsForDisplay(session)}건 / 진행률{' '}
                    {formatSessionProgressRateDisplay(session)}
                  </span>
                </div>
              </div>
              <div className={operationalStyles.sourceCardActions}>
                <button
                  type="button"
                  className={`app-button ${
                    isSelected ? 'app-button-primary' : 'app-button-secondary'
                  }`}
                  onClick={() => onSelectSession(session.id)}
                  disabled={isSelected}
                >
                  {isSelected ? '선택됨' : '이 보고서를 기준으로 불러오기'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </AppModal>
  );
}
