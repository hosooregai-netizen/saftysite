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

const rootFolder: Folder = {
  id: "folder-root-project-sample-001",
  projectId: "project-sample-001",
  name: "API 연결 대기 프로젝트",
  type: "project_root",
  path: "/API 연결 대기 프로젝트",
  displayOrder: 0,
  isSystem: true,
  isArchived: false,
  createdAt: "",
  updatedAt: "",
};

export const fallbackWebhardTree: WebhardFolderNode[] = [
  {
    folder: rootFolder,
    children: [
      {
        folder: {
          id: "folder-fallback-draft",
          projectId: "project-sample-001",
          parentFolderId: rootFolder.id,
          name: "06_보고서_초안",
          type: "draft_report",
          path: "/API 연결 대기 프로젝트/06_보고서_초안",
          displayOrder: 1,
          isSystem: true,
          isArchived: false,
          createdAt: "",
          updatedAt: "",
        },
        children: [],
      },
      {
        folder: {
          id: "folder-fallback-final",
          projectId: "project-sample-001",
          parentFolderId: rootFolder.id,
          name: "08_최종본",
          type: "final_report",
          path: "/API 연결 대기 프로젝트/08_최종본",
          displayOrder: 2,
          isSystem: true,
          isArchived: false,
          createdAt: "",
          updatedAt: "",
        },
        children: [],
      },
    ],
  },
];

export const fallbackWebhardFiles: FileAsset[] = [
  {
    id: "file-fallback-001",
    projectId: "project-sample-001",
    folderId: "folder-fallback-draft",
    fileName: "연결대기_보고서초안.pdf",
    originalFileName: "연결대기_보고서초안.pdf",
    fileType: "application/pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 0,
    storagePath: "/draft/unresolved.pdf",
    linkedEntityType: "project",
    linkedEntityId: "project-sample-001",
    source: "system",
    status: "processing",
    tags: ["draft_report"],
    previewStatus: "none",
    createdAt: "",
    updatedAt: "",
  },
];

export const fallbackShareLinks: ShareLink[] = [];

export const fallbackWebhardActivities: FileActivity[] = [
  {
    id: "webhard-activity-fallback-001",
    projectId: "project-sample-001",
    activityType: "uploaded",
    message: "API 연결 후 실제 파일 활동 이력을 불러옵니다.",
    createdAt: "",
  },
];

export const fallbackStorageUsage: WebhardStorageUsageResponse = {
  projectId: "project-sample-001",
  totalFiles: 0,
  activeFiles: 0,
  deletedFiles: 0,
  lockedFiles: 0,
  totalSizeBytes: 0,
};

export function getFallbackFileDetail(fileId: string): FileDetailResponse {
  return {
    file: {
      id: fileId,
      projectId: "project-sample-001",
      fileName: "연결대기_파일.pdf",
      fileType: "application/pdf",
      mimeType: "application/pdf",
      storagePath: "/draft/unresolved-file.pdf",
      linkedEntityType: "project",
      linkedEntityId: "project-sample-001",
      status: "processing",
      tags: ["draft_report"],
      createdAt: "",
      updatedAt: "",
    },
    folder: null,
    versions: [],
    links: [],
    shareLinks: [],
    activities: fallbackWebhardActivities,
    suggestion: {
      id: "file-classification-fallback-001",
      fileId,
      recommendedTags: ["other"],
      confidence: 0.2,
      needsConfirmation: true,
      rationale: "API 연결 후 실제 분류 추천을 불러옵니다.",
      createdAt: "",
    },
  };
}

export function getFallbackPublicShare(token: string): PublicShareResponse {
  return {
    shareLink: {
      id: "share-link-fallback-001",
      tokenHash: token,
      permission: "view",
      isRevoked: false,
      createdAt: "",
    },
    file: null,
    folder: null,
    files: [],
    accessLog: null,
    downloadAllowed: false,
  };
}
