import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  DocumentPhotoLedgerSectionResponse,
  FindingDetailResponse,
  FindingListItem,
  PhotoLedger,
  PhotoLedgerDetailResponse,
  PhotoLedgerValidationResponse,
} from "../../packages/contracts/src";
import {
  getSampleFindingDetail,
  getSampleFindingListItems,
  getSamplePhotoLedgerDetail,
  samplePhotoLedgers,
} from "./finding-demo-data";

function getApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadProjectFindingsPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const findings = await api.listProjectFindings(projectId);
    return {
      findings,
      dataSource: "api" as const,
    };
  } catch {
    return {
      findings: getSampleFindingListItems(projectId),
      dataSource: "sample" as const,
    };
  }
}

export async function loadRoundFindingsPageData(inspectionRoundId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const findings = await api.listInspectionRoundFindings(inspectionRoundId);
    const ledgers = await api.listPhotoLedgers(inspectionRoundId);
    return {
      findings,
      ledgers,
      dataSource: "api" as const,
    };
  } catch {
    return {
      findings: getSampleFindingListItems(inspectionRoundId),
      ledgers: samplePhotoLedgers.filter((item) => item.inspectionRoundId === inspectionRoundId),
      dataSource: "sample" as const,
    };
  }
}

export async function loadFindingDetailPageData(findingId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const detail = await api.getFinding(findingId);
    return {
      detail,
      dataSource: "api" as const,
    };
  } catch {
    return {
      detail: getSampleFindingDetail(findingId),
      dataSource: "sample" as const,
    };
  }
}

export async function loadPhotoLedgerRoundPageData(inspectionRoundId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const ledgers = await api.listPhotoLedgers(inspectionRoundId);
    const primaryLedger = ledgers[0];
    const detail = primaryLedger ? await api.getPhotoLedger(primaryLedger.id) : getSamplePhotoLedgerDetail("photo-ledger-sample-001");
    return {
      ledgers,
      detail,
      dataSource: "api" as const,
    };
  } catch {
    const ledgers = samplePhotoLedgers.filter((item) => item.inspectionRoundId === inspectionRoundId);
    return {
      ledgers,
      detail: getSamplePhotoLedgerDetail(ledgers[0]?.id ?? "photo-ledger-sample-001"),
      dataSource: "sample" as const,
    };
  }
}

export async function loadPhotoLedgerDetailPageData(photoLedgerId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const detail = await api.getPhotoLedger(photoLedgerId);
    return {
      detail,
      dataSource: "api" as const,
    };
  } catch {
    return {
      detail: getSamplePhotoLedgerDetail(photoLedgerId),
      dataSource: "sample" as const,
    };
  }
}

export async function loadPhotoLedgerValidationData(photoLedgerId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const validation = await api.validatePhotoLedger(photoLedgerId);
    return {
      validation,
      dataSource: "api" as const,
    };
  } catch {
    const detail = getSamplePhotoLedgerDetail(photoLedgerId);
    return {
      validation: {
        photoLedgerId,
        warnings: detail.warnings,
        hasDanger: detail.warnings.some((item) => item.severity === "danger"),
      },
      dataSource: "sample" as const,
    };
  }
}

export async function loadDocumentPhotoLedgerSectionPageData(documentId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const payload = await api.getDocumentPhotoLedgerSection(documentId);
    return {
      payload,
      dataSource: "api" as const,
    };
  } catch {
    const detail = getSamplePhotoLedgerDetail("photo-ledger-sample-001");
    return {
      payload: {
        documentId,
        section: {
          documentId,
          documentVersionId: "document-version-sample-001",
          sectionKey: "photo_ledger",
          photoLedgerId: detail.photoLedger.id,
          entryIds: detail.entries.map((item) => item.id),
          updatedAt: "2026-05-10T09:00:00+09:00",
        },
        ...detail,
      },
      dataSource: "sample" as const,
    };
  }
}

export type ProjectFindingsPageData = Awaited<ReturnType<typeof loadProjectFindingsPageData>>;
export type RoundFindingsPageData = Awaited<ReturnType<typeof loadRoundFindingsPageData>>;
export type FindingDetailPageData = { detail: FindingDetailResponse; dataSource: "api" | "sample" };
export type PhotoLedgerRoundPageData = { ledgers: PhotoLedger[]; detail: PhotoLedgerDetailResponse; dataSource: "api" | "sample" };
export type PhotoLedgerDetailPageData = { detail: PhotoLedgerDetailResponse; dataSource: "api" | "sample" };
export type PhotoLedgerValidationPageData = { validation: PhotoLedgerValidationResponse; dataSource: "api" | "sample" };
export type DocumentPhotoLedgerSectionPageData = { payload: DocumentPhotoLedgerSectionResponse; dataSource: "api" | "sample" };
