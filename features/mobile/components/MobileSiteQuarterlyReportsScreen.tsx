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
  return year > 0 && quarter >= 1 && quarter <= 4 ? `${year}??${quarter}遺꾧린` : '湲곌컙 誘몄꽕??;
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
              ??젣
            </button>
          ) : null}
        </div>

        <div style={{ color: '#475569', display: 'grid', fontSize: '13px', gap: '6px' }}>
          <span>
            <strong style={{ color: '#0f172a', fontWeight: 700 }}>湲곌컙</strong> {row.periodLabel}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <span>
              <strong style={{ color: '#0f172a', fontWeight: 700 }}>?먮낯</strong> {row.selectedCount}嫄?            </span>
            <span>
              <strong style={{ color: '#0f172a', fontWeight: 700 }}>?섏젙</strong> {formatDateTimeLabel(row.updatedAt)}
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
        reportTitle: report.title || '遺꾧린 醫낇빀蹂닿퀬??,
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
      setCreateDialogError('?쒕ぉ???낅젰??二쇱꽭??');
      return;
    }

    if (!periodStartDate || !periodEndDate) {
      setCreateDialogError('湲곌컙 ?쒖옉?쇨낵 醫낅즺?쇱쓣 紐⑤몢 ?낅젰??二쇱꽭??');
      return;
    }

    if (periodStartDate > periodEndDate) {
      setCreateDialogError('醫낅즺?쇱? ?쒖옉?쇰낫??鍮좊? ???놁뒿?덈떎.');
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      setCreateDialogError('濡쒓렇?몄씠 留뚮즺?섏뿀?듬땲?? ?ㅼ떆 濡쒓렇?명빐 二쇱꽭??');
      return;
    }

    const { quarter, year } = getCreateQuarterSelectionTarget({
      periodEndDate,
      periodStartDate,
    });
    const drafter = currentUser?.name?.trim() || currentSite.assigneeName || '?대떦??;
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
          : '遺꾧린 蹂닿퀬?쒕? ?앹꽦?섎뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.',
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
        error instanceof Error ? error.message : '遺꾧린 蹂닿퀬?쒕? ??젣?섏? 紐삵뻽?듬땲??',
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
              <h1 className={styles.sectionTitle}>遺꾧린 蹂닿퀬 紐⑸줉??以鍮꾪븯怨??덉뒿?덈떎.</h1>
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        description="紐⑤컮?쇱뿉??遺꾧린 醫낇빀蹂닿퀬?쒕? 留뚮뱾怨??섏젙?????덉뒿?덈떎."
        error={authError}
        onSubmit={login}
        title="紐⑤컮??遺꾧린 蹂닿퀬 濡쒓렇??
      />
    );
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>?꾩옣??李얠쓣 ???놁뒿?덈떎.</h1>
              <Link href="/mobile" className="app-button app-button-secondary">
                ?꾩옣 紐⑸줉?쇰줈 ?뚯븘媛湲?              </Link>
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
        backLabel="?꾩옣 ??
        currentUserName={currentUser?.name}
        onLogout={logout}
        tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'quarterly')} />}
        title={currentSite.siteName}
        webHref={`/sites/${encodeURIComponent(currentSite.id)}/quarterly`}
      >
        <section className={styles.sectionCard} style={{ padding: '16px 12px' }}>
          <div className={styles.sectionHeader} style={{ paddingBottom: '12px' }}>
            <div className={styles.sectionTitleWrap}>
              <h2 className={styles.sectionTitle}>遺꾧린 蹂닿퀬 紐⑸줉</h2>
            </div>
            <span className={styles.sectionMeta}>
              {isLoading ? '遺덈윭?ㅻ뒗 以? : `珥?${rows.length}嫄?/ 寃??${filteredRows.length}嫄?}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              className="app-input"
              style={{ flex: 1, fontSize: '13px', minWidth: 0 }}
              placeholder="?쒕ぉ, 遺꾧린, 湲곌컙?쇰줈 寃??
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="app-select"
              style={{ flexShrink: 0, fontSize: '13px', padding: '0 8px', width: '108px' }}
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as QuarterlyListSortMode)}
            >
              <option value="recent">理쒓렐??/option>
              <option value="period">湲곌컙??/option>
              <option value="name">?쒕ぉ??/option>
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
                ?꾩쭅 ?깅줉??遺꾧린 蹂닿퀬?쒓? ?놁뒿?덈떎. ??蹂닿퀬?쒕? 留뚮뱾硫?紐⑤컮?쇱뿉??諛붾줈 ?몄쭛?????덉뒿?덈떎.
              </p>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={openCreateDialog}
              >
                ??遺꾧린 蹂닿퀬 留뚮뱾湲?              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <p className={styles.inlineNotice}>
              寃??議곌굔??留욌뒗 遺꾧린 蹂닿퀬?쒓? ?놁뒿?덈떎. 寃?됱뼱 ?먮뒗 ?뺣젹 湲곗???諛붽퓭 蹂댁꽭??
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
              ??遺꾧린 蹂닿퀬 留뚮뱾湲?            </button>
          ) : null}
        </section>
      </MobileShell>

      <AppModal
        open={isCreateDialogOpen}
        title="遺꾧린 蹂닿퀬 留뚮뱾湲?
        onClose={closeCreateDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeCreateDialog}
            >
              ?リ린
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleCreateReport()}
              disabled={isCreateDisabled}
            >
              {isCreatingReport ? '?앹꽦 以?..' : '?앹꽦'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          <label className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>?쒕ぉ</span>
            <input
              className="app-input"
              value={createForm.title}
              onChange={(event) => handleCreateTitleChange(event.target.value)}
            />
          </label>

          <label className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>遺꾧린</span>
            <select
              className="app-select"
              value={createQuarterSelection}
              onChange={(event) => handleQuarterSelectChange(event.target.value)}
            >
              <option value="1">1遺꾧린</option>
              <option value="2">2遺꾧린</option>
              <option value="3">3遺꾧린</option>
              <option value="4">4遺꾧린</option>
            </select>
          </label>

          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>?쒖옉??/span>
              <input
                type="date"
                className="app-input"
                value={createForm.periodStartDate}
                onChange={(event) => handleCreateFieldChange('periodStartDate', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>醫낅즺??/span>
              <input
                type="date"
                className="app-input"
                value={createForm.periodEndDate}
                onChange={(event) => handleCreateFieldChange('periodEndDate', event.target.value)}
              />
            </label>
          </div>

          {isCreateRangeInvalid ? (
            <div className={styles.errorNotice}>醫낅즺?쇱? ?쒖옉?쇰낫??鍮좊? ???놁뒿?덈떎.</div>
          ) : null}
          {createDialogError ? <div className={styles.errorNotice}>{createDialogError}</div> : null}
        </div>
      </AppModal>

      <AppModal
        open={Boolean(dialogReportId)}
        title="遺꾧린 蹂닿퀬 ??젣"
        onClose={closeDeleteDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeDeleteDialog}
            >
              痍⑥냼
            </button>
            <button
              type="button"
              className="app-button app-button-danger"
              onClick={() => void handleDeleteSubmit()}
              disabled={isDeletingReport}
            >
              {isDeletingReport ? '??젣 以?..' : '??젣'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {deletingRow
              ? `"${deletingRow.reportTitle}" 蹂닿퀬?쒕? ??젣?좉퉴??`
              : '?좏깮??蹂닿퀬?쒕? ??젣?좉퉴??'}
          </p>
          {deleteError ? <div className={styles.errorNotice}>{deleteError}</div> : null}
        </div>
      </AppModal>
    </>
  );
}
