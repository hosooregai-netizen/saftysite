'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ReportListEmptyState, type ReportListEmptyMode } from '@/features/site-reports/report-list/ReportListEmptyState';
import { ReportListRow } from '@/features/site-reports/report-list/ReportListRow';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { isLegacyTechnicalGuidanceCreateTarget } from '@/lib/siteReports/legacyTechnicalGuidance';
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
  createAvailabilityMessage: string | null;
  currentSite: InspectionSite;
  onCreateReport: () => void;
  onCreateLegacyReport: (item: InspectionReportListItem) => void;
  onDeleteRequest: (reportKey: string) => void;
  onToggleDispatch: (item: InspectionReportListItem) => void;
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

function resolveReportHref(item: InspectionReportListItem) {
  if (isLegacyTechnicalGuidanceCreateTarget(item)) {
    return null;
  }

  return item.reportOpenHref || `/sessions/${item.reportKey}`;
}

export function ReportList({
  assignedUserDisplay,
  canArchiveReports,
  canCreateReport,
  createAvailabilityMessage,
  currentSite,
  onCreateReport,
  onCreateLegacyReport,
  onDeleteRequest,
  onToggleDispatch,
  reportIndexStatus,
  reportItems,
  totalReportCount,
}: ReportListProps) {
  const router = useRouter();
  const { ensureSessionLoaded } = useInspectionSessions();
  const prefetchedReportKeysRef = useRef<Set<string>>(new Set());
  const warmSession = useCallback(
    (item: InspectionReportListItem) => {
      const sessionHref = resolveReportHref(item);
      if (!sessionHref) {
        return;
      }
      if (prefetchedReportKeysRef.current.has(item.reportKey)) {
        return;
      }

      prefetchedReportKeysRef.current.add(item.reportKey);
      router.prefetch(sessionHref);
      if (item.readOnly || item.reportOpenMode === 'original_pdf') {
        return;
      }
      void ensureSessionLoaded(item.reportKey).catch(() => {
        prefetchedReportKeysRef.current.delete(item.reportKey);
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
        createAvailabilityMessage={createAvailabilityMessage}
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
                onOpenReport={(nextItem) => {
                  if (isLegacyTechnicalGuidanceCreateTarget(nextItem)) {
                    onCreateLegacyReport(nextItem);
                    return;
                  }
                  warmSession(nextItem);
                  const href = resolveReportHref(nextItem);
                  if (href) {
                    router.push(href);
                  }
                }}
                onToggleDispatch={onToggleDispatch}
                onWarmReport={warmSession}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
