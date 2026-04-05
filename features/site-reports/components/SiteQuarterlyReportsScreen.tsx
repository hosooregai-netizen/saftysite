'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import { PageBackControl } from '@/components/navigation/PageBackControl';
import AppModal from '@/components/ui/AppModal';
import ActionMenu from '@/components/ui/ActionMenu';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { buildSiteHubHref, buildSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import {
  applyQuarterlySummarySeed,
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
import { fetchQuarterlySummarySeed, readSafetyAuthToken } from '@/lib/safetyApi';
import { SiteReportsSummaryBar } from './SiteReportsSummaryBar';
import styles from './SiteReportsScreen.module.css';

interface SiteQuarterlyReportsScreenProps {
  siteKey: string;
}

type QuarterlyListSortMode = 'number' | 'recent' | 'name' | 'period';

interface QuarterlyListRow {
  sequenceNumber: number;
  href: string;
  reportId: string;
  reportTitle: string;
  quarterLabel: string;
  selectedCount: number;
  updatedAt: string;
  periodStartDate: string;
  periodEndDate: string;
  periodLabel: string;
}

interface CreateQuarterlyReportForm {
  title: string;
  periodStartDate: string;
  periodEndDate: string;
}

const EMPTY_CREATE_FORM: CreateQuarterlyReportForm = {
  title: '',
  periodStartDate: '',
  periodEndDate: '',
};

function shouldIgnoreRowClick(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'a, button, input, select, textarea, [role="button"], [role="menu"], [role="menuitem"]',
      ),
    )
  );
}

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
  return year > 0 && quarter >= 1 && quarter <= 4 ? `${quarter}분기` : '-';
}

function compareQuarterlyCreationOrder(
  left: { createdAt: string; updatedAt: string; reportId: string },
  right: { createdAt: string; updatedAt: string; reportId: string },
) {
  const createdDiff = getSortTime(left.createdAt) - getSortTime(right.createdAt);
  if (createdDiff !== 0) return createdDiff;

  const updatedDiff = getSortTime(left.updatedAt) - getSortTime(right.updatedAt);
  if (updatedDiff !== 0) return updatedDiff;

  return left.reportId.localeCompare(right.reportId, 'ko');
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

export function SiteQuarterlyReportsScreen({
  siteKey,
}: SiteQuarterlyReportsScreenProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<QuarterlyListSortMode>('number');
  const [dialogReportId, setDialogReportId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] =
    useState<CreateQuarterlyReportForm>(EMPTY_CREATE_FORM);
  const [hasEditedCreateTitle, setHasEditedCreateTitle] = useState(false);
  const [createDialogError, setCreateDialogError] = useState<string | null>(null);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const {
    authError,
    canArchiveReports,
    currentUser,
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
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const {
    deleteOperationalReport,
    quarterlyReports,
    isLoading,
    isSaving,
    error,
    saveQuarterlyReport,
  } = useSiteOperationalReports(
    currentSite,
    isAuthenticated && isReady && Boolean(currentSite),
  );

  const rows = useMemo<QuarterlyListRow[]>(() => {
    if (!currentSite) return [];

    return [...quarterlyReports]
      .sort((left, right) =>
        compareQuarterlyCreationOrder(
          {
            createdAt: left.createdAt,
            updatedAt: left.updatedAt || left.lastCalculatedAt || left.createdAt,
            reportId: left.id,
          },
          {
            createdAt: right.createdAt,
            updatedAt: right.updatedAt || right.lastCalculatedAt || right.createdAt,
            reportId: right.id,
          },
        ),
      )
      .map((report, index) => ({
        sequenceNumber: index + 1,
        href: buildSiteQuarterlyHref(currentSite.id, report.id),
        reportId: report.id,
        reportTitle: report.title || '분기 종합보고서',
        quarterLabel: getQuarterLabel(report.year, report.quarter),
        selectedCount: report.generatedFromSessionIds.length,
        updatedAt: report.updatedAt || report.lastCalculatedAt || report.createdAt,
        periodStartDate: report.periodStartDate,
        periodEndDate: report.periodEndDate,
        periodLabel: formatPeriodRangeLabel(
          report.periodStartDate,
          report.periodEndDate,
        ),
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
      if (sortMode === 'number') {
        return left.sequenceNumber - right.sequenceNumber;
      }

      if (sortMode === 'name') {
        return left.reportTitle.localeCompare(right.reportTitle, 'ko');
      }

      if (sortMode === 'period') {
        const rightKey = `${right.periodEndDate}|${right.periodStartDate}`;
        const leftKey = `${left.periodEndDate}|${left.periodStartDate}`;
        return (
          rightKey.localeCompare(leftKey, 'ko') ||
          getSortTime(right.updatedAt) - getSortTime(left.updatedAt)
        );
      }

      return getSortTime(right.updatedAt) - getSortTime(left.updatedAt);
    });
  }, [deferredQuery, rows, sortMode]);

  const existingReportTitles = useMemo(
    () => rows.map((row) => row.reportTitle),
    [rows],
  );

  const backHref = !isAdminView
    ? currentSite
      ? buildSiteHubHref(currentSite.id, 'quarterly')
      : '/'
    : currentSite
      ? getAdminSectionHref('headquarters', {
          headquarterId: currentSite.headquarterId,
          siteId: currentSite.id,
        })
      : getAdminSectionHref('headquarters');
  const backLabel = isAdminView ? '현장 메인' : '현장 메뉴';

  const snapshot = currentSite?.adminSiteSnapshot;
  const siteNameDisplay =
    currentSite?.siteName?.trim() || snapshot?.siteName?.trim() || '-';
  const addressDisplay = snapshot?.siteAddress?.trim() || '-';
  const periodDisplay = snapshot?.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot?.constructionAmount?.trim() || '-';
  const deletingRow = dialogReportId
    ? rows.find((row) => row.reportId === dialogReportId) ?? null
    : null;
  const isBusy = isSaving || isCreatingReport;
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
  const createQuarterSelection = String(
    getCreateQuarterSelectionTarget(createForm).quarter,
  );

  const resetCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setHasEditedCreateTitle(false);
    setCreateDialogError(null);
  };

  const openCreateDialog = () => {
    if (!currentSite || isBusy) return;
    resetCreateDialog();
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    if (isCreatingReport) return;
    setIsCreateDialogOpen(false);
    resetCreateDialog();
  };

  const handleCreatePeriodChange = (
    field: 'periodStartDate' | 'periodEndDate',
    value: string,
  ) => {
    setCreateDialogError(null);
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateQuarterChange = (value: string) => {
    const nextQuarter = Number.parseInt(value, 10);
    if (nextQuarter < 1 || nextQuarter > 4) {
      return;
    }

    setCreateDialogError(null);

    const currentTarget = getCreateQuarterSelectionTarget(createForm);
    const nextRange = getQuarterRange(currentTarget.year, nextQuarter);

    setCreateForm((current) => ({
      ...current,
      periodStartDate: nextRange.startDate,
      periodEndDate: nextRange.endDate,
      title: hasEditedCreateTitle
        ? current.title
        : getCreateTitleSuggestion(
            nextRange.startDate,
            nextRange.endDate,
            existingReportTitles,
          ),
    }));
  };

  const handleCreateTitleChange = (value: string) => {
    setCreateDialogError(null);
    setCreateForm((current) => ({
      ...current,
      title: value,
    }));
    setHasEditedCreateTitle(value.trim().length > 0);
  };

  const handleCreateReport = async () => {
    if (!currentSite || isBusy) return;

    const title = createForm.title.trim();
    const { periodStartDate, periodEndDate } = createForm;

    if (!title || !periodStartDate || !periodEndDate) {
      setCreateDialogError('제목과 기간을 입력해 주세요.');
      return;
    }

    if (periodStartDate > periodEndDate) {
      setCreateDialogError('기간을 다시 확인해 주세요.');
      return;
    }

    setIsCreatingReport(true);
    setCreateDialogError(null);

    try {
      const token = readSafetyAuthToken();
      if (!token) {
        throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      }

      const quarterTarget = getCreateQuarterSelectionTarget(createForm);
      const nextDraftBase = {
        ...createQuarterlySummaryDraft(
          currentSite,
          currentUser?.name || currentSite.assigneeName,
          periodStartDate,
        ),
        title,
        periodStartDate,
        periodEndDate,
        year: quarterTarget.year,
        quarter: quarterTarget.quarter,
        quarterKey: createQuarterKey(quarterTarget.year, quarterTarget.quarter),
      };
      const seed = await fetchQuarterlySummarySeed(token, currentSite.id, {
        periodStartDate,
        periodEndDate,
      });
      const nextDraft = applyQuarterlySummarySeed(nextDraftBase, seed);
      await saveQuarterlyReport(nextDraft);
      setIsCreateDialogOpen(false);
      resetCreateDialog();
      router.push(buildSiteQuarterlyHref(currentSite.id, nextDraft.id));
    } catch {
      setCreateDialogError(
        '보고서를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsCreatingReport(false);
    }
  };

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>
                분기 종합 보고서 목록을 불러오는 중입니다.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="분기 종합 보고서 로그인"
        description="분기 종합 보고서 목록을 보려면 다시 로그인해 주세요."
      />
    );
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>현장 정보를 찾을 수 없습니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            brandHref={isAdminView ? '/admin' : '/'}
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel
                  activeSection="headquarters"
                  currentSiteKey={currentSite.id}
                />
              ) : (
                <WorkerMenuPanel currentSiteKey={currentSite.id} />
              )}
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <PageBackControl href={backHref} label={backLabel} />
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>분기 종합 보고서 목록</h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <SiteReportsSummaryBar
                  addressDisplay={addressDisplay}
                  amountDisplay={amountDisplay}
                  periodDisplay={periodDisplay}
                  siteNameDisplay={siteNameDisplay}
                />

                <section className={styles.panel}>
                  <div className={styles.tableTools}>
                    <input
                      className={`app-input ${styles.tableSearch}`}
                      placeholder="보고서명, 기간 검색"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      aria-label="분기 종합 보고서 검색"
                    />
                    <select
                      className={`app-select ${styles.tableSort}`}
                      value={sortMode}
                      onChange={(event) =>
                        setSortMode(event.target.value as QuarterlyListSortMode)
                      }
                      aria-label="분기 종합 보고서 정렬"
                    >
                      <option value="number">번호순</option>
                      <option value="recent">최근 수정일순</option>
                      <option value="name">보고서명순</option>
                      <option value="period">기간순</option>
                    </select>
                    <button
                      type="button"
                      className={`app-button app-button-primary ${styles.tableCreateButton}`}
                      onClick={openCreateDialog}
                      disabled={isBusy}
                    >
                      보고서 작성
                    </button>
                  </div>

                  {error ? (
                    <div className={styles.tableTools}>
                      <span>{error}</span>
                    </div>
                  ) : null}

                  {(isLoading || (!error && rows.length === 0)) && rows.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>
                        {isLoading
                          ? '분기 종합 보고서 목록을 불러오는 중입니다.'
                          : '아직 작성한 분기 종합 보고서가 없습니다.'}
                      </p>
                    </div>
                  ) : filteredRows.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>
                        검색 조건에 맞는 분기 보고서가 없습니다.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.listViewport}>
                      <div className={styles.listTrack}>
                        <div
                          className={`${styles.listHead} ${styles.quarterlyListHead}`}
                          aria-hidden="true"
                        >
                          <span>번호</span>
                          <span>보고서명</span>
                          <span>선택 보고서</span>
                          <span className={styles.desktopOnly}>수정일</span>
                          <span className={styles.desktopOnly}>기간</span>
                          <span>메뉴</span>
                        </div>

                        <div className={styles.reportList}>
                          {filteredRows.map((row) => (
                            <article
                              key={row.reportId}
                              className={`${styles.reportRow} ${styles.quarterlyReportRow} ${styles.reportRowClickable}`}
                              tabIndex={0}
                              role="link"
                              onClick={(event) => {
                                if (shouldIgnoreRowClick(event.target)) return;
                                router.push(row.href);
                              }}
                              onKeyDown={(event) => {
                                if (shouldIgnoreRowClick(event.target)) return;
                                if (event.key !== 'Enter' && event.key !== ' ') return;
                                event.preventDefault();
                                router.push(row.href);
                              }}
                            >
                              <div className={`${styles.dataCell} ${styles.sequenceCell}`}>
                                <span className={styles.dataValue}>{row.sequenceNumber}</span>
                              </div>

                              <div className={`${styles.primaryCell} ${styles.titleCell}`}>
                                <Link href={row.href} className={styles.reportLink}>
                                  {row.reportTitle}
                                </Link>
                              </div>

                              <div className={styles.dataCell}>
                                <span className={styles.dataValue}>
                                  {row.selectedCount}건
                                </span>
                              </div>

                              <div className={`${styles.dataCell} ${styles.desktopOnly}`}>
                                <span className={styles.dataValue}>
                                  {formatDateTimeLabel(row.updatedAt)}
                                </span>
                              </div>

                              <div className={`${styles.dataCell} ${styles.desktopOnly}`}>
                                <span className={styles.dataValue}>
                                  {row.quarterLabel} {row.periodLabel}
                                </span>
                              </div>

                              <div
                                className={`${styles.actionCell} ${styles.actionsCell}`}
                                onClick={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}
                              >
                                <ActionMenu
                                  label={`${row.reportTitle} 작업 메뉴 열기`}
                                  items={[
                                    {
                                      label: '열기',
                                      href: row.href,
                                    },
                                    ...(canArchiveReports
                                      ? [
                                          {
                                            label: '삭제',
                                            tone: 'danger' as const,
                                            onSelect: () => setDialogReportId(row.reportId),
                                          },
                                        ]
                                      : []),
                                  ]}
                                />
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      {isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSection="headquarters"
          currentSiteKey={currentSite.id}
        />
      ) : (
        <WorkerMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentSiteKey={currentSite.id}
        />
      )}

      <AppModal
        open={isCreateDialogOpen}
        title="분기 종합 보고서 생성"
        size="large"
        onClose={closeCreateDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeCreateDialog}
              disabled={isBusy}
            >
              취소
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
        <div className={styles.createDialogBody}>
          <label className={styles.createDialogField}>
            <span className={styles.createDialogLabel}>제목</span>
            <input
              className="app-input"
              value={createForm.title}
              onChange={(event) => handleCreateTitleChange(event.target.value)}
              placeholder="예: 2026년 2분기 종합보고서"
              disabled={isBusy}
            />
          </label>

          <div className={styles.createDialogPeriodGrid}>
            <label
              className={`${styles.createDialogField} ${styles.createDialogQuarterField}`}
            >
              <span className={styles.createDialogLabel}>분기</span>
              <select
                className="app-select"
                value={createQuarterSelection}
                onChange={(event) => handleCreateQuarterChange(event.target.value)}
                disabled={isBusy}
                aria-label="분기"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </label>

            <label className={styles.createDialogField}>
              <span className={styles.createDialogLabel}>시작일</span>
              <input
                className="app-input"
                type="date"
                value={createForm.periodStartDate}
                onChange={(event) =>
                  handleCreatePeriodChange('periodStartDate', event.target.value)
                }
                disabled={isBusy}
              />
            </label>

            <label className={styles.createDialogField}>
              <span className={styles.createDialogLabel}>종료일</span>
              <input
                className="app-input"
                type="date"
                value={createForm.periodEndDate}
                onChange={(event) =>
                  handleCreatePeriodChange('periodEndDate', event.target.value)
                }
                disabled={isBusy}
              />
            </label>
          </div>

          {createDialogError ? (
            <p className={styles.createDialogError}>{createDialogError}</p>
          ) : null}
        </div>
      </AppModal>

      <AppModal
        open={canArchiveReports && Boolean(dialogReportId)}
        title="분기 종합 보고서 삭제"
        onClose={() => setDialogReportId(null)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setDialogReportId(null)}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-danger"
              disabled={isSaving || !dialogReportId}
              onClick={() => {
                if (!dialogReportId) return;
                void deleteOperationalReport(dialogReportId);
                setDialogReportId(null);
              }}
            >
              삭제
            </button>
          </>
        }
      >
        <p>
          {deletingRow
            ? `"${deletingRow.reportTitle}" 보고서를 삭제합니다.`
            : '선택한 분기 종합 보고서를 삭제합니다.'}
        </p>
      </AppModal>
    </main>
  );
}
