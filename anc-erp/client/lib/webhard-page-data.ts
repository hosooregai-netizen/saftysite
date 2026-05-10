import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  FileActivity,
  FileAsset,
  FileDetailResponse,
  Folder,
  PublicShareResponse,
  ShareLink,
  WebhardFolderNode,
  WebhardStorageUsageResponse,
} from "../../packages/contracts/src";
import {
  fallbackShareLinks,
  fallbackStorageUsage,
  fallbackWebhardActivities,
  fallbackWebhardFiles,
  fallbackWebhardTree,
  getFallbackFileDetail,
  getFallbackPublicShare,
} from "./webhard-demo-data";

function createServerApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadWebhardHomePageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [recentFiles, sharedLinks, trashFiles, storageUsage] = await Promise.all([
      api.listFiles({ projectId: "project-sample-001" }),
      api.listShareLinks("project-sample-001"),
      api.listFiles({ projectId: "project-sample-001", status: "deleted" }),
      api.getWebhardStorageUsage("project-sample-001"),
    ]);
    return {
      recentFiles: recentFiles.slice(0, 8),
      sharedLinks,
      trashFiles,
      storageUsage,
      dataSource: "api" as const,
    };
  } catch {
    return {
      recentFiles: fallbackWebhardFiles,
      sharedLinks: fallbackShareLinks,
      trashFiles: [],
      storageUsage: fallbackStorageUsage,
      dataSource: "sample" as const,
    };
  }
}

export async function loadProjectWebhardPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [tree, files, sharedLinks, storageUsage, activities] = await Promise.all([
      api.getProjectFolderTree(projectId),
      api.listFiles({ projectId }),
      api.listShareLinks(projectId),
      api.getWebhardStorageUsage(projectId),
      api.listWebhardActivities(projectId),
    ]);
    const featuredFileDetail = files.length > 0 ? await api.getFile(files[0].id) : null;
    return {
      projectId,
      tree,
      files,
      sharedLinks,
      storageUsage,
      activities,
      featuredFileDetail,
      dataSource: "api" as const,
    };
  } catch {
    return {
      projectId,
      tree: fallbackWebhardTree,
      files: fallbackWebhardFiles,
      sharedLinks: fallbackShareLinks,
      storageUsage: fallbackStorageUsage,
      activities: fallbackWebhardActivities,
      featuredFileDetail: getFallbackFileDetail(fallbackWebhardFiles[0]?.id ?? "file-fallback-001"),
      dataSource: "sample" as const,
    };
  }
}

export async function loadFolderPageData(projectId: string, folderId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [tree, folder, files, storageUsage] = await Promise.all([
      api.getProjectFolderTree(projectId),
      api.getFolder(folderId),
      api.listFiles({ projectId, folderId }),
      api.getWebhardStorageUsage(projectId),
    ]);
    return { projectId, tree, folder, files, storageUsage, dataSource: "api" as const };
  } catch {
    return {
      projectId,
      tree: fallbackWebhardTree,
      folder: fallbackWebhardTree[0]?.children[0]?.folder ?? fallbackWebhardTree[0]?.folder,
      files: fallbackWebhardFiles,
      storageUsage: fallbackStorageUsage,
      dataSource: "sample" as const,
    };
  }
}

export async function loadFilePageData(fileId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [detail, preview] = await Promise.all([api.getFile(fileId), api.previewFile(fileId)]);
    return { detail, preview, dataSource: "api" as const };
  } catch {
    return {
      detail: getFallbackFileDetail(fileId),
      preview: { file: getFallbackFileDetail(fileId).file, previewPath: "/draft/unresolved-file.pdf", previewStatus: "none" },
      dataSource: "sample" as const,
    };
  }
}

export async function loadFileVersionsPageData(fileId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [detail, versions] = await Promise.all([api.getFile(fileId), api.listFileVersions(fileId)]);
    return { detail, versions, dataSource: "api" as const };
  } catch {
    return { detail: getFallbackFileDetail(fileId), versions: [], dataSource: "sample" as const };
  }
}

export async function loadFileActivityPageData(fileId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [detail, activities] = await Promise.all([api.getFile(fileId), api.listFileActivities(fileId)]);
    return { detail, activities, dataSource: "api" as const };
  } catch {
    return { detail: getFallbackFileDetail(fileId), activities: fallbackWebhardActivities, dataSource: "sample" as const };
  }
}

export async function loadSharedPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const sharedLinks = await api.listShareLinks("project-sample-001");
    return { sharedLinks, dataSource: "api" as const };
  } catch {
    return { sharedLinks: fallbackShareLinks, dataSource: "sample" as const };
  }
}

export async function loadTrashPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listFiles({ projectId: "project-sample-001", status: "deleted" });
    return { items, dataSource: "api" as const };
  } catch {
    return { items: [], dataSource: "sample" as const };
  }
}

export async function loadSearchPageData(query: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const result = await api.searchWebhard({ projectId: "project-sample-001", query });
    return { items: result.items, totalCount: result.totalCount, dataSource: "api" as const };
  } catch {
    return { items: fallbackWebhardFiles, totalCount: fallbackWebhardFiles.length, dataSource: "sample" as const };
  }
}

export async function loadPublicSharePageData(token: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getPublicShare(token);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: getFallbackPublicShare(token), dataSource: "sample" as const };
  }
}

export type WebhardHomePageData = {
  recentFiles: FileAsset[];
  sharedLinks: ShareLink[];
  trashFiles: FileAsset[];
  storageUsage: WebhardStorageUsageResponse;
  dataSource: "api" | "sample";
};

export type ProjectWebhardPageData = {
  projectId: string;
  tree: WebhardFolderNode[];
  files: FileAsset[];
  sharedLinks: ShareLink[];
  storageUsage: WebhardStorageUsageResponse;
  activities: FileActivity[];
  featuredFileDetail: FileDetailResponse | null;
  dataSource: "api" | "sample";
};

export type FolderWebhardPageData = {
  projectId: string;
  tree: WebhardFolderNode[];
  folder: Folder;
  files: FileAsset[];
  storageUsage: WebhardStorageUsageResponse;
  dataSource: "api" | "sample";
};

export type FileWebhardPageData = {
  detail: FileDetailResponse;
  preview: { file: FileAsset; previewPath: string; previewStatus: string };
  dataSource: "api" | "sample";
};

export type FileVersionsPageData = {
  detail: FileDetailResponse;
  versions: FileWebhardPageData["detail"]["versions"];
  dataSource: "api" | "sample";
};

export type FileActivityPageData = {
  detail: FileDetailResponse;
  activities: FileActivity[];
  dataSource: "api" | "sample";
};

export type PublicSharePageData = {
  detail: PublicShareResponse;
  dataSource: "api" | "sample";
};
