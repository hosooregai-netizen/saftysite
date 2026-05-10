from pydantic import BaseModel


class ApprovalWorkflowPayload(BaseModel):
    documentId: str
    projectId: str
    templateId: str | None = None
    requestedBy: str = "user-engineer-001"


class ApprovalWorkflowUpdatePayload(BaseModel):
    title: str | None = None
    status: str | None = None
    templateId: str | None = None


class ApprovalRequestPayload(BaseModel):
    templateId: str | None = None
    requestedBy: str = "user-engineer-001"


class ApprovalStepPayload(BaseModel):
    role: str
    assigneeUserId: str | None = None
    assigneeLabel: str | None = None
    required: bool = True


class ApprovalStepUpdatePayload(BaseModel):
    assigneeUserId: str | None = None
    assigneeLabel: str | None = None
    status: str | None = None
    required: bool | None = None


class ApprovalStepActionPayload(BaseModel):
    actedBy: str = "user-engineer-001"
    comment: str | None = None
    delegateToUserId: str | None = None


class SignatureAssetPayload(BaseModel):
    label: str
    assetType: str
    fileId: str


class SignatureAssetUpdatePayload(BaseModel):
    label: str | None = None
    assetType: str | None = None
    fileId: str | None = None
    status: str | None = None


class SignatureTaskPayload(BaseModel):
    taskType: str
    title: str
    required: bool = True
    signatureAssetId: str | None = None


class SignatureTaskUpdatePayload(BaseModel):
    title: str | None = None
    status: str | None = None
    required: bool | None = None
    signatureAssetId: str | None = None
    signedFileId: str | None = None


class SignatureTaskCompletePayload(BaseModel):
    signedFileId: str | None = None


class SignatureTaskWaivePayload(BaseModel):
    waivedReason: str


class SignedFileUploadPayload(BaseModel):
    fileName: str
    fileType: str = "application/pdf"
    storagePath: str | None = None


class SubmissionPackagePayload(BaseModel):
    mainFileId: str | None = None
    signedFileId: str | None = None
    attachmentFileIds: list[str] = []


class SubmissionPackageUpdatePayload(BaseModel):
    mainFileId: str | None = None
    signedFileId: str | None = None
    attachmentFileIds: list[str] | None = None
    status: str | None = None


class SubmissionCreatePayload(BaseModel):
    documentId: str
    packageId: str | None = None
    channel: str = "mail"
    ownerPartyId: str | None = None
    recipientEmails: list[str] = []
    attachmentFileIds: list[str] = []
    memo: str | None = None


class SubmissionUpdatePayload(BaseModel):
    channel: str | None = None
    memo: str | None = None
    externalReference: str | None = None
    status: str | None = None


class SubmissionMailSendPayload(BaseModel):
    sentAt: str | None = None
    subject: str | None = None


class SubmissionManualSubmitPayload(BaseModel):
    submittedAt: str | None = None
    externalReference: str | None = None
    memo: str | None = None


class SubmissionRevisionPayload(BaseModel):
    memo: str | None = None


class ApprovalTemplatePayload(BaseModel):
    name: str
    documentType: str
    status: str = "draft"


class ApprovalTemplateUpdatePayload(BaseModel):
    name: str | None = None
    documentType: str | None = None
    status: str | None = None
