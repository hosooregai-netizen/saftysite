import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";

function createDashboardApi(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function createDashboardWidgetAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createDashboardApi(fetchImpl).createDashboardWidget(payload);
}

export async function updateDashboardWidgetAction(
  widgetId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createDashboardApi(fetchImpl).updateDashboardWidget(widgetId, payload);
}

export async function deleteDashboardWidgetAction(widgetId: string, fetchImpl?: typeof fetch) {
  return createDashboardApi(fetchImpl).deleteDashboardWidget(widgetId);
}

export async function reorderDashboardWidgetsAction(widgetIds: string[], fetchImpl?: typeof fetch) {
  return createDashboardApi(fetchImpl).reorderDashboardWidgets(widgetIds);
}

export async function refreshDashboardAlertsAction(projectIds?: string[], fetchImpl?: typeof fetch) {
  return createDashboardApi(fetchImpl).refreshDashboardAlerts(projectIds);
}

export async function acknowledgeDashboardAlertAction(alertId: string, fetchImpl?: typeof fetch) {
  return createDashboardApi(fetchImpl).acknowledgeDashboardAlert(alertId);
}

export async function dismissDashboardAlertAction(alertId: string, fetchImpl?: typeof fetch) {
  return createDashboardApi(fetchImpl).dismissDashboardAlert(alertId);
}

export async function createDashboardAlertRuleAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createDashboardApi(fetchImpl).createDashboardAlertRule(payload);
}

export async function updateDashboardAlertRuleAction(
  alertRuleId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createDashboardApi(fetchImpl).updateDashboardAlertRule(alertRuleId, payload);
}

export async function createDashboardInsightSummaryAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createDashboardApi(fetchImpl).createDashboardInsightSummary(payload);
}

export async function createDashboardProjectRiskInsightAction(
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createDashboardApi(fetchImpl).createDashboardProjectRiskInsight(payload);
}

export async function createDashboardWeeklyBriefingAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createDashboardApi(fetchImpl).createDashboardWeeklyBriefing(payload);
}
