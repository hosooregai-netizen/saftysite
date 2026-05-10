import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import {
  getSampleDashboardAlerts,
  getSampleDashboardInsightRun,
  getSampleDashboardMyWork,
  getSampleDashboardOverview,
  getSampleFindingAging,
  getSampleProjectDashboard,
  getSampleProjectHealthMetrics,
  getSampleStatistics,
} from "./dashboard-demo-data";

function createDashboardApi(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadDashboardOverviewPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const [overview, healthMetrics] = await Promise.all([
      api.getDashboardOverview(),
      api.listDashboardProjectHealthMetrics(),
    ]);
    return {
      overview,
      healthMetrics,
      dataSource: "api" as const,
    };
  } catch {
    return {
      overview: getSampleDashboardOverview(),
      healthMetrics: getSampleProjectHealthMetrics(),
      dataSource: "sample" as const,
    };
  }
}

export async function loadDashboardMyWorkPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const data = await api.getDashboardMyWork();
    return { ...data, dataSource: "api" as const };
  } catch {
    return { ...getSampleDashboardMyWork(), dataSource: "sample" as const };
  }
}

export async function loadDashboardProjectsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const healthMetrics = await api.listDashboardProjectHealthMetrics();
    return { healthMetrics, dataSource: "api" as const };
  } catch {
    return { healthMetrics: getSampleProjectHealthMetrics(), dataSource: "sample" as const };
  }
}

export async function loadDashboardInspectionsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const [metrics, monthlyInspections] = await Promise.all([
      api.listDashboardInspectionStatusMetrics(),
      api.listDashboardMonthlyInspectionStatistics(),
    ]);
    return { metrics, monthlyInspections, dataSource: "api" as const };
  } catch {
    return {
      metrics: [],
      monthlyInspections: getSampleStatistics("monthly_inspections"),
      dataSource: "sample" as const,
    };
  }
}

export async function loadDashboardReportsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const [reportStatuses, submissionStatuses] = await Promise.all([
      api.listDashboardReportStatusMetrics(),
      api.listDashboardSubmissionStatusMetrics(),
    ]);
    return { reportStatuses, submissionStatuses, dataSource: "api" as const };
  } catch {
    const reportStatuses = getSampleDashboardOverview().reportDueItems;
    return { reportStatuses, submissionStatuses: reportStatuses, dataSource: "sample" as const };
  }
}

export async function loadDashboardFindingsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const [aging, riskTypes] = await Promise.all([
      api.listDashboardFindingAgingMetrics(),
      api.listDashboardRiskTypeStatistics(),
    ]);
    return { aging, riskTypes, dataSource: "api" as const };
  } catch {
    return {
      aging: getSampleFindingAging(),
      riskTypes: getSampleStatistics("risk_types"),
      dataSource: "sample" as const,
    };
  }
}

export async function loadDashboardSafetyCostsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const [warnings, distribution] = await Promise.all([
      api.listDashboardSafetyCostUsageMetrics(),
      api.listDashboardSafetyCostDistributionStatistics(),
    ]);
    return { warnings, distribution, dataSource: "api" as const };
  } catch {
    return { warnings: [], distribution: getSampleStatistics("safety_cost_distribution"), dataSource: "sample" as const };
  }
}

export async function loadDashboardApprovalsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const approvals = await api.listDashboardApprovalQueueMetrics();
    return { approvals, dataSource: "api" as const };
  } catch {
    return { approvals: [], dataSource: "sample" as const };
  }
}

export async function loadDashboardFilesMailsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const activity = await api.listDashboardMailFileActivityMetrics();
    return { activity, dataSource: "api" as const };
  } catch {
    return {
      activity: getSampleDashboardOverview().mailFileActivity,
      dataSource: "sample" as const,
    };
  }
}

export async function loadDashboardStatisticsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const [monthlyInspections, monthlySubmissions, riskTypes, ownerLag, exportSummary] = await Promise.all([
      api.listDashboardMonthlyInspectionStatistics(),
      api.listDashboardMonthlySubmissionStatistics(),
      api.listDashboardRiskTypeStatistics(),
      api.listDashboardOwnerSubmissionLagStatistics(),
      api.listDashboardExportSummaryStatistics(),
    ]);
    return {
      monthlyInspections,
      monthlySubmissions,
      riskTypes,
      ownerLag,
      exportSummary,
      dataSource: "api" as const,
    };
  } catch {
    return {
      monthlyInspections: getSampleStatistics("monthly_inspections"),
      monthlySubmissions: getSampleStatistics("monthly_submissions"),
      riskTypes: getSampleStatistics("risk_types"),
      ownerLag: getSampleStatistics("owner_submission_lag"),
      exportSummary: getSampleStatistics("export_summary"),
      dataSource: "sample" as const,
    };
  }
}

export async function loadDashboardAlertsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const [alerts, rules] = await Promise.all([
      api.listDashboardAlerts(),
      api.listDashboardAlertRules(),
    ]);
    return { alerts, rules, dataSource: "api" as const };
  } catch {
    return { alerts: getSampleDashboardAlerts(), rules: [], dataSource: "sample" as const };
  }
}

export async function loadDashboardSettingsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const [widgets, rules] = await Promise.all([
      api.listDashboardWidgets(),
      api.listDashboardAlertRules(),
    ]);
    return { widgets, rules, dataSource: "api" as const };
  } catch {
    return { widgets: getSampleDashboardOverview().widgets, rules: [], dataSource: "sample" as const };
  }
}

export async function loadProjectDashboardPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const dashboard = await api.getProjectDashboard(projectId);
    return { dashboard, dataSource: "api" as const };
  } catch {
    return { dashboard: getSampleProjectDashboard(), dataSource: "sample" as const };
  }
}

export async function loadDashboardInsightPanelData(projectId?: string, fetchImpl?: typeof fetch) {
  try {
    const api = createDashboardApi(fetchImpl);
    const insightRun = projectId
      ? (await api.createDashboardProjectRiskInsight({ projectId })).insightRun
      : (await api.createDashboardInsightSummary({})).insightRun;
    return { insightRun, dataSource: "api" as const };
  } catch {
    return { insightRun: getSampleDashboardInsightRun(), dataSource: "sample" as const };
  }
}
