from pydantic import BaseModel, Field


class FolderPayload(BaseModel):
    projectId: str | None = None
    parentFolderId: str | None = None
    name: str
    type: str = "custom"
    displayOrder: int = 0
    createdBy: str = "user-engineer-001"


class FolderUpdatePayload(BaseModel):
    name: str | None = None
    isArchived: bool | None = None


class FolderMovePayload(BaseModel):
    parentFolderId: str | None = None


class FileUploadPayload(BaseModel):
    projectId: str
    folderId: str
    fileName: str
    originalFileName: str | None = None
    mimeType: str = "application/octet-stream"
    sizeBytes: int
    source: str = "upload"
    tags: list[str] = Field(default_factory=list)
    ownerPartyId: str | None = None
    inspectionRoundId: str | None = None
    linkedEntityType: str | None = None
    linkedEntityId: str | None = None
    uploadedBy: str = "user-engineer-001"
    contentText: str | None = None


class FileUpdatePayload(BaseModel):
    fileName: str | None = None
    tags: list[str] | None = None
    status: str | None = None
    linkedEntityType: str | None = None
    linkedEntityId: str | None = None
    ownerPartyId: str | None = None
    inspectionRoundId: str | None = None


class FileMovePayload(BaseModel):
    folderId: str


class FileCopyPayload(BaseModel):
    folderId: str
    fileName: str | None = None


class FileBulkActionPayload(BaseModel):
    action: str
    fileIds: list[str]
    destinationFolderId: str | None = None


class FileVersionPayload(BaseModel):
    versionKind: str = "working"
    fileName: str | None = None
    sizeBytes: int = 1
    changeSummary: str | None = None
    createdBy: str = "user-engineer-001"
    contentText: str | None = None


class ShareLinkPayload(BaseModel):
    fileId: str | None = None
    folderId: str | None = None
    projectId: str | None = None
    title: str | None = None
    permission: str = "view_and_download"
    expiresAt: str | None = None
    password: str | None = None
    createdBy: str = "user-engineer-001"


class ShareLinkUpdatePayload(BaseModel):
    title: str | None = None
    permission: str | None = None
    expiresAt: str | None = None
    password: str | None = None


class FileLinkPayload(BaseModel):
    projectId: str | None = None
    entityType: str
    entityId: str
    relationType: str = "attachment"


class FileClassificationApplyPayload(BaseModel):
    folderId: str | None = None
    tags: list[str] = Field(default_factory=list)
    entityType: str | None = None
    entityId: str | None = None
    relationType: str = "attachment"


class MailAttachmentSavePayload(BaseModel):
    projectId: str
    folderId: str | None = None
    fileName: str
    mimeType: str = "application/octet-stream"
    sizeBytes: int = 1
    tags: list[str] = Field(default_factory=lambda: ["mail_attachment"])
    contentText: str | None = None

