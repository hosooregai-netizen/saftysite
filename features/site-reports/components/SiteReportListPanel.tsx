'use client';

import { useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import { ReportList } from '@/features/site-reports/components/ReportList';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import type {
  CreateSiteReportInput,
  SiteReportSortMode,
} from '@/features/site-reports/hooks/useSiteReportListState';
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
  createReport: (input: CreateSiteReportInput) => Promise<void>;
  currentSite: InspectionSite;
  deleteSession: (sessionId: string) => Promise<void>;
  filteredReportItems: InspectionReportListItem[];
  getCreateReportTitleSuggestion: (reportDate: string) => string;
  reloadReportIndex: () => void;
  reportIndexError: string | null;
  reportIndexStatus: ReportIndexStatus;
  reportItems: InspectionReportListItem[];
  reportQuery: string;
  reportSortMode: SiteReportSortMode;
  setReportQuery: (value: string) => void;
  setReportSortMode: (value: SiteReportSortMode) => void;
  showSummaryBar?: boolean;
}

interface CreateReportFormState {
  reportDate: string;
  reportTitle: string;
}

const EMPTY_CREATE_FORM: CreateReportFormState = {
  reportDate: '',
  reportTitle: '',
};

export function SiteReportListPanel({
  assignedUserDisplay,
  canArchiveReports,
  canCreateReport,
  createReport,
  currentSite,
  deleteSession,
  filteredReportItems,
  getCreateReportTitleSuggestion,
  reloadReportIndex,
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] =
    useState<CreateReportFormState>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [hasEditedCreateTitle, setHasEditedCreateTitle] = useState(false);

  const deletingSession = dialogSessionId
    ? reportItems.find((item) => item.reportKey === dialogSessionId) ?? null
    : null;
  const snapshot = currentSite.adminSiteSnapshot;
  const siteNameDisplay = currentSite.siteName?.trim() || snapshot.siteName?.trim() || '-';
  const addressDisplay = snapshot.siteAddress?.trim() || '-';
  const periodDisplay = snapshot.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot.constructionAmount?.trim() || '-';
  const showTableTools = reportIndexStatus === 'loaded' && reportItems.length > 0;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const resetCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError(null);
    setHasEditedCreateTitle(false);
  };

  const openCreateDialog = () => {
    if (!canCreateReport) {
      return;
    }

    const nextDate = today;
    setCreateForm({
      reportDate: nextDate,
      reportTitle: getCreateReportTitleSuggestion(nextDate),
    });
    setCreateError(null);
    setHasEditedCreateTitle(false);
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetCreateDialog();
  };

  const handleCreateDateChange = (value: string) => {
    setCreateError(null);
    setCreateForm((current) => {
      const next = {
        ...current,
        reportDate: value,
      };

      if (hasEditedCreateTitle) {
        return next;
      }

      return {
        ...next,
        reportTitle: value ? getCreateReportTitleSuggestion(value) : '',
      };
    });
  };

  const handleCreateTitleChange = (value: string) => {
    setCreateError(null);
    setCreateForm((current) => ({
      ...current,
      reportTitle: value,
    }));
    setHasEditedCreateTitle(value.trim().length > 0);
  };

  const handleCreateSubmit = async () => {
    const reportDate = createForm.reportDate.trim();
    const reportTitle = createForm.reportTitle.trim();

    if (!reportDate) {
      setCreateError('지도일을 입력해 주세요.');
      return;
    }

    if (!reportTitle) {
      setCreateError('제목을 입력해 주세요.');
      return;
    }

    try {
      setIsCreatingReport(true);
      await createReport({
        reportDate,
        reportTitle,
      });
      closeCreateDialog();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '보고서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingReport(false);
    }
  };

  const panelBody = (
    <>
      {showTableTools ? (
        <div className={styles.tableTools}>
          <input
            className={`app-input ${styles.tableSearch}`}
            placeholder="차수, 보고서명, 지도일, 작성자로 검색"
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
            <option value="round">차수순</option>
            <option value="name">보고서명순</option>
            <option value="progress">진행률순</option>
          </select>
          <button
            type="button"
            className={`app-button app-button-primary ${styles.tableCreateButton}`}
            onClick={openCreateDialog}
            disabled={!canCreateReport}
          >
            보고서 추가
          </button>
        </div>
      ) : null}

      {reportIndexError ? (
        <div className={styles.tableTools}>
          <span>{reportIndexError}</span>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={reloadReportIndex}
            disabled={reportIndexStatus === 'loading'}
          >
            다시 불러오기
          </button>
        </div>
      ) : null}

      <ReportList
        assignedUserDisplay={assignedUserDisplay}
        canArchiveReports={canArchiveReports}
        canCreateReport={canCreateReport}
        currentSite={currentSite}
        onCreateReport={openCreateDialog}
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
        open={isCreateDialogOpen}
        title="기술지도 보고서 생성"
        size="large"
        onClose={closeCreateDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeCreateDialog}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleCreateSubmit()}
              disabled={
                isCreatingReport || !createForm.reportDate || !createForm.reportTitle.trim()
              }
            >
              생성
            </button>
          </>
        }
      >
        <div className={styles.createDialogBody}>
          <label className={styles.createDialogField}>
            <span className={styles.createDialogLabel}>지도일</span>
            <input
              className="app-input"
              type="date"
              value={createForm.reportDate}
              onChange={(event) => handleCreateDateChange(event.target.value)}
            />
          </label>

          <label className={styles.createDialogField}>
            <span className={styles.createDialogLabel}>제목</span>
            <input
              className="app-input"
              value={createForm.reportTitle}
              onChange={(event) => handleCreateTitleChange(event.target.value)}
              placeholder="예: 2026-04-01 보고서 3"
            />
          </label>

          {createError ? (
            <p className={styles.createDialogError}>{createError}</p>
          ) : null}
        </div>
      </AppModal>

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
