import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  ChecklistSessionDetailResponse,
  ChecklistTemplate,
  ProjectAggregateResponse,
} from "../../packages/contracts/src";
import { getSampleChecklistSessionDetail, sampleChecklistSession, sampleChecklistTemplate } from "./checklist-demo-data";
import { getSampleProjectData } from "./project-demo-data";

function getApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadChecklistRoundPageData(inspectionRoundId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const sessions = await api.listChecklistSessions(inspectionRoundId);
    const session = sessions[0];
    const detail = session
      ? await hydrateChecklistSessionDetail(session.id, api)
      : getSampleChecklistSessionDetail(sampleChecklistSession.id);
    return {
      detail,
      sessions,
      dataSource: "api" as const,
    };
  } catch {
    return {
      detail: getSampleChecklistSessionDetail(sampleChecklistSession.id),
      sessions: [sampleChecklistSession],
      dataSource: "sample" as const,
    };
  }
}

export async function loadChecklistSessionPageData(sessionId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const detail = await hydrateChecklistSessionDetail(sessionId, api);
    return {
      detail,
      dataSource: "api" as const,
    };
  } catch {
    return {
      detail: getSampleChecklistSessionDetail(sessionId),
      dataSource: "sample" as const,
    };
  }
}

async function hydrateChecklistSessionDetail(
  sessionId: string,
  api: ReturnType<typeof createAncErpApiClient>,
): Promise<ChecklistSessionDetailResponse> {
  const detail = await api.getChecklistSession(sessionId);
  const [results, reportMapping, templateItems] = await Promise.all([
    api.listChecklistResults(sessionId),
    api.getChecklistReportMapping(sessionId),
    api.listChecklistTemplateItems(detail.template.id),
  ]);
  const itemMap = new Map(templateItems.map((item) => [item.id, item]));
  const resultsWithItems = results.map((result) => ({
    ...result,
    item: result.item ?? itemMap.get(result.checklistItemId),
  }));

  return {
    ...detail,
    results: resultsWithItems,
    reportMappings: reportMapping.reportMappings,
  };
}

export async function loadChecklistTemplateAdminPageData(projectId: string, fetchImpl?: typeof fetch) {
  const sampleProjectData = getSampleProjectData(projectId);
  try {
    const api = getApiClient(fetchImpl);
    const [aggregate, templates] = await Promise.all([
      api.getProject(projectId),
      api.listChecklistTemplates(),
    ]);
    return {
      aggregate,
      templates,
      dataSource: "api" as const,
    };
  } catch {
    return {
      aggregate: {
        project: sampleProjectData.project,
        organizations: sampleProjectData.organizations,
        projectParties: sampleProjectData.projectParties,
        contacts: sampleProjectData.contacts,
        inspectionRounds: [],
        relatedCounts: sampleProjectData.relatedCounts,
        activityLogs: sampleProjectData.activityLogs,
      } satisfies ProjectAggregateResponse,
      templates: [sampleChecklistTemplate] satisfies ChecklistTemplate[],
      dataSource: "sample" as const,
    };
  }
}

export async function loadChecklistTemplateDetailPageData(templateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const detail = await api.getChecklistTemplate(templateId);
    return {
      detail,
      dataSource: "api" as const,
    };
  } catch {
    return {
      detail: {
        template: sampleChecklistTemplate,
        categories: getSampleChecklistSessionDetail(sampleChecklistSession.id).categories,
        items: getSampleChecklistSessionDetail(sampleChecklistSession.id).results.map((result) => result.item!).filter(Boolean),
      },
      dataSource: "sample" as const,
    };
  }
}

export type ChecklistRoundPageData = Awaited<ReturnType<typeof loadChecklistRoundPageData>>;
export type ChecklistSessionPageData = Awaited<ReturnType<typeof loadChecklistSessionPageData>>;
export type ChecklistTemplateAdminPageData = Awaited<ReturnType<typeof loadChecklistTemplateAdminPageData>>;
export type ChecklistTemplateDetailPageData = Awaited<ReturnType<typeof loadChecklistTemplateDetailPageData>>;
