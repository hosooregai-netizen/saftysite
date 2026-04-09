'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import AppModal from '@/components/ui/AppModal';
import {
  buildMobileSiteHomeHref,
  buildMobileSiteQuarterlyHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from '@/features/mobile/components/MobileShell';
import { MobileTabBar } from '@/features/mobile/components/MobileTabBar';
import { buildSiteTabs } from '@/features/mobile/lib/buildSiteTabs';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import {
  applyQuarterlySummarySeed,
  buildLocalQuarterlySummarySeed,
  createQuarterlySummaryDraft,
} from '@/lib/erpReports/quarterly';
import {
  buildQuarterlyTitleForPeriod,
  createQuarterKey,
  formatPeriodRangeLabel,
  getQuarterFromDate,
  getQuarterRange,
  parseDateValue,
} from '@/lib/erpReports/shared';
import {
  fetchQuarterlySummarySeed,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import type { OperationalQuarterlyIndexItem } from '@/types/erpReports';
import styles from './MobileShell.module.css';

interface MobileSiteQuarterlyReportsScreenProps {
  siteKey: string;
}

interface CreateQuarterlyReportForm {
  title: string;
  periodStartDate: string;
  periodEndDate: string;
}

type QuarterlyListSortMode = 'recent' | 'name' | 'period';

interface QuarterlyListRow {
  href: string;
  quarterLabel: string;
  periodEndDate: string;
  periodLabel: string;
  periodStartDate: string;
  reportId: string;
  reportTitle: string;
  selectedCount: number;
  updatedAt: string;
}

const EMPTY_CREATE_FORM: CreateQuarterlyReportForm = {
  title: '',
  periodStartDate: '',
  periodEndDate: '',
};

function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function getSortTime(value: string) {
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getQuarterLabel(year: number, quarter: number) {
  return year > 0 && quarter >= 1 && quarter <= 4
    ? `${year}년 ${quarter}분기`
    : '기간 미정';
}

function compareQuarterlyCreationOrder(
  left: Pick<OperationalQuarterlyIndexItem, 'createdAt' | 'updatedAt' | 'id'>,
  right: Pick<OperationalQuarterlyIndexItem, 'createdAt' | 'updatedAt' | 'id'>,
) {
  const createdDiff = getSortTime(left.createdAt) - getSortTime(right.createdAt);
  if (createdDiff !== 0) {
    return createdDiff;
  }

  const updatedDiff = getSortTime(left.updatedAt) - getSortTime(right.updatedAt);
  if (updatedDiff !== 0) {
    return updatedDiff;
  }

  return left.id.localeCompare(right.id, 'ko');
}

function buildUniqueQuarterlyReportTitle(baseTitle: string, existingTitles: string[]) {
  const trimmedBase = baseTitle.trim();
  if (!trimmedBase) return '';

  const normalizedBase = trimmedBase.toLowerCase();
  const normalizedTitles = new Set(
    existingTitles.map((title) => title.trim().toLowerCase()).filter(Boolean),
  );

  if (!normalizedTitles.has(normalizedBase)) {
    return trimmedBase;
  }

  let suffix = 2;
  while (normalizedTitles.has(`${trimmedBase} (${suffix})`.toLowerCase())) {
    suffix += 1;
  }

  return `${trimmedBase} (${suffix})`;
}

function getCreateTitleSuggestion(
  startDate: string,
  endDate: string,
  existingTitles: string[],
) {
  if (!startDate || !endDate || startDate > endDate) {
    return '';
  }

  return buildUniqueQuarterlyReportTitle(
    buildQuarterlyTitleForPeriod(startDate, endDate),
    existingTitles,
  );
}

function getCreateQuarterSelectionTarget(
  form: Pick<CreateQuarterlyReportForm, 'periodStartDate' | 'periodEndDate'>,
) {
  const startDate = parseDateValue(form.periodStartDate);
  if (startDate) {
    return {
      year: startDate.getFullYear(),
      quarter: getQuarterFromDate(startDate),
    };
  }

  const endDate = parseDateValue(form.periodEndDate);
  if (endDate) {
    return {
      year: endDate.getFullYear(),
      quarter: getQuarterFromDate(endDate),
    };
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    quarter: getQuarterFromDate(today),
  };
}

function shouldUseLocalQuarterlySeedFallback(error: unknown) {
  return error instanceof SafetyApiError && [404, 405, 501].includes(error.status ?? -1);
}

function QuarterlyReportCard({
  canArchiveReports,
  onDeleteRequest,
  row,
}: {
  canArchiveReports: boolean;
  onDeleteRequest: (reportId: string) => void;
  row: QuarterlyListRow;
}) {
  return (
    <Link href={row.href} style={{ color: 'inherit', textDecoration: 'none' }}>
      <article className={styles.reportCard} style={{ cursor: 'pointer', padding: '12px' }}>
        <div style={{ alignItems: 'flex-start', display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
          <div style={{ display: 'grid', flex: 1, gap: '4px', minWidth: 0 }}>
            <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
              {row.quarterLabel}
            </span>
            <h2
              className={styles.cardTitle}
              style={{
                fontSize: '15px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.reportTitle}
            </h2>
          </div>
          {canArchiveReports ? (
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                flexShrink: 0,
                fontSize: '13px',
                padding: '4px',
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDeleteRequest(row.reportId);
              }}
            >
              삭제
            </button>
          ) : null}
        </div>

        <div style={{ color: '#475569', display: 'grid', fontSize: '13px', gap: '6px' }}>
          <span>
            <strong style={{ color: '#0f172a', fontWeight: 700 }}>기간</strong> {row.periodLabel}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <span>
              <strong style={{ color: '#0f172a', fontWeight: 700 }}>원본</strong> {row.selectedCount}건
            </span>
            <span>
              <strong style={{ color: '#0f172a', fontWeight: 700 }}>수정</strong>{' '}
              {formatDateTimeLabel(row.updatedAt)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function MobileSiteQuarterlyReportsScreen({
  siteKey,
}: MobileSiteQuarterlyReportsScreenProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<QuarterlyListSortMode>('recent');
  const [dialogReportId, setDialogReportId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateQuarterlyReportForm>(EMPTY_CREATE_FORM);
  const [hasEditedCreateTitle, setHasEditedCreateTitle] = useState(false);
  const [createDialogError, setCreateDialogError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const {
    authError,
    canArchiveReports,
    currentUser,
    ensureSiteReportsLoaded,
    getSessionsBySiteId,
    isAuthenticated,
    isReady,
    login,
    logout,
    sites,
  } = useInspectionSessions();
  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const { quarterlyReports, error, isLoading } = useSiteOperationalReportIndex(
    currentSite,
    isAuthenticated && isReady && Boolean(currentSite),
  );
  const {
    deleteOperationalReport,
    error: mutationError,
    isSaving,
    saveQuarterlyReport,
  } = useSiteOperationalReportMutations(currentSite);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) {
      return;
    }

    void ensureSiteReportsLoaded(currentSite.id).catch(() => {
      // Quarterly creation can still fall back to cached local sessions.
    });
  }, [currentSite, ensureSiteReportsLoaded, isAuthenticated, isReady]);

  const rows = useMemo<QuarterlyListRow[]>(() => {
    if (!currentSite) return [];

    return [...quarterlyReports]
      .sort(compareQuarterlyCreationOrder)
      .map((report) => ({
        href: buildMobileSiteQuarterlyHref(currentSite.id, report.id),
        quarterLabel: getQuarterLabel(report.year, report.quarter),
        periodEndDate: report.periodEndDate,
        periodLabel: formatPeriodRangeLabel(report.periodStartDate, report.periodEndDate),
        periodStartDate: report.periodStartDate,
        reportId: report.id,
        reportTitle: report.title || '분기 종합보고서',
        selectedCount: report.selectedReportCount,
        updatedAt: report.updatedAt || report.lastCalculatedAt || report.createdAt,
      }));
  }, [currentSite, quarterlyReports]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const matchingRows = !normalizedQuery
      ? rows
      : rows.filter((row) =>
          [row.reportTitle, row.quarterLabel, row.periodLabel]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery),
        );

    return [...matchingRows].sort((left, right) => {
      if (sortMode === 'name') {
        return left.reportTitle.localeCompare(right.reportTitle, 'ko');
      }

      if (sortMode === 'period') {
        const rightKey = `${right.periodEndDate}|${right.periodStartDate}`;
        const leftKey = `${left.periodEndDate}|${left.periodStartDate}`;
        return rightKey.localeCompare(leftKey, 'ko');
      }

      return getSortTime(right.updatedAt) - getSortTime(left.updatedAt);
    });
  }, [deferredQuery, rows, sortMode]);

  const existingReportTitles = useMemo(
    () => rows.map((row) => row.reportTitle),
    [rows],
  );
  const deletingRow = dialogReportId
    ? rows.find((row) => row.reportId === dialogReportId) ?? null
    : null;
  const createQuarterSelection = String(
    getCreateQuarterSelectionTarget(createForm).quarter,
  );
  const isBusy = isSaving || isCreatingReport || isDeletingReport;
  const isCreateRangeInvalid =
    Boolean(createForm.periodStartDate) &&
    Boolean(createForm.periodEndDate) &&
    createForm.periodStartDate > createForm.periodEndDate;
  const isCreateDisabled =
    isBusy ||
    !createForm.title.trim() ||
    !createForm.periodStartDate ||
    !createForm.periodEndDate ||
    isCreateRangeInvalid;
  const operationalError = mutationError ?? error;

  const resetCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setHasEditedCreateTitle(false);
    setCreateDialogError(null);
  };

  const openCreateDialog = () => {
    if (!currentSite || isBusy) {
      return;
    }

    resetCreateDialog();
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    if (isCreatingReport) {
      return;
    }

    setIsCreateDialogOpen(false);
    resetCreateDialog();
  };

  const handleCreateFieldChange = (
    key: keyof CreateQuarterlyReportForm,
    value: string,
  ) => {
    setCreateDialogError(null);
    setCreateForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === 'title' || hasEditedCreateTitle) {
        return next;
      }

      return {
        ...next,
        title: getCreateTitleSuggestion(
          next.periodStartDate,
          next.periodEndDate,
          existingReportTitles,
        ),
      };
    });
  };

  const handleCreateTitleChange = (value: string) => {
    setHasEditedCreateTitle(value.trim().length > 0);
    handleCreateFieldChange('title', value);
  };

  const handleQuarterSelectChange = (value: string) => {
    const quarter = Number.parseInt(value, 10);
    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
      return;
    }

    const { year } = getCreateQuarterSelectionTarget(createForm);
    const range = getQuarterRange(year, quarter);

    setCreateDialogError(null);
    setCreateForm((current) => {
      const next = {
        ...current,
        periodStartDate: range.startDate,
        periodEndDate: range.endDate,
      };

      if (hasEditedCreateTitle) {
        return next;
      }

      return {
        ...next,
        title: getCreateTitleSuggestion(range.startDate, range.endDate, existingReportTitles),
      };
    });
  };

  const handleCreateReport = async () => {
    if (!currentSite) {
      return;
    }

    const title = createForm.title.trim();
    const periodStartDate = createForm.periodStartDate.trim();
    const periodEndDate = createForm.periodEndDate.trim();

    if (!title) {
      setCreateDialogError('제목을 입력해 주세요.');
      return;
    }

    if (!periodStartDate || !periodEndDate) {
      setCreateDialogError('기간 시작일과 종료일을 모두 입력해 주세요.');
      return;
    }

    if (periodStartDate > periodEndDate) {
      setCreateDialogError('종료일이 시작일보다 빠를 수 없습니다.');
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      setCreateDialogError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    const { quarter, year } = getCreateQuarterSelectionTarget({
      periodEndDate,
      periodStartDate,
    });
    const drafter = currentUser?.name?.trim() || currentSite.assigneeName || '담당자';
    const siteSessions = getSessionsBySiteId(currentSite.id);

    let nextDraft = createQuarterlySummaryDraft(currentSite, drafter, periodStartDate);
    nextDraft = {
      ...nextDraft,
      periodEndDate,
      periodStartDate,
      quarter,
      quarterKey: createQuarterKey(year, quarter),
      title,
      year,
    };

    setCreateDialogError(null);
    setIsCreatingReport(true);

    try {
      const seed = await fetchQuarterlySummarySeed(token, currentSite.id, {
        periodEndDate,
        periodStartDate,
      }).catch((error) => {
        if (shouldUseLocalQuarterlySeedFallback(error)) {
          return buildLocalQuarterlySummarySeed(nextDraft, currentSite, siteSessions);
        }

        throw error;
      });

      nextDraft = applyQuarterlySummarySeed(nextDraft, seed);
      await saveQuarterlyReport(nextDraft);
      closeCreateDialog();
      router.push(buildMobileSiteQuarterlyHref(currentSite.id, nextDraft.id));
    } catch (error) {
      setCreateDialogError(
        error instanceof Error
          ? error.message
          : '분기 보고서를 생성하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsCreatingReport(false);
    }
  };

  const closeDeleteDialog = () => {
    if (isDeletingReport) {
      return;
    }

    setDialogReportId(null);
    setDeleteError(null);
  };

  const handleDeleteSubmit = async () => {
    if (!dialogReportId) {
      return;
    }

    setDeleteError(null);
    setIsDeletingReport(true);

    try {
      await deleteOperationalReport(dialogReportId);
      closeDeleteDialog();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : '분기 보고서를 삭제하지 못했습니다.',
      );
    } finally {
      setIsDeletingReport(false);
    }
  };

  if (!isReady) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>분기 보고서 목록을 준비하고 있습니다.</h1>
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        description="모바일에서 분기 종합보고서를 만들고 수정할 수 있습니다."
        error={authError}
        onSubmit={login}
        title="모바일 분기 보고 로그인"
      />
    );
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>현장을 찾을 수 없습니다.</h1>
              <Link href="/mobile" className="app-button app-button-secondary">
                현장 목록으로 돌아가기
              </Link>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <MobileShell
        backHref={buildMobileSiteHomeHref(currentSite.id)}
        backLabel="현장 홈"
        currentUserName={currentUser?.name}
        onLogout={logout}
        tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'quarterly')} />}
        title={currentSite.siteName}
        webHref={`/sites/${encodeURIComponent(currentSite.id)}/quarterly`}
      >
        <section className={styles.sectionCard} style={{ padding: '16px 12px' }}>
          <div className={styles.sectionHeader} style={{ paddingBottom: '12px' }}>
            <div className={styles.sectionTitleWrap}>
              <h2 className={styles.sectionTitle}>분기 보고 목록</h2>
            </div>
            <span className={styles.sectionMeta}>
              {isLoading ? '불러오는 중' : `총 ${rows.length}건 / 검색 ${filteredRows.length}건`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              className="app-input"
              style={{ flex: 1, fontSize: '13px', minWidth: 0 }}
              placeholder="제목, 분기, 기간으로 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="app-select"
              style={{ flexShrink: 0, fontSize: '13px', padding: '0 8px', width: '108px' }}
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as QuarterlyListSortMode)}
            >
              <option value="recent">최근순</option>
              <option value="period">기간순</option>
              <option value="name">제목순</option>
            </select>
          </div>

          {operationalError ? (
            <div className={styles.errorNotice}>
              <p style={{ margin: 0 }}>{operationalError}</p>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <div className={styles.cardStack}>
              <p className={styles.inlineNotice}>
                아직 등록된 분기 보고서가 없습니다. 첫 보고서를 만들면 모바일에서 바로 편집할 수
                있습니다.
              </p>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={openCreateDialog}
              >
                + 분기 보고 만들기
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <p className={styles.inlineNotice}>
              검색 조건에 맞는 분기 보고서가 없습니다. 검색어 또는 정렬 기준을 바꿔 보세요.
            </p>
          ) : (
            <div className={styles.cardStack}>
              {filteredRows.map((row) => (
                <QuarterlyReportCard
                  key={row.reportId}
                  canArchiveReports={canArchiveReports}
                  onDeleteRequest={setDialogReportId}
                  row={row}
                />
              ))}
            </div>
          )}

          {rows.length > 0 ? (
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={openCreateDialog}
              style={{ marginTop: '16px', width: '100%' }}
            >
              + 분기 보고 만들기
            </button>
          ) : null}
        </section>
      </MobileShell>

      <AppModal
        open={isCreateDialogOpen}
        title="분기 보고 만들기"
        onClose={closeCreateDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeCreateDialog}
            >
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleCreateReport()}
              disabled={isCreateDisabled}
            >
              {isCreatingReport ? '생성 중...' : '생성'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          <label className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>제목</span>
            <input
              className="app-input"
              value={createForm.title}
              onChange={(event) => handleCreateTitleChange(event.target.value)}
              placeholder="예: 2026년 2분기 종합보고서"
            />
          </label>

          <label className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>분기</span>
            <select
              className="app-select"
              value={createQuarterSelection}
              onChange={(event) => handleQuarterSelectChange(event.target.value)}
            >
              <option value="1">1분기</option>
              <option value="2">2분기</option>
              <option value="3">3분기</option>
              <option value="4">4분기</option>
            </select>
          </label>

          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>시작일</span>
              <input
                type="date"
                className="app-input"
                value={createForm.periodStartDate}
                onChange={(event) => handleCreateFieldChange('periodStartDate', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>종료일</span>
              <input
                type="date"
                className="app-input"
                value={createForm.periodEndDate}
                onChange={(event) => handleCreateFieldChange('periodEndDate', event.target.value)}
              />
            </label>
          </div>

          {isCreateRangeInvalid ? (
            <div className={styles.errorNotice}>종료일이 시작일보다 빠를 수 없습니다.</div>
          ) : null}
          {createDialogError ? <div className={styles.errorNotice}>{createDialogError}</div> : null}
        </div>
      </AppModal>

      <AppModal
        open={Boolean(dialogReportId)}
        title="분기 보고 삭제"
        onClose={closeDeleteDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeDeleteDialog}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-danger"
              onClick={() => void handleDeleteSubmit()}
              disabled={isDeletingReport}
            >
              {isDeletingReport ? '삭제 중...' : '삭제'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {deletingRow
              ? `"${deletingRow.reportTitle}" 보고서를 삭제할까요?`
              : '선택한 보고서를 삭제할까요?'}
          </p>
          {deleteError ? <div className={styles.errorNotice}>{deleteError}</div> : null}
        </div>
      </AppModal>
    </>
  );
}
