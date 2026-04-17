import type {
  AppState,
  BadWorkplaceReport,
  BadWorkplaceSourceMode,
  DispatchSignal,
  Doc7Finding,
  PhotoAlbumItem,
  QuarterlyReport,
  ReviewState,
  SessionReport,
  Site,
  SiteSnapshot,
  StatBucket,
  User,
  ViolationRow,
} from './types';

export const DEMO_TODAY = '2026-04-17';
export const DEMO_NOW = '2026-04-17T09:30:00+09:00';

export type ControllerReportRow = {
  reportKey: string;
  routeHref: string;
  routeParam: string;
  reportType: 'technical_guidance' | 'quarterly_report' | 'bad_workplace';
  reportTitle: string;
  periodLabel: string;
  siteId: string;
  siteName: string;
  headquarterId: string;
  headquarterName: string;
  assigneeUserId?: string;
  assigneeName?: string;
  checkerUserId?: string;
  qualityStatus: ReviewState['qualityStatus'];
  controllerReview?: string;
  dispatchStatus: string;
  dispatchSignal: DispatchSignal;
  deadlineDate?: string;
  status: string;
  workflowStatus: string;
  lifecycleStatus: string;
  visitDate?: string;
  updatedAt: string;
  unsentDays: number;
};

export type OverviewModel = {
  siteStatusSummary: { label: string; value: number; href: string }[];
  quarterlyMaterialSummary: { label: string; value: number; href: string }[];
  deadlineSignalSummary: { label: string; value: number; href: string }[];
  unsentReportRows: ControllerReportRow[];
  priorityQuarterlyManagementRows: ControllerReportRow[];
  endingSoonRows: Site[];
  materialRows: Site[];
};

export const sessionSteps = [
  ['step2', '개요'],
  ['step3', '현장 전경'],
  ['step4', '이전 기술지도'],
  ['step5', '총평'],
  ['step6', '사망 기인물'],
  ['step7', '위험요인 지적'],
  ['step8', '향후 진행공정'],
  ['step9', '위험성평가 / TBM'],
  ['step10', '계측점검'],
  ['step11', '안전교육'],
  ['step12', '활동 실적'],
] as const;

export const accidentOptions = ['떨어짐', '부딪힘', '감전', '협착', '무너짐'];
export const riskOptions = ['상', '중', '하'];
export const causativeAgentOptions = [
  { value: 'scaffold', label: '비계/발판' },
  { value: 'traffic', label: '동선 충돌' },
  { value: 'opening', label: '개구부' },
  { value: 'electric', label: '전기' },
  { value: 'heavy', label: '중장비' },
];

export function formatDate(value?: string) {
  if (!value) {
    return '-';
  }
  return value.slice(0, 10);
}

export function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }
  return value.slice(0, 16).replace('T', ' ');
}

export function formatCurrency(value: number) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}원`;
}

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function getMonthKey(date = DEMO_TODAY) {
  return date.slice(0, 7);
}

export function parseDate(value?: string) {
  return value ? new Date(`${value.length > 10 ? value : `${value}T00:00:00+09:00`}`) : null;
}

export function diffInDays(from?: string, to = DEMO_TODAY) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) {
    return 0;
  }
  return Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildMonthCalendar(month: string) {
  const [yearRaw, monthRaw] = month.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  const days = [];
  for (let index = 0; index < 42; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const value = current.toISOString().slice(0, 10);
    days.push({
      value,
      day: current.getDate(),
      inMonth: current >= first && current <= last,
    });
  }
  return days;
}

export function buildWindowErrorMessage(row?: { windowStart: string; windowEnd: string }, plannedDate?: string) {
  if (!row || !plannedDate) {
    return '';
  }

  if (plannedDate < row.windowStart || plannedDate > row.windowEnd) {
    return `허용 방문일은 ${row.windowStart} ~ ${row.windowEnd} 입니다.`;
  }

  return '';
}

export function parseReferenceLawTitles(value: string) {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getSiteById(state: AppState, siteId?: string) {
  return state.sites.find((site) => site.id === siteId);
}

export function getSessionById(state: AppState, sessionId?: string) {
  return state.sessions.find((session) => session.id === sessionId);
}

export function getQuarterLabel(quarterKey: string) {
  return quarterKey.replace('-', '년 ').replace('Q', 'Q');
}

export function getQuarterPeriod(quarterKey: string) {
  const [yearValue, quarterValue] = quarterKey.split('-Q');
  const year = Number(yearValue);
  const quarter = Number(quarterValue);
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const start = `${year}-${String(startMonth).padStart(2, '0')}-01`;
  const endDate = new Date(year, endMonth, 0);
  const end = endDate.toISOString().slice(0, 10);
  return { year, quarter, start, end };
}

export function getReportRoute(reportType: ControllerReportRow['reportType'], siteId: string, reportKey: string) {
  if (reportType === 'technical_guidance') {
    return `/sessions/${encodeURIComponent(reportKey)}`;
  }

  if (reportType === 'quarterly_report') {
    const quarterKey = reportKey.split('quarterly-')[1]?.split('-').slice(1).join('-') ?? '2026-Q1';
    return `/sites/${siteId}/quarterly/${quarterKey}`;
  }

  const reportMonth = reportKey.slice(-7);
  return `/sites/${siteId}/bad-workplace/${reportMonth}`;
}

function getDispatchSignal(deadlineDate?: string, sent?: boolean): DispatchSignal {
  if (sent) {
    return 'sent';
  }
  if (!deadlineDate) {
    return 'normal';
  }
  const diff = diffInDays(deadlineDate, DEMO_TODAY);
  if (diff > 0) {
    return 'overdue';
  }
  if (diff >= -3) {
    return 'warning';
  }
  return 'normal';
}

function getDispatchStatus(signal: DispatchSignal) {
  if (signal === 'sent') {
    return '발송 완료';
  }
  if (signal === 'overdue') {
    return '지연';
  }
  if (signal === 'warning') {
    return '임박';
  }
  return '대기';
}

export function buildControllerReportRows(state: AppState): ControllerReportRow[] {
  const siteMap = new Map(state.sites.map((site) => [site.id, site]));

  const technicalRows = state.sessions.map((session) => {
    const site = siteMap.get(session.siteId);
    const signal = getDispatchSignal(session.dispatch.deadlineDate, session.dispatch.sent);
    return {
      reportKey: session.id,
      routeHref: `/sessions/${encodeURIComponent(session.id)}`,
      routeParam: session.id,
      reportType: 'technical_guidance' as const,
      reportTitle: session.reportTitle,
      periodLabel: `${session.visitDate} / ${session.reportNumber}회차`,
      siteId: session.siteId,
      siteName: session.siteName,
      headquarterId: site?.headquarterId ?? '',
      headquarterName: site?.headquarterName ?? '',
      assigneeUserId: site?.guidanceOfficerId,
      assigneeName: site?.guidanceOfficerName,
      checkerUserId: session.review.checkerUserId,
      qualityStatus: session.review.qualityStatus,
      controllerReview: session.review.note,
      dispatchStatus: getDispatchStatus(signal),
      dispatchSignal: signal,
      deadlineDate: session.dispatch.deadlineDate,
      status: session.status,
      workflowStatus: session.status,
      lifecycleStatus: session.dispatch.sent ? 'completed' : 'draft',
      visitDate: session.visitDate,
      updatedAt: session.updatedAt,
      unsentDays: session.dispatch.sent ? 0 : diffInDays(session.visitDate),
    };
  });

  const quarterlyRows = state.quarterlyReports.map((report) => {
    const site = siteMap.get(report.siteId);
    const signal = getDispatchSignal(report.dispatch.deadlineDate, report.dispatch.sent);
    return {
      reportKey: report.id,
      routeHref: `/sites/${report.siteId}/quarterly/${report.quarterKey}`,
      routeParam: report.quarterKey,
      reportType: 'quarterly_report' as const,
      reportTitle: report.title,
      periodLabel: `${report.year}년 ${report.quarter}분기`,
      siteId: report.siteId,
      siteName: site?.siteName ?? '',
      headquarterId: site?.headquarterId ?? '',
      headquarterName: site?.headquarterName ?? '',
      assigneeUserId: site?.guidanceOfficerId,
      assigneeName: site?.guidanceOfficerName,
      checkerUserId: report.review.checkerUserId,
      qualityStatus: report.review.qualityStatus,
      controllerReview: report.controllerReview ?? report.review.note,
      dispatchStatus: getDispatchStatus(signal),
      dispatchSignal: signal,
      deadlineDate: report.dispatch.deadlineDate,
      status: report.status,
      workflowStatus: report.status,
      lifecycleStatus: report.dispatch.sent ? 'completed' : 'draft',
      visitDate: report.periodEndDate,
      updatedAt: report.updatedAt,
      unsentDays: report.dispatch.sent ? 0 : diffInDays(report.periodEndDate),
    };
  });

  const badWorkplaceRows = state.badWorkplaceReports.map((report) => {
    const site = siteMap.get(report.siteId);
    const signal = getDispatchSignal(report.dispatch.deadlineDate, report.dispatch.sent);
    return {
      reportKey: report.id,
      routeHref: `/sites/${report.siteId}/bad-workplace/${report.reportMonth}`,
      routeParam: report.reportMonth,
      reportType: 'bad_workplace' as const,
      reportTitle: report.title,
      periodLabel: report.reportMonth,
      siteId: report.siteId,
      siteName: site?.siteName ?? '',
      headquarterId: site?.headquarterId ?? '',
      headquarterName: site?.headquarterName ?? '',
      assigneeUserId: site?.guidanceOfficerId,
      assigneeName: site?.guidanceOfficerName,
      checkerUserId: report.review.checkerUserId,
      qualityStatus: report.review.qualityStatus,
      controllerReview: report.controllerReview ?? report.review.note,
      dispatchStatus: getDispatchStatus(signal),
      dispatchSignal: signal,
      deadlineDate: report.dispatch.deadlineDate,
      status: report.status,
      workflowStatus: report.status,
      lifecycleStatus: report.dispatch.sent ? 'completed' : 'draft',
      visitDate: report.guidanceDate,
      updatedAt: report.updatedAt,
      unsentDays: report.dispatch.sent ? 0 : diffInDays(report.guidanceDate),
    };
  });

  return [...technicalRows, ...quarterlyRows, ...badWorkplaceRows].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export function buildOverviewModel(state: AppState): OverviewModel {
  const reportRows = buildControllerReportRows(state);
  const siteStatusSummary = ['운영중', '준비중', '종료 임박', '휴면'].map((label) => ({
    label,
    value: state.sites.filter((site) => site.status === label).length,
    href: '/admin/sites',
  }));

  const quarterlyMaterialSummary = [
    {
      label: '교육 누락',
      value: state.sites.filter((site) => site.material.educationMissing > 0).length,
      href: '/admin',
    },
    {
      label: '계측 누락',
      value: state.sites.filter((site) => site.material.measurementMissing > 0).length,
      href: '/admin',
    },
    {
      label: '모두 충족',
      value: state.sites.filter(
        (site) => site.material.educationMissing === 0 && site.material.measurementMissing === 0,
      ).length,
      href: '/admin',
    },
  ];

  const deadlineSignalSummary = ['overdue', 'warning', 'sent'].map((signal) => ({
    label: signal === 'overdue' ? '지연' : signal === 'warning' ? '임박' : '완료',
    value: reportRows.filter((row) => row.dispatchSignal === signal).length,
    href: '/admin/reports',
  }));

  const unsentReportRows = reportRows.filter((row) => row.dispatchSignal !== 'sent').slice(0, 8);
  const priorityQuarterlyManagementRows = reportRows
    .filter((row) => row.reportType === 'quarterly_report')
    .sort((left, right) => right.unsentDays - left.unsentDays)
    .slice(0, 5);
  const endingSoonRows = state.sites
    .filter((site) => diffInDays(DEMO_TODAY, site.projectEndDate) <= 45)
    .sort((left, right) => left.projectEndDate.localeCompare(right.projectEndDate));
  const materialRows = state.sites
    .filter((site) => site.material.educationMissing + site.material.measurementMissing > 0)
    .sort(
      (left, right) =>
        right.material.educationMissing +
        right.material.measurementMissing -
        (left.material.educationMissing + left.material.measurementMissing),
    );

  return {
    siteStatusSummary,
    quarterlyMaterialSummary,
    deadlineSignalSummary,
    unsentReportRows,
    priorityQuarterlyManagementRows,
    endingSoonRows,
    materialRows,
  };
}

export function groupSchedulesByDate<T extends { plannedDate?: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((accumulator, row) => {
    if (!row.plannedDate) {
      return accumulator;
    }
    accumulator[row.plannedDate] = [...(accumulator[row.plannedDate] ?? []), row];
    return accumulator;
  }, {});
}

export function sortSchedules<T extends { plannedDate?: string; roundNo: number; siteName: string }>(rows: T[]) {
  return [...rows].sort((left, right) => {
    const leftDate = left.plannedDate ?? '9999-99-99';
    const rightDate = right.plannedDate ?? '9999-99-99';
    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }
    if (left.roundNo !== right.roundNo) {
      return left.roundNo - right.roundNo;
    }
    return left.siteName.localeCompare(right.siteName, 'ko');
  });
}

export function getEligibleScheduleRows<T extends { plannedDate?: string; id: string; windowStart: string; windowEnd: string }>(
  rows: T[],
  plannedDate: string,
  activeScheduleId?: string,
) {
  return rows.filter(
    (row) =>
      ((!row.plannedDate || row.id === activeScheduleId) &&
        plannedDate >= row.windowStart &&
        plannedDate <= row.windowEnd) ||
      row.id === activeScheduleId,
  );
}

export function calculateSessionProgress(session: SessionReport) {
  const fields = [
    session.summary.overview,
    session.summary.siteScene,
    session.summary.previousGuidance,
    session.summary.totalComment,
    session.summary.deathFactors,
    session.summary.futureProcess,
    session.summary.riskAssessment,
    session.summary.measurement,
    session.summary.education,
    session.summary.activity,
  ];
  const findingCompletion = session.document7Findings.reduce((count, finding) => {
    if (finding.location && finding.hazardDescription && finding.improvementRequest) {
      return count + 1;
    }
    return count;
  }, 0);
  const filled = fields.filter(Boolean).length + findingCompletion;
  return Math.min(100, Math.round((filled / (fields.length + Math.max(session.document7Findings.length, 1))) * 100));
}

export function buildSiteSnapshot(site: Site): SiteSnapshot {
  return {
    headquarterName: site.headquarterName,
    siteName: site.siteName,
    siteAddress: site.siteAddress,
    siteManagerName: site.siteManagerName,
    siteManagerContact: site.siteManagerContact,
    assigneeName: site.guidanceOfficerName ?? '',
  };
}

export function createDefaultFinding(seed: string, userName: string): Doc7Finding {
  return {
    id: seed,
    location: '',
    accidentType: accidentOptions[0],
    riskLevel: riskOptions[1],
    causativeAgentKey: causativeAgentOptions[0].value,
    hazardDescription: '',
    improvementPlan: '',
    improvementRequest: '',
    emphasis: `${userName} 작성`,
    legalReferenceTitle: '',
    referenceLawTitles: [],
    followUpStatus: 'pending',
  };
}

export function createSessionDraft(site: Site, reportDate: string, reportTitle: string, reportNumber: number, user: User): SessionReport {
  const sessionId = `session-${site.id}-${reportDate}`;
  return {
    id: sessionId,
    reportKind: 'technical_guidance',
    siteId: site.id,
    siteName: site.siteName,
    reportTitle,
    visitDate: reportDate,
    reportNumber,
    drafterName: user.name,
    reviewerName: '',
    approverName: site.siteManagerName,
    updatedAt: DEMO_NOW,
    lastAutosavedAt: DEMO_NOW,
    progress: 12,
    status: 'draft',
    summary: {
      overview: '',
      siteScene: '',
      previousGuidance: '',
      totalComment: '',
      deathFactors: '',
      futureProcess: '',
      riskAssessment: '',
      measurement: '',
      education: '',
      activity: '',
    },
    document7Findings: [createDefaultFinding(`finding-${sessionId}-1`, user.name)],
    review: { qualityStatus: 'unchecked' },
    dispatch: { sent: false, phone: site.siteManagerContact, deadlineDate: reportDate, message: '기술지도 보고서 작성 중입니다.' },
  };
}

export function createQuarterlyDraft(site: Site, quarterKey: string, drafterName: string, sourceSessions: SessionReport[]): QuarterlyReport {
  const { year, quarter, start, end } = getQuarterPeriod(quarterKey);
  const draft: QuarterlyReport = {
    id: `quarterly-${site.id}-${quarterKey}`,
    reportKind: 'quarterly_report',
    siteId: site.id,
    title: `${site.siteName} ${year}년 ${quarter}분기 종합보고서`,
    quarterKey,
    year,
    quarter,
    periodStartDate: start,
    periodEndDate: end,
    generatedFromSessionIds: [],
    explicitSelection: false,
    drafter: drafterName,
    reviewer: '',
    approver: site.siteManagerName,
    updatedAt: DEMO_NOW,
    siteSnapshot: buildSiteSnapshot(site),
    implementationRows: [],
    accidentStats: [],
    causativeStats: [],
    futurePlans: [],
    majorMeasures: [],
    opsAssetId: 'ops-default',
    opsAssetTitle: '분기 안전 운영 포스터',
    opsAssetDescription: '분기별 핵심 지적사항을 현장 게시용 문구로 정리합니다.',
    opsAssetPreviewUrl: '',
    review: { qualityStatus: 'unchecked' },
    dispatch: { sent: false, deadlineDate: `${year}-04-20`, phone: site.siteManagerContact, message: '분기 종합보고서 발송 준비 중입니다.' },
    status: 'draft',
  };

  return recalculateQuarterlyDraft(draft, sourceSessions, sourceSessions.map((session) => session.id));
}

function aggregateBuckets(values: string[], labels: Record<string, string> = {}) {
  const counter = new Map<string, number>();
  values.forEach((value) => {
    const key = value || '기타';
    counter.set(key, (counter.get(key) ?? 0) + 1);
  });
  return [...counter.entries()].map<StatBucket>(([key, value]) => ({
    label: labels[key] ?? key,
    value,
  }));
}

export function recalculateQuarterlyDraft(
  draft: QuarterlyReport,
  sourceSessions: SessionReport[],
  selectedSourceIds: string[],
) {
  const selectedRows = sourceSessions.filter((session) => selectedSourceIds.includes(session.id));
  const implementationRows = selectedRows.map((session) => ({
    id: `impl-${session.id}`,
    sourceSessionId: session.id,
    reportTitle: session.reportTitle,
    guidanceDate: session.visitDate,
    findingCount: session.document7Findings.length,
    completionStatus: session.document7Findings.some((finding) => finding.followUpStatus !== 'resolved')
      ? `${session.document7Findings.filter((finding) => finding.followUpStatus !== 'resolved').length}건 추적 중`
      : '조치 완료',
  }));
  const allFindings = selectedRows.flatMap((session) => session.document7Findings);
  const accidentStats = aggregateBuckets(allFindings.map((finding) => finding.accidentType));
  const causativeStats = aggregateBuckets(
    allFindings.map((finding) => finding.causativeAgentKey),
    Object.fromEntries(causativeAgentOptions.map((item) => [item.value, item.label])),
  );
  const futurePlans = selectedRows.map((session) => session.summary.futureProcess).filter(Boolean);
  const majorMeasures = [...new Set(allFindings.map((finding) => finding.improvementRequest).filter(Boolean))];

  return {
    ...draft,
    generatedFromSessionIds: selectedSourceIds,
    explicitSelection: true,
    lastCalculatedAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
    implementationRows,
    accidentStats,
    causativeStats,
    futurePlans,
    majorMeasures,
  };
}

export function getSourceModeLabel(mode: BadWorkplaceSourceMode) {
  return mode === 'previous_unresolved' ? '이전 지적사항 미이행' : '당회차 신규 위험';
}

export function buildBadWorkplaceViolations(session: SessionReport | undefined, mode: BadWorkplaceSourceMode): ViolationRow[] {
  if (!session) {
    return [];
  }
  const sourceFindings =
    mode === 'previous_unresolved'
      ? session.document7Findings.filter((finding) => finding.followUpStatus !== 'resolved')
      : session.document7Findings;

  return sourceFindings.map((finding) => ({
    id: `violation-${finding.id}`,
    sourceFindingId: finding.id,
    legalReference: finding.legalReferenceTitle,
    hazardFactor: finding.hazardDescription,
    improvementMeasure: finding.improvementRequest,
    guidanceDate: session.visitDate,
    nonCompliance:
      mode === 'current_new_hazard'
        ? '당회차 신규 위험요인으로 즉시 개선이 요구됩니다.'
        : finding.followUpNote || '이전 지적사항이 미이행 상태로 유지되고 있습니다.',
    confirmationDate: DEMO_TODAY,
    accidentType: finding.accidentType,
    causativeAgentKey: finding.causativeAgentKey,
  }));
}

export function createBadWorkplaceDraft(
  site: Site,
  reportMonth: string,
  reporter: User,
  sourceSession?: SessionReport,
): BadWorkplaceReport {
  return {
    id: `bad-${site.id}-${reportMonth}-${reporter.id}`,
    reportKind: 'bad_workplace',
    siteId: site.id,
    title: `${site.siteName} ${reportMonth} 고위험 취약 현장 통보서`,
    reportMonth,
    status: 'draft',
    dispatchCompleted: false,
    sourceMode: 'current_new_hazard',
    sourceSessionId: sourceSession?.id,
    sourceFindingIds: sourceSession?.document7Findings.map((finding) => finding.id) ?? [],
    guidanceDate: sourceSession?.visitDate,
    confirmationDate: DEMO_TODAY,
    progressRate: 0,
    implementationCount: 0,
    reporterUserId: reporter.id,
    reporterName: reporter.name,
    receiverName: site.siteManagerName,
    assigneeContact: reporter.phone,
    agencyName: '한국종합안전',
    agencyRepresentative: '장정규',
    notificationDate: DEMO_TODAY,
    attachmentDescription: '현장 사진 첨부',
    siteSnapshot: buildSiteSnapshot(site),
    violations: buildBadWorkplaceViolations(sourceSession, 'current_new_hazard'),
    updatedAt: DEMO_NOW,
    review: { qualityStatus: 'unchecked' },
    dispatch: { sent: false, deadlineDate: DEMO_TODAY, phone: site.siteManagerContact, message: '고위험 취약 현장 통보서 준비 중입니다.' },
  };
}

export function recalculateBadWorkplaceDraft(
  draft: BadWorkplaceReport,
  sourceSession: SessionReport | undefined,
  mode: BadWorkplaceSourceMode,
) {
  const violations = buildBadWorkplaceViolations(sourceSession, mode);
  return {
    ...draft,
    sourceMode: mode,
    sourceSessionId: sourceSession?.id,
    sourceFindingIds: violations.map((row) => row.sourceFindingId ?? row.id),
    guidanceDate: sourceSession?.visitDate,
    violations,
    implementationCount: violations.length,
    progressRate: violations.length === 0 ? 0 : Math.min(100, 40 + violations.length * 20),
    updatedAt: DEMO_NOW,
  };
}

export function simulateDoc7AiPatch(finding: Doc7Finding) {
  const seed = finding.causativeAgentKey || 'scaffold';
  const locationMap: Record<string, string> = {
    scaffold: '비계 작업 통로',
    traffic: '양중 반입 동선',
    opening: '개구부 작업구간',
    electric: '임시 전기 사용 구간',
    heavy: '중장비 접근 구간',
  };
  const hazardMap: Record<string, string> = {
    scaffold: '발판 단차와 적치물로 인해 이동 중 추락 위험이 있습니다.',
    traffic: '작업자 동선과 장비 동선이 겹쳐 충돌 위험이 있습니다.',
    opening: '방호 미흡 개구부로 추락 위험이 있습니다.',
    electric: '임시 전선 노출과 방수 미흡으로 감전 위험이 있습니다.',
    heavy: '중장비 회전 반경 관리가 미흡해 협착 위험이 있습니다.',
  };
  const requestMap: Record<string, string> = {
    scaffold: '통로 폭 확보와 발판 상태를 즉시 개선해 주세요.',
    traffic: '차단봉과 신호수 운영으로 작업 동선을 분리해 주세요.',
    opening: '개구부 방호덮개 고정과 경고표지를 즉시 보강해 주세요.',
    electric: '전선 상향 정리와 방수 조치를 완료해 주세요.',
    heavy: '중장비 접근 통제선과 유도자를 배치해 주세요.',
  };

  return {
    location: finding.location || locationMap[seed] || '현장 주요 작업구간',
    hazardDescription: hazardMap[seed] || '작업 환경 점검이 필요합니다.',
    improvementPlan: requestMap[seed] || '즉시 개선 조치가 필요합니다.',
    improvementRequest: requestMap[seed] || '즉시 개선 조치가 필요합니다.',
    accidentType: finding.accidentType || '떨어짐',
    riskLevel: finding.riskLevel || '중',
    legalReferenceTitle: finding.legalReferenceTitle || '산업안전보건기준에 관한 규칙',
    referenceLawTitles: parseReferenceLawTitles(
      finding.legalReferenceTitle || '산업안전보건기준에 관한 규칙',
    ),
  };
}

export function buildPhotoItemFromUpload(
  site: Site,
  user: User,
  dataUrl: string,
  fileName: string,
): PhotoAlbumItem {
  return {
    id: `photo-${site.id}-${Math.random().toString(36).slice(2, 8)}`,
    siteId: site.id,
    siteName: site.siteName,
    headquarterId: site.headquarterId,
    headquarterName: site.headquarterName,
    previewUrl: dataUrl,
    downloadUrl: dataUrl,
    fileName,
    contentType: 'image/jpeg',
    sizeBytes: 500000,
    capturedAt: DEMO_NOW,
    createdAt: DEMO_NOW,
    uploadedByUserId: user.id,
    uploadedByName: user.name,
    sourceKind: 'album_upload',
  };
}

export function getSiteSessionsForQuarter(siteSessions: SessionReport[], quarterKey: string) {
  const period = getQuarterPeriod(quarterKey);
  return siteSessions.filter((session) => session.visitDate >= period.start && session.visitDate <= period.end);
}

export function getNewestSiteSession(siteSessions: SessionReport[]) {
  return [...siteSessions].sort((left, right) => right.visitDate.localeCompare(left.visitDate))[0];
}

export function filterPhotos(
  photos: PhotoAlbumItem[],
  query: string,
  source: 'all' | 'album_upload' | 'legacy_import',
) {
  const trimmed = query.trim().toLowerCase();
  return photos.filter((photo) => {
    const matchesQuery =
      !trimmed ||
      photo.fileName.toLowerCase().includes(trimmed) ||
      photo.siteName.toLowerCase().includes(trimmed) ||
      (photo.sourceReportTitle ?? '').toLowerCase().includes(trimmed);
    const matchesSource = source === 'all' || photo.sourceKind === source;
    return matchesQuery && matchesSource;
  });
}

