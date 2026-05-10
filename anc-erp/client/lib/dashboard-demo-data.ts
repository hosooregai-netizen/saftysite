import type {
  DashboardAlert,
  DashboardInsightRun,
  DashboardMetric,
  DashboardMyWorkResponse,
  DashboardOverviewResponse,
  DashboardSnapshot,
  DashboardWidget,
  FindingAgingBucket,
  InspectionRound,
  MailMessage,
  OwnerReportStatusSummary,
  Project,
  ProjectDashboardResponse,
  ProjectHealthMetric,
  StatisticsMetric,
} from "../../packages/contracts/src";

function sampleWidget(id: string, title: string, widgetType: string, route: string, displayOrder: number): DashboardWidget {
  return {
    id,
    title,
    widgetType,
    route,
    scope: "global",
    displayOrder,
    settings: {},
    enabled: true,
    createdAt: "2026-05-10T16:30:00+09:00",
    updatedAt: "2026-05-10T16:30:00+09:00",
  };
}

function sampleMetric(id: string, label: string, value: number, route: string, status = "info"): DashboardMetric {
  return {
    id,
    metricKey: id,
    label,
    value,
    status,
    route,
    metadata: {},
  };
}

export function getSampleDashboardWidgets(): DashboardWidget[] {
  return [
    sampleWidget("dashboard-widget-001", "오늘 점검", "today_inspections", "/dashboard", 1),
    sampleWidget("dashboard-widget-002", "보고서 제출 상태", "submission_status", "/dashboard/documents", 2),
    sampleWidget("dashboard-widget-003", "지적사항 경과", "finding_aging", "/dashboard/findings", 3),
  ];
}

export function getSampleDashboardAlerts(): DashboardAlert[] {
  return [
    {
      id: "dashboard-alert-001",
      alertKey: "report_overdue",
      scope: "project",
      severity: "warning",
      title: "발주처별 보고서 제출 지연",
      message: "삼성문화재단 제출본이 아직 제출 상태가 아닙니다.",
      route: "/dashboard/documents",
      projectId: "project-sample-001",
      ownerPartyId: "owner-samsung-cultural-foundation",
      inspectionRoundId: "round-sample-001",
      documentId: "doc-sample-001",
      status: "open",
      createdAt: "2026-05-10T16:30:00+09:00",
      updatedAt: "2026-05-10T16:30:00+09:00",
    },
  ];
}

export function getSampleDashboardSnapshot(metrics: DashboardMetric[], alerts: DashboardAlert[]): DashboardSnapshot {
  return {
    id: "dashboard-snapshot-sample-001",
    scope: "global",
    snapshotDate: "2026-05-10",
    metrics,
    alerts: alerts.map((item) => item.id),
    createdAt: "2026-05-10T16:30:00+09:00",
  };
}

export function getSampleDashboardOverview(): DashboardOverviewResponse {
  const metrics = [
    sampleMetric("active_projects", "활성 프로젝트", 1, "/dashboard/projects"),
    sampleMetric("overdue_reports", "제출 지연 보고서", 2, "/dashboard/documents", "warning"),
    sampleMetric("open_findings", "미조치 지적사항", 4, "/dashboard/findings", "danger"),
    sampleMetric("pending_approvals", "결재 대기", 1, "/dashboard/approvals", "review"),
  ];
  const todayInspections: InspectionRound[] = [];
  const upcomingInspections: InspectionRound[] = [
    {
      id: "round-sample-001",
      projectId: "project-sample-001",
      name: "1회 점검",
      status: "checked",
      roundNo: 1,
      plannedMonth: "2026-05",
      plannedDate: "2026-05-10",
      actualInspectionDate: "2026-05-10",
      documentInstances: [],
    },
  ];
  const reportDueItems: OwnerReportStatusSummary[] = [
    {
      id: "owner-report-summary-001",
      projectId: "project-sample-001",
      inspectionRoundId: "round-sample-001",
      ownerPartyId: "owner-samsung-cultural-foundation",
      ownerDisplayName: "삼성문화재단",
      status: "drafting",
      documentId: "doc-sample-001",
      dueDate: "2026-05-09",
    },
  ];
  const alerts = getSampleDashboardAlerts();
  return {
    generatedAt: "2026-05-10T16:30:00+09:00",
    metrics,
    todayInspections,
    upcomingInspections,
    reportDueItems,
    openFindings: [],
    safetyCostWarnings: [],
    pendingApprovals: [],
    submissionStatuses: reportDueItems,
    mailFileActivity: {
      messages: [] as MailMessage[],
      files: [],
      unclassifiedMailCount: 1,
      unclassifiedMessages: [] as MailMessage[],
    },
    widgets: getSampleDashboardWidgets(),
    alerts,
    snapshot: getSampleDashboardSnapshot(metrics, alerts),
  };
}

export function getSampleDashboardMyWork(): DashboardMyWorkResponse {
  return {
    generatedAt: "2026-05-10T16:30:00+09:00",
    tasks: [],
    upcomingInspections: getSampleDashboardOverview().upcomingInspections,
    pendingApprovals: [],
    openFindings: [],
  };
}

export function getSampleProjectHealthMetrics(): ProjectHealthMetric[] {
  return [
    {
      id: "project-health-project-sample-001",
      projectId: "project-sample-001",
      projectName: "리움미술관 승강기 교체공사",
      riskScore: 55,
      openFindings: 4,
      pendingApprovals: 1,
      overdueReports: 2,
      submissionLagCount: 2,
      safetyCostWarningCount: 1,
      healthStatus: "warning",
      updatedAt: "2026-05-10T16:30:00+09:00",
    },
  ];
}

export function getSampleFindingAging(): FindingAgingBucket[] {
  return [
    { id: "finding-aging-0-3", projectId: "global", bucketKey: "0_3", label: "0-3일", count: 1, findingIds: [] },
    { id: "finding-aging-4-7", projectId: "global", bucketKey: "4_7", label: "4-7일", count: 1, findingIds: [] },
    { id: "finding-aging-8-plus", projectId: "global", bucketKey: "8_plus", label: "8일 이상", count: 2, findingIds: [] },
  ];
}

export function getSampleStatistics(seriesKey: string): StatisticsMetric[] {
  if (seriesKey === "risk_types") {
    return [
      {
        id: "stat-risk-electric",
        seriesKey,
        label: "위험유형 분포",
        x: "electric",
        y: 3,
        basisDate: "2026-05-10",
        periodStart: "2026-05-01",
        periodEnd: "2026-05-10",
        calculationNote: "open finding 기준 위험유형 집계",
        sourceModels: ["Finding", "CorrectiveAction"],
        metadata: {},
      },
      {
        id: "stat-risk-fall",
        seriesKey,
        label: "위험유형 분포",
        x: "fall",
        y: 1,
        basisDate: "2026-05-10",
        periodStart: "2026-05-01",
        periodEnd: "2026-05-10",
        calculationNote: "open finding 기준 위험유형 집계",
        sourceModels: ["Finding", "CorrectiveAction"],
        metadata: {},
      },
    ];
  }
  return [
    {
      id: `stat-${seriesKey}-1`,
      seriesKey,
      label: seriesKey,
      x: "2026-01",
      y: 1,
      basisDate: "2026-05-10",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-10",
      calculationNote: `${seriesKey} 기준 집계`,
      sourceModels: ["DashboardSnapshot"],
      metadata: {},
    },
    {
      id: `stat-${seriesKey}-2`,
      seriesKey,
      label: seriesKey,
      x: "2026-05",
      y: 2,
      basisDate: "2026-05-10",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-10",
      calculationNote: `${seriesKey} 기준 집계`,
      sourceModels: ["DashboardSnapshot"],
      metadata: {},
    },
  ];
}

export function getSampleProjectDashboard(): ProjectDashboardResponse {
  const project: Project = {
    id: "project-sample-001",
    projectCode: "PJT-2025-001",
    projectName: "리움미술관 승강기 교체공사",
    siteName: "리움미술관",
    siteAddress: "서울특별시 용산구 이태원로55길 60-16",
    constructionType: "승강기 교체",
    status: "active",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  };
  return {
    project,
    healthMetric: getSampleProjectHealthMetrics()[0],
    ownerReportMatrix: getSampleDashboardOverview().reportDueItems,
    findingAging: getSampleFindingAging(),
    openFindings: getSampleDashboardOverview().openFindings,
    safetyCostWarnings: [],
    pendingApprovals: [],
    mailFileActivity: {
      messages: [],
      files: [],
      unclassifiedMailCount: 1,
      unclassifiedMessages: [],
    },
  };
}

export function getSampleDashboardInsightRun(): DashboardInsightRun {
  return {
    id: "dashboard-insight-sample-001",
    insightType: "summary",
    scope: "global",
    title: "AI draft briefing",
    summaryText: "활성 프로젝트 1개 / 제출 지연 보고서 2건 / 미조치 지적사항 4건 기반 초안 요약입니다.",
    sourceMetricKeys: ["active_projects", "overdue_reports", "open_findings"],
    warnings: ["ai_output_is_draft_only"],
    createdAt: "2026-05-10T16:30:00+09:00",
  };
}
