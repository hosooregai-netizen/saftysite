'use client';

import { useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import { ReportList } from '@/features/site-reports/components/ReportList';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import type { SiteReportSortMode } from '@/features/site-reports/hooks/useSiteReportListState';
import type {
  InspectionReportListItem,
  InspectionSite,
  ReportIndexStatus,
} from '@/types/inspectionSession';
import styles from './SiteReportsScreen.module.css';

interface SiteReportListPanelProps {
  assignedUserDisplay?: string;
  canArchiveReports: boolean;
  canCreateReport: boolean;
  createReport: () => void;
  currentSite: InspectionSite;
  deleteSession: (sessionId: string) => Promise<void>;
  filteredReportItems: InspectionReportListItem[];
  reportIndexError: string | null;
  reportIndexStatus: ReportIndexStatus;
  reportItems: InspectionReportListItem[];
  reportQuery: string;
  reportSortMode: SiteReportSortMode;
  setReportQuery: (value: string) => void;
  setReportSortMode: (value: SiteReportSortMode) => void;
  showSummaryBar?: boolean;
}

export function SiteReportListPanel({
  assignedUserDisplay,
  canArchiveReports,
  canCreateReport,
  createReport,
  currentSite,
  deleteSession,
  filteredReportItems,
  reportIndexError,
  reportIndexStatus,
  reportItems,
  reportQuery,
  reportSortMode,
  setReportQuery,
  setReportSortMode,
  showSummaryBar = true,
}: SiteReportListPanelProps) {
  const [dialogSessionId, setDialogSessionId] = useState<string | null>(null);
  const deletingSession =
    dialogSessionId
      ? reportItems.find((item) => item.reportKey === dialogSessionId) ?? null
      : null;
  const snapshot = currentSite.adminSiteSnapshot;
  const siteNameDisplay = currentSite.siteName?.trim() || snapshot.siteName?.trim() || '-';
  const addressDisplay = snapshot.siteAddress?.trim() || '-';
  const periodDisplay = snapshot.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot.constructionAmount?.trim() || '-';
  const showTableTools = reportIndexStatus === 'loaded' && reportItems.length > 0;
  const panelBody = (
    <>
      {showTableTools ? (
        <div className={styles.tableTools}>
          <input
            className={`app-input ${styles.tableSearch}`}
            placeholder="보고서명, 작성일, 작성자로 검색"
            value={reportQuery}
            onChange={(event) => setReportQuery(event.target.value)}
            aria-label="보고서 검색"
          />
          <select
            className={`app-select ${styles.tableSort}`}
            value={reportSortMode}
            onChange={(event) =>
              setReportSortMode(event.target.value as SiteReportSortMode)
            }
            aria-label="보고서 정렬"
          >
            <option value="recent">최근 저장순</option>
            <option value="name">보고서명순</option>
            <option value="progress">진행률 높은 순</option>
          </select>
          <button
            type="button"
            className={`app-button app-button-primary ${styles.tableCreateButton}`}
            onClick={createReport}
            disabled={!canCreateReport}
          >
            보고서 추가
          </button>
        </div>
      ) : null}

      {reportIndexError ? <div className={styles.tableTools}>{reportIndexError}</div> : null}

      <ReportList
        assignedUserDisplay={assignedUserDisplay}
        canArchiveReports={canArchiveReports}
        canCreateReport={canCreateReport}
        currentSite={currentSite}
        onCreateReport={createReport}
        onDeleteRequest={setDialogSessionId}
        reportIndexStatus={reportIndexStatus}
        reportItems={reportIndexStatus === 'loaded' ? filteredReportItems : []}
        totalReportCount={reportItems.length}
      />
    </>
  );

  return (
    <>
      {showSummaryBar ? (
        <SiteReportsSummaryBar
          addressDisplay={addressDisplay}
          amountDisplay={amountDisplay}
          periodDisplay={periodDisplay}
          siteNameDisplay={siteNameDisplay}
        />
      ) : null}

      <section className={styles.panel}>{panelBody}</section>

      <AppModal
        open={canArchiveReports && Boolean(dialogSessionId)}
        title="보고서 삭제"
        onClose={() => setDialogSessionId(null)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setDialogSessionId(null)}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-danger"
              onClick={() => {
                if (!dialogSessionId) return;
                void deleteSession(dialogSessionId);
                setDialogSessionId(null);
              }}
            >
              삭제
            </button>
          </>
        }
      >
        <p>
          {deletingSession
            ? `"${deletingSession.reportTitle}" 보고서를 삭제합니다.`
            : '선택한 보고서를 삭제합니다.'}
        </p>
      </AppModal>
    </>
  );
}
