import {
  createAncErpApiClient,
  getDefaultAncErpApiBaseUrl,
} from "../../packages/api-client/src";
import type {
  ProjectAggregateResponse,
  ProjectExtractionResult,
  ProjectExtractionValidationResult,
  ProjectListItem,
  ProjectRequirementStatus,
  ProjectRelatedCounts,
  ProjectSummaryResponse,
} from "../../packages/contracts/src";
import {
  getSampleProjectData,
  sampleExtractionPreview,
  sampleExtractionSourceText,
  sampleExtractionValidation,
} from "./project-demo-data";

function createServerApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl:
      process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ??
      getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

function buildFallbackListItem(projectId: string): ProjectListItem {
  const sample = getSampleProjectData(projectId);
  return {
    project: sample.project,
    ownerNames: sample.organizations.filter((item) => item.type === "owner").map((item) => item.name),
    contractorNames: sample.organizations
      .filter((item) => item.type === "contractor")
      .map((item) => item.name),
    relatedCounts: sample.relatedCounts,
    nextInspectionDate: "2026-06-15",
    lastActivity: sample.activityLogs.at(-1)?.summary ?? null,
  };
}

export async function loadProjectsPageData(fetchImpl?: typeof fetch) {
  const apiClient = createServerApiClient(fetchImpl);

  try {
    const [projects, extractionPreview] = await Promise.all([
      apiClient.listProjects(),
      apiClient.extractProjectFromDocument(sampleExtractionSourceText),
    ]);
    const primaryProjectId = projects[0]?.project.id ?? "project-sample-001";
    const [primaryAggregate, primaryRequirements] = projects[0]
      ? await Promise.all([
          apiClient.getProject(primaryProjectId),
          apiClient.getProjectRequirements(primaryProjectId),
        ])
      : [
          {
            project: getSampleProjectData(primaryProjectId).project,
            organizations: getSampleProjectData(primaryProjectId).organizations,
            projectParties: getSampleProjectData(primaryProjectId).projectParties,
            contacts: getSampleProjectData(primaryProjectId).contacts,
            inspectionRounds: [],
            relatedCounts: getSampleProjectData(primaryProjectId).relatedCounts,
            activityLogs: getSampleProjectData(primaryProjectId).activityLogs,
          },
          getSampleProjectData(primaryProjectId).requirements,
        ];
    return {
      projects,
      primaryAggregate,
      primaryRequirements,
      extractionPreview,
      extractionValidation: null,
      dataSource: "api" as const,
    };
  } catch {
    const sample = getSampleProjectData("project-sample-001");
    return {
      projects: [buildFallbackListItem("project-sample-001")],
      primaryAggregate: {
        project: sample.project,
        organizations: sample.organizations,
        projectParties: sample.projectParties,
        contacts: sample.contacts,
        inspectionRounds: [],
        relatedCounts: sample.relatedCounts,
        activityLogs: sample.activityLogs,
      },
      primaryRequirements: sample.requirements,
      extractionPreview: sampleExtractionPreview,
      extractionValidation: null,
      dataSource: "fallback" as const,
    };
  }
}

export async function loadProjectCreationDraft(fetchImpl?: typeof fetch) {
  const apiClient = createServerApiClient(fetchImpl);

  try {
    const extractionPreview = await apiClient.extractProjectFromDocument(sampleExtractionSourceText);
    const extractionValidation = await apiClient.validateExtractedInfo(
      "project-sample-001",
      extractionPreview,
    );
    return {
      draftProjectId: "project-sample-001",
      extractionPreview,
      extractionValidation,
      dataSource: "api" as const,
    };
  } catch {
    return {
      draftProjectId: "project-sample-001",
      extractionPreview: sampleExtractionPreview,
      extractionValidation: sampleExtractionValidation,
      dataSource: "fallback" as const,
    };
  }
}

export async function loadProjectDetailData(projectId: string, fetchImpl?: typeof fetch) {
  const apiClient = createServerApiClient(fetchImpl);

  try {
    const [aggregate, summary, requirements, relatedCounts, history, extractionPreview] = await Promise.all([
      apiClient.getProject(projectId),
      apiClient.getProjectSummary(projectId),
      apiClient.getProjectRequirements(projectId),
      apiClient.getProjectRelatedCounts(projectId),
      apiClient.getProjectHistory(projectId),
      apiClient.extractProjectFromDocument(sampleExtractionSourceText),
    ]);
    const extractionValidation = await apiClient.validateExtractedInfo(projectId, extractionPreview);
    return {
      aggregate,
      summary,
      requirements,
      relatedCounts,
      history,
      extractionPreview,
      extractionValidation,
      dataSource: "api" as const,
    };
  } catch {
    const sample = getSampleProjectData(projectId);
    return {
      aggregate: {
        project: sample.project,
        organizations: sample.organizations,
        projectParties: sample.projectParties,
        contacts: sample.contacts,
        inspectionRounds: [],
        relatedCounts: sample.relatedCounts,
        activityLogs: sample.activityLogs,
      } satisfies ProjectAggregateResponse,
      summary: {
        projectId,
        projectName: sample.project.projectName,
        siteAddress: sample.project.siteAddress,
        status: sample.project.status,
        progressRate: sample.project.progressRate,
        totalAmount: sample.project.totalAmount,
        inspectionCycleText: sample.project.inspectionCycleText,
        totalInspectionRounds: sample.project.totalInspectionRounds,
        ownerCount: sample.projectParties.filter((item) => item.role === "owner").length,
        reportTargetOwnerCount: sample.projectParties.filter(
          (item) => item.role === "owner" && item.requiresSeparateReport,
        ).length,
        nextInspectionDate: "2026-06-15",
        relatedCounts: sample.relatedCounts,
      } satisfies ProjectSummaryResponse,
      requirements: sample.requirements satisfies ProjectRequirementStatus,
      relatedCounts: sample.relatedCounts satisfies ProjectRelatedCounts,
      history: sample.activityLogs,
      extractionPreview: sampleExtractionPreview satisfies ProjectExtractionResult,
      extractionValidation: {
        ...sampleExtractionValidation,
        projectId,
      } satisfies ProjectExtractionValidationResult,
      dataSource: "fallback" as const,
    };
  }
}
