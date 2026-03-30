'use client';

import { useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import { getSessionTitle } from '@/constants/inspectionSession';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import { ReportList } from '@/features/site-reports/components/ReportList';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import type { SiteReportSortMode } from '@/features/site-reports/hooks/useSiteReportListState';
import styles from './SiteReportsScreen.module.css';

interface SiteReportListPanelProps {
  assignedUserDisplay?: string;
  canArchiveReports: boolean;
  createReport: () => void;
  currentSite: InspectionSite;
  deleteSession: (sessionId: string) => Promise<void>;
  filteredSiteSessions: InspectionSession[];
  isLoadingSiteReports: boolean;
  reportQuery: string;
  reportSortMode: SiteReportSortMode;
  setReportQuery: (value: string) => void;
  setReportSortMode: (value: SiteReportSortMode) => void;
  siteSessions: InspectionSession[];
  showSummaryBar?: boolean;
}

export function SiteReportListPanel({
  assignedUserDisplay,
  canArchiveReports,
  createReport,
  currentSite,
  deleteSession,
  filteredSiteSessions,
  isLoadingSiteReports,
  reportQuery,
  reportSortMode,
  setReportQuery,
  setReportSortMode,
  siteSessions,
  showSummaryBar = true,
}: SiteReportListPanelProps) {
  const [dialogSessionId, setDialogSessionId] = useState<string | null>(null);
  const deletingSession =
    dialogSessionId
      ? siteSessions.find((session) => session.id === dialogSessionId) ?? null
      : null;
  const snapshot = currentSite.adminSiteSnapshot;
  const siteNameDisplay = currentSite.siteName?.trim() || snapshot.siteName?.trim() || '-';
  const addressDisplay = snapshot.siteAddress?.trim() || '-';
  const periodDisplay = snapshot.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot.constructionAmount?.trim() || '-';

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

      <section className={styles.panel}>
        {siteSessions.length > 0 ? (
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
              <option value="recent">최근 수정순</option>
              <option value="name">보고서명순</option>
              <option value="progress">진행률 높은 순</option>
            </select>
            <button
              type="button"
              className={`app-button app-button-primary ${styles.tableCreateButton}`}
              onClick={createReport}
            >
              보고서 추가
            </button>
          </div>
        ) : null}

        <ReportList
          assignedUserDisplay={assignedUserDisplay}
          canArchiveReports={canArchiveReports}
          currentSite={currentSite}
          onCreateReport={createReport}
          onDeleteRequest={setDialogSessionId}
          siteSessions={
            isLoadingSiteReports && siteSessions.length === 0 ? [] : filteredSiteSessions
          }
          totalSessionCount={siteSessions.length}
        />
        {isLoadingSiteReports && siteSessions.length === 0 ? (
          <div className={styles.tableTools}>이 현장의 보고서 목록을 불러오는 중입니다.</div>
        ) : null}
      </section>

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
            ? `"${getSessionTitle(deletingSession)}" 보고서를 삭제합니다.`
            : '선택한 보고서를 삭제합니다.'}
        </p>
      </AppModal>
    </>
  );
}
