import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  InspectionCalendarRoundsResponse,
  InspectionCalendarTasksResponse,
  InspectionRoundDetailResponse,
  InspectionRoundListItem,
  InspectionSchedule,
  InspectionSchedulePreviewResponse,
  ProjectAggregateResponse,
  ProjectPartyWithOrganization,
} from "../../packages/contracts/src";
import {
  getSampleInspectionRoundDetail,
  getSampleInspectionRoundList,
  sampleInspectionCalendarRounds,
  sampleInspectionCalendarTasks,
  sampleInspectionSchedule,
  sampleInspectionSchedulePreview,
} from "./inspection-demo-data";
import { getSampleProjectData } from "./project-demo-data";

function getApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadProjectInspectionsPageData(projectId: string, fetchImpl?: typeof fetch) {
  const sampleProjectData = getSampleProjectData(projectId);
  try {
    const api = getApiClient(fetchImpl);
    const [aggregate, rounds] = await Promise.all([
      api.getProject(projectId),
      api.listInspectionRounds(projectId),
    ]);
    return {
      aggregate,
      rounds,
      dataSource: "api" as const,
    };
  } catch {
    return {
      aggregate: {
        project: sampleProjectData.project,
        organizations: sampleProjectData.organizations,
        projectParties: sampleProjectData.projectParties,
        contacts: sampleProjectData.contacts,
        inspectionRounds: getSampleInspectionRoundList(projectId).map((item) => item.round),
        relatedCounts: { ...sampleProjectData.relatedCounts, inspectionRounds: 10 },
        activityLogs: sampleProjectData.activityLogs,
      } satisfies ProjectAggregateResponse,
      rounds: getSampleInspectionRoundList(projectId),
      dataSource: "sample" as const,
    };
  }
}

export async function loadInspectionSchedulePageData(projectId: string, fetchImpl?: typeof fetch) {
  const sampleProjectData = getSampleProjectData(projectId);
  try {
    const api = getApiClient(fetchImpl);
    const [aggregate, schedules] = await Promise.all([
      api.getProject(projectId),
      api.listInspectionSchedules(projectId),
    ]);
    const previewPayload = {
      contractId: schedules[0]?.contractId ?? null,
      scheduleName: schedules[0]?.scheduleName ?? `${aggregate.project.projectName} 점검 일정`,
      basisType: schedules[0]?.basisType ?? "manual",
      cycleText: schedules[0]?.cycleText ?? aggregate.project.inspectionCycleText ?? "주기 검토 필요",
      totalRounds: schedules[0]?.totalRounds ?? aggregate.project.totalInspectionRounds ?? 1,
    };
    const preview = await api.previewInspectionSchedule(projectId, previewPayload);
    return {
      aggregate,
      schedules,
      preview,
      previewPayload,
      dataSource: "api" as const,
    };
  } catch {
    return {
      aggregate: {
        project: sampleProjectData.project,
        organizations: sampleProjectData.organizations,
        projectParties: sampleProjectData.projectParties,
        contacts: sampleProjectData.contacts,
        inspectionRounds: getSampleInspectionRoundList(projectId).map((item) => item.round),
        relatedCounts: { ...sampleProjectData.relatedCounts, inspectionRounds: 10 },
        activityLogs: sampleProjectData.activityLogs,
      } satisfies ProjectAggregateResponse,
      schedules: [{ ...sampleInspectionSchedule, projectId }] satisfies InspectionSchedule[],
      preview: sampleInspectionSchedulePreview as InspectionSchedulePreviewResponse,
      previewPayload: {
        contractId: sampleInspectionSchedule.contractId ?? null,
        scheduleName: sampleInspectionSchedule.scheduleName,
        basisType: sampleInspectionSchedule.basisType,
        cycleText: sampleInspectionSchedule.cycleText,
        totalRounds: sampleInspectionSchedule.totalRounds,
      },
      dataSource: "sample" as const,
    };
  }
}

export async function loadInspectionRoundCreateData(projectId: string, fetchImpl?: typeof fetch) {
  const sampleProjectData = getSampleProjectData(projectId);
  try {
    const api = getApiClient(fetchImpl);
    const [aggregate, projectParties, contacts, rounds] = await Promise.all([
      api.getProject(projectId),
      api.listProjectParties(projectId),
      api.listContacts(projectId),
      api.listInspectionRounds(projectId),
    ]);
    const suggestedRoundNo =
      rounds.length === 0
        ? 1
        : Math.max(...rounds.map((item) => item.round.roundNo ?? 0)) + 1;
    return {
      aggregate,
      projectParties: projectParties as ProjectPartyWithOrganization[],
      contacts,
      suggestedRoundNo,
      dataSource: "api" as const,
    };
  } catch {
    const sampleRounds = getSampleInspectionRoundList(projectId);
    return {
      aggregate: {
        project: sampleProjectData.project,
        organizations: sampleProjectData.organizations,
        projectParties: sampleProjectData.projectParties,
        contacts: sampleProjectData.contacts,
        inspectionRounds: getSampleInspectionRoundList(projectId).map((item) => item.round),
        relatedCounts: { ...sampleProjectData.relatedCounts, inspectionRounds: 10 },
        activityLogs: sampleProjectData.activityLogs,
      } satisfies ProjectAggregateResponse,
      projectParties: sampleProjectData.projectParties.map((party) => ({
        ...party,
        organization: sampleProjectData.organizations.find((item) => item.id === party.organizationId) ?? null,
      })),
      contacts: sampleProjectData.contacts.map((contact) => ({
        ...contact,
        organization: sampleProjectData.organizations.find((item) => item.id === contact.organizationId) ?? null,
      })),
      suggestedRoundNo:
        sampleRounds.length === 0
          ? 1
          : Math.max(...sampleRounds.map((item) => item.round.roundNo ?? 0)) + 1,
      dataSource: "sample" as const,
    };
  }
}

export async function loadInspectionRoundDetailData(inspectionRoundId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const detail = await api.getInspectionRound(inspectionRoundId);
    return {
      detail,
      dataSource: "api" as const,
    };
  } catch {
    return {
      detail: getSampleInspectionRoundDetail(inspectionRoundId) as InspectionRoundDetailResponse,
      dataSource: "sample" as const,
    };
  }
}

export async function loadInspectionCalendarPageData(fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const [rounds, tasks] = await Promise.all([
      api.getInspectionCalendarRounds("2026-01-01", "2028-12-31"),
      api.getInspectionCalendarTasks("2026-01-01", "2028-12-31"),
    ]);
    return {
      rounds,
      tasks,
      dataSource: "api" as const,
    };
  } catch {
    return {
      rounds: sampleInspectionCalendarRounds as InspectionCalendarRoundsResponse,
      tasks: sampleInspectionCalendarTasks as InspectionCalendarTasksResponse,
      dataSource: "sample" as const,
    };
  }
}

export type ProjectInspectionsPageData = Awaited<ReturnType<typeof loadProjectInspectionsPageData>>;
export type InspectionSchedulePageData = Awaited<ReturnType<typeof loadInspectionSchedulePageData>>;
export type InspectionRoundCreatePageData = Awaited<ReturnType<typeof loadInspectionRoundCreateData>>;
export type InspectionRoundPageData = Awaited<ReturnType<typeof loadInspectionRoundDetailData>>;
export type InspectionCalendarPageData = Awaited<ReturnType<typeof loadInspectionCalendarPageData>>;
