'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ReportListEmptyState, type ReportListEmptyMode } from '@/features/site-reports/report-list/ReportListEmptyState';
import { ReportListRow } from '@/features/site-reports/report-list/ReportListRow';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import type {
  InspectionReportListItem,
  InspectionSite,
  ReportIndexStatus,
} from '@/types/inspectionSession';
import styles from './SiteReportsScreen.module.css';

interface ReportListProps {
  assignedUserDisplay?: string;
  canArchiveReports: boolean;
  canCreateReport: boolean;
  currentSite: InspectionSite;
  onCreateReport: () => void;
  onDeleteRequest: (reportKey: string) => void;
  reportIndexStatus: ReportIndexStatus;
  reportItems: InspectionReportListItem[];
  totalReportCount: number;
}

function getEmptyStateMode(params: {
  reportIndexStatus: ReportIndexStatus;
  reportItems: InspectionReportListItem[];
  totalReportCount: number;
}): ReportListEmptyMode | null {
  const { reportIndexStatus, reportItems, totalReportCount } = params;
  if ((reportIndexStatus === 'idle' || reportIndexStatus === 'loading') && totalReportCount === 0) {
    return 'loading';
  }
  if (reportIndexStatus === 'error' && totalReportCount === 0) {
    return 'error';
  }
  if (totalReportCount === 0) {
    return 'empty';
  }
  if (reportItems.length === 0) {
    return 'filtered-empty';
  }
  return null;
}

export function ReportList({
  assignedUserDisplay,
  canArchiveReports,
  canCreateReport,
  currentSite,
  onCreateReport,
  onDeleteRequest,
  reportIndexStatus,
  reportItems,
  totalReportCount,
}: ReportListProps) {
  const router = useRouter();
  const { ensureSessionLoaded } = useInspectionSessions();
  const prefetchedReportKeysRef = useRef<Set<string>>(new Set());
  const warmSession = useCallback(
    (reportKey: string, sessionHref: string) => {
      if (prefetchedReportKeysRef.current.has(reportKey)) {
        return;
      }

      prefetchedReportKeysRef.current.add(reportKey);
      router.prefetch(sessionHref);
      void ensureSessionLoaded(reportKey).catch(() => {
        prefetchedReportKeysRef.current.delete(reportKey);
      });
    },
    [ensureSessionLoaded, router],
  );
  const emptyStateMode = getEmptyStateMode({
    reportIndexStatus,
    reportItems,
    totalReportCount,
  });
  if (emptyStateMode) {
    return (
      <ReportListEmptyState
        canCreateReport={canCreateReport}
        mode={emptyStateMode}
        onCreateReport={onCreateReport}
      />
    );
  }

  return (
    <div className={styles.listViewport}>
      <div className={styles.listTrack}>
        <div className={styles.listHead} aria-hidden="true">
          <span>차수</span>
          <span>보고서명</span>
          <span className={styles.desktopOnly}>지도일</span>
          <span>작성자</span>
          <span>발송여부</span>
          <span>진행률</span>
          <span className={styles.desktopOnly}>마지막 저장</span>
          <span>메뉴</span>
        </div>

        <div className={styles.reportList}>
          {reportItems.map((item) => {
            return (
              <ReportListRow
                key={item.reportKey}
                assignedUserDisplay={assignedUserDisplay}
                canArchiveReports={canArchiveReports}
                currentSite={currentSite}
                item={item}
                onDeleteRequest={onDeleteRequest}
                onOpenReport={(reportKey, sessionHref) => {
                  warmSession(reportKey, sessionHref);
                  router.push(sessionHref);
                }}
                onWarmReport={warmSession}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
