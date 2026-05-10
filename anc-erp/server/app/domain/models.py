from dataclasses import dataclass, field


ProjectStatus = str
OrganizationType = str
ProjectPartyRole = str
ContractStatus = str
ContractPartyRole = str
PaymentTermStatus = str
EstimateStatus = str
InspectionScheduleStatus = str
InspectionScheduleBasisType = str
InspectionRoundStatus = str
OwnerReportTaskStatus = str
InspectionTaskType = str
InspectionTaskStatus = str
ChecklistTemplateStatus = str
ChecklistCategoryKey = str
ChecklistSessionStatus = str
ChecklistResultValue = str
FindingCandidateStatus = str
FindingStatus = str
FindingRiskType = str
CorrectiveActionStatus = str
EvidencePhotoType = str
PhotoLedgerStatus = str
SafetyCostUsageStatus = str
SafetyCostAppropriatenessStatus = str
SafetyCostEvidenceType = str
SafetyManagementPlanStatus = str
SafetyManagementSectionStatus = str
SafetyManagementRiskSourceType = str
SafetyManagementAttachmentType = str
SafetyHealthLedgerStatus = str
SafetyHealthLedgerSectionStatus = str
LedgerRiskStatus = str
FolderType = str
FileAssetStatus = str
FileSource = str
FileVersionKind = str
ShareLinkPermission = str
MailAccountMode = str
MailDraftType = str
MailSyncStatus = str
MailMessageDirection = str


@dataclass
class Project:
    id: str
    projectCode: str | None
    projectName: str
    siteName: str
    siteAddress: str
    constructionType: str
    constructionDescription: str | None
    totalAmount: int | None
    startDate: str | None
    endDate: str | None
    actualStartDate: str | None
    progressRate: float | None
    inspectionCycleText: str | None
    totalInspectionRounds: int | None
    status: ProjectStatus
    memo: str | None
    createdAt: str
    updatedAt: str
    archivedAt: str | None = None


@dataclass
class Organization:
    id: str
    name: str
    type: OrganizationType
    businessNumber: str | None = None
    representativeName: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ProjectParty:
    id: str
    projectId: str
    organizationId: str
    role: ProjectPartyRole
    shareRatio: float | None = None
    shareAmount: int | None = None
    requiresSeparateReport: bool = False
    reportRecipient: bool = False
    invoiceRecipient: bool = False
    displayOrder: int = 0
    note: str | None = None
    ownerPartyId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class Contact:
    id: str
    projectId: str
    organizationId: str
    name: str
    position: str | None = None
    phone: str | None = None
    email: str | None = None
    roleDescription: str | None = None
    isPrimary: bool = False
    receivesReport: bool = False
    receivesActionRequest: bool = False
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class MissingField:
    field: str
    message: str
    severity: str
    label: str | None = None
    sectionKey: str | None = None
    reason: str | None = None
    sourceEntityType: str | None = None
    sourceEntityId: str | None = None


@dataclass
class ProjectRequirementStatus:
    projectId: str
    forSafetyReport: list[MissingField] = field(default_factory=list)
    forContract: list[MissingField] = field(default_factory=list)
    forInspectionRound: list[MissingField] = field(default_factory=list)
    forMailSubmission: list[MissingField] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


@dataclass
class ProjectRelatedCounts:
    projectId: str
    contracts: int = 0
    inspectionRounds: int = 0
    documents: int = 0
    files: int = 0
    mailThreads: int = 0
    openFindings: int = 0


@dataclass
class ProjectActivityLog:
    id: str
    projectId: str
    action: str
    summary: str
    fieldNames: list[str] = field(default_factory=list)
    createdAt: str = ""


@dataclass
class DocumentInstance:
    id: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    title: str
    status: str
    ownerReportTaskId: str | None = None
    templateId: str | None = None
    documentType: str = "safety_health_ledger_inspection_report"
    documentNo: str | None = None
    roundNo: int = 0
    contentSnapshot: dict | None = None
    latestVersionNo: int = 0
    exportedFileId: str | None = None
    submittedAt: str | None = None
    mailThreadId: str | None = None
    submissionId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class DocumentVersion:
    id: str
    documentId: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str | None = None
    sourcePhotoLedgerId: str | None = None
    sectionKey: str | None = None
    versionNo: int = 0
    contentSnapshot: dict | None = None
    createdBy: str = "system"
    createdAt: str = ""
    changeSummary: str | None = None


@dataclass
class SourceLink:
    id: str
    sectionKey: str
    sourceEntityType: str
    sourceEntityId: str
    sourceLabel: str
    sourceUpdatedAt: str | None = None
    linkedAt: str = ""


@dataclass
class ReviewWarning:
    type: str
    message: str
    severity: str
    sectionKey: str | None = None


@dataclass
class SafetyReportMeta:
    documentId: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    ownerDisplayName: str
    templateId: str
    generatedMode: str
    draftWatermark: str = "AI DRAFT"


@dataclass
class SafetyReportSection:
    id: str
    key: str
    title: str
    status: str
    order: int
    content: dict = field(default_factory=dict)
    sourceEntityRefs: list[SourceLink] = field(default_factory=list)
    updatedAt: str = ""


@dataclass
class SafetyReportSnapshot:
    meta: SafetyReportMeta
    variables: dict = field(default_factory=dict)
    sections: list[SafetyReportSection] = field(default_factory=list)
    missingFields: list[MissingField] = field(default_factory=list)
    reviewWarnings: list[ReviewWarning] = field(default_factory=list)
    sourceLinks: list[SourceLink] = field(default_factory=list)


@dataclass
class SafetyReportExportJob:
    id: str
    documentId: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    status: str
    fileId: str | None = None
    storagePath: str | None = None
    createdAt: str = ""
    completedAt: str | None = None


@dataclass
class InspectionSchedule:
    id: str
    projectId: str
    contractId: str | None
    scheduleName: str
    basisType: InspectionScheduleBasisType
    cycleText: str
    totalRounds: int
    startDate: str | None
    endDate: str | None
    status: InspectionScheduleStatus
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class InspectionRound:
    id: str
    projectId: str
    name: str
    status: str
    scheduleId: str | None = None
    roundNo: int = 0
    documentNo: str | None = None
    plannedMonth: str | None = None
    plannedDate: str | None = None
    actualInspectionDate: str | None = None
    inspectorUserId: str | None = None
    confirmerContactId: str | None = None
    contractorContactId: str | None = None
    reportDueDate: str | None = None
    milestoneLabel: str | None = None
    memo: str | None = None
    createdAt: str = ""
    updatedAt: str = ""
    nextInspectionDate: str | None = None
    documentInstances: list[DocumentInstance] = field(default_factory=list)


@dataclass
class InspectionOwnerReportTask:
    id: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    ownerDisplayName: str | None = None
    documentInstanceId: str | None = None
    status: OwnerReportTaskStatus = "not_started"
    exportedFileId: str | None = None
    submittedAt: str | None = None
    mailThreadId: str | None = None
    submissionId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class InspectionTask:
    id: str
    projectId: str
    inspectionRoundId: str
    taskType: InspectionTaskType
    title: str
    dueDate: str | None = None
    assigneeId: str | None = None
    status: InspectionTaskStatus = "todo"
    linkedEntityType: str | None = None
    linkedEntityId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class WorkScheduleAttachment:
    id: str
    projectId: str
    inspectionRoundId: str | None
    fileId: str
    fileName: str
    storagePath: str
    attachmentType: str
    sourceLabel: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class InspectionRescheduleLog:
    id: str
    projectId: str
    inspectionRoundId: str
    previousPlannedDate: str | None
    nextPlannedDate: str | None
    previousActualInspectionDate: str | None
    nextActualInspectionDate: str | None
    reason: str
    requestedBy: str | None = None
    approvedBy: str | None = None
    mailThreadId: str | None = None
    fileId: str | None = None
    createdAt: str = ""


@dataclass
class InspectionRoundMilestone:
    id: str
    projectId: str
    inspectionRoundId: str
    label: str
    linkedContractId: str | None = None
    createdAt: str = ""


@dataclass
class ExtractedOrganization:
    name: str
    type: OrganizationType
    representativeName: str | None = None
    phone: str | None = None
    email: str | None = None


@dataclass
class ExtractedProjectParty:
    organizationName: str
    role: ProjectPartyRole
    shareRatio: float | None = None
    shareAmount: int | None = None
    requiresSeparateReport: bool | None = None
    reportRecipient: bool | None = None
    invoiceRecipient: bool | None = None


@dataclass
class ExtractedContact:
    organizationName: str
    name: str
    position: str | None = None
    phone: str | None = None
    email: str | None = None
    roleDescription: str | None = None
    receivesReport: bool = False
    receivesActionRequest: bool = False


@dataclass
class ExtractedProject:
    projectName: str | None = None
    siteName: str | None = None
    siteAddress: str | None = None
    constructionType: str | None = None
    constructionDescription: str | None = None
    totalAmount: int | None = None
    startDate: str | None = None
    endDate: str | None = None
    actualStartDate: str | None = None
    progressRate: float | None = None
    inspectionCycleText: str | None = None
    totalInspectionRounds: int | None = None
    status: ProjectStatus | None = None
    memo: str | None = None


@dataclass
class ProjectExtractionResult:
    project: ExtractedProject
    organizations: list[ExtractedOrganization] = field(default_factory=list)
    projectParties: list[ExtractedProjectParty] = field(default_factory=list)
    contacts: list[ExtractedContact] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    isDraft: bool = True


@dataclass
class ProjectAggregate:
    project: Project
    organizations: list[Organization] = field(default_factory=list)
    projectParties: list[ProjectParty] = field(default_factory=list)
    contacts: list[Contact] = field(default_factory=list)
    inspectionRounds: list[InspectionRound] = field(default_factory=list)
    relatedCounts: ProjectRelatedCounts | None = None
    activityLogs: list[ProjectActivityLog] = field(default_factory=list)

    @property
    def id(self) -> str:
        return self.project.id


@dataclass
class PaymentSplitItem:
    organizationId: str
    projectPartyId: str | None
    label: str
    ratio: float
    amount: int


@dataclass
class PaymentTerm:
    id: str
    contractId: str
    label: str
    triggerText: str
    dueDate: str | None
    amount: int
    ratio: float | None
    status: PaymentTermStatus
    requestDate: str | None = None
    paidDate: str | None = None
    evidenceFileId: str | None = None
    splitItems: list[PaymentSplitItem] = field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class Contract:
    id: str
    projectId: str
    contractNo: str | None
    contractTitle: str
    contractType: str
    serviceName: str
    serviceScope: str
    contractAmount: int
    vatIncluded: bool
    vatAmount: int | None = None
    supplyAmount: int | None = None
    contractStartDate: str | None = None
    contractEndDate: str | None = None
    constructionStartDate: str | None = None
    constructionEndDate: str | None = None
    deliverables: list[str] = field(default_factory=list)
    inspectionCount: int | None = None
    paymentSummary: str | None = None
    status: ContractStatus = "draft"
    finalFileId: str | None = None
    signedFileId: str | None = None
    latestVersionId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""
    archivedAt: str | None = None


@dataclass
class ContractParty:
    id: str
    contractId: str
    organizationId: str
    projectPartyId: str | None
    role: ContractPartyRole
    displayName: str
    representativeName: str | None = None
    businessNumber: str | None = None
    address: str | None = None
    phone: str | None = None
    shareRatio: float | None = None
    shareAmount: int | None = None
    paymentRequired: bool = False
    signingRequired: bool = False
    displayOrder: int = 0
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ContractVersion:
    id: str
    contractId: str
    versionNo: int
    draftText: str
    templateKey: str
    isDraft: bool
    missingFields: list[str] = field(default_factory=list)
    createdAt: str = ""


@dataclass
class ContractChange:
    id: str
    contractId: str
    summary: str
    changedFields: list[str] = field(default_factory=list)
    createdAt: str = ""


@dataclass
class FileAsset:
    id: str
    projectId: str
    fileName: str
    fileType: str
    storagePath: str
    linkedEntityType: str
    linkedEntityId: str
    createdAt: str = ""
    folderId: str | None = None
    ownerPartyId: str | None = None
    inspectionRoundId: str | None = None
    originalFileName: str | None = None
    extension: str | None = None
    mimeType: str | None = None
    sizeBytes: int = 0
    storageKey: str | None = None
    checksum: str | None = None
    source: FileSource = "system"
    status: FileAssetStatus = "active"
    tags: list[str] = field(default_factory=list)
    currentVersionId: str | None = None
    previewStatus: str = "none"
    uploadedBy: str | None = None
    updatedAt: str = ""
    isLocked: bool = False


@dataclass
class Folder:
    id: str
    projectId: str | None
    name: str
    type: FolderType
    path: str
    displayOrder: int
    isSystem: bool
    isArchived: bool
    createdAt: str
    updatedAt: str
    parentFolderId: str | None = None
    createdBy: str | None = None


@dataclass
class FileVersion:
    id: str
    fileId: str
    versionNo: int
    versionKind: FileVersionKind
    fileName: str
    storageKey: str
    sizeBytes: int
    createdAt: str
    checksum: str | None = None
    changeSummary: str | None = None
    createdBy: str | None = None


@dataclass
class FileEntityLink:
    id: str
    fileId: str
    entityType: str
    entityId: str
    relationType: str
    createdAt: str
    projectId: str | None = None


@dataclass
class ShareLink:
    id: str
    tokenHash: str
    permission: ShareLinkPermission
    isRevoked: bool
    createdAt: str
    fileId: str | None = None
    folderId: str | None = None
    projectId: str | None = None
    title: str | None = None
    expiresAt: str | None = None
    passwordHash: str | None = None
    createdBy: str | None = None
    revokedAt: str | None = None


@dataclass
class ShareLinkAccessLog:
    id: str
    shareLinkId: str
    accessedAt: str
    action: str
    ipHash: str | None = None
    userAgent: str | None = None


@dataclass
class FileActivity:
    id: str
    activityType: str
    message: str
    createdAt: str
    fileId: str | None = None
    folderId: str | None = None
    projectId: str | None = None
    actorId: str | None = None
    metadata: dict = field(default_factory=dict)


@dataclass
class FileClassificationSuggestion:
    id: str
    fileId: str
    recommendedFolderId: str | None
    recommendedFolderPath: str | None
    recommendedTags: list[str]
    recommendedEntityType: str | None
    recommendedEntityId: str | None
    confidence: float
    needsConfirmation: bool
    rationale: str
    createdAt: str


@dataclass
class StorageObject:
    id: str
    storageKey: str
    absolutePath: str
    mimeType: str
    sizeBytes: int
    createdAt: str


@dataclass
class UploadSession:
    id: str
    projectId: str
    folderId: str
    status: str
    fileNames: list[str]
    createdAt: str
    completedAt: str | None = None


@dataclass
class MailMessage:
    id: str
    projectId: str
    threadId: str | None = None
    providerMessageId: str | None = None
    inspectionRoundId: str | None = None
    ownerPartyId: str | None = None
    subject: str = ""
    fromAddress: str | None = None
    toAddresses: list[str] = field(default_factory=list)
    ccAddresses: list[str] = field(default_factory=list)
    bodyText: str | None = None
    direction: MailMessageDirection = "inbound"
    folder: str = "inbox"
    status: str = "received"
    isRead: bool = False
    documentId: str | None = None
    submissionId: str | None = None
    receivedAt: str | None = None
    sentAt: str | None = None
    createdAt: str = ""


@dataclass
class MailThread:
    id: str
    projectId: str
    providerThreadId: str | None = None
    inspectionRoundId: str | None = None
    ownerPartyId: str | None = None
    subject: str = ""
    participantContactIds: list[str] = field(default_factory=list)
    linkedFindingIds: list[str] = field(default_factory=list)
    status: str = "active"
    lastMessageAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class MailAddress:
    name: str | None
    email: str


@dataclass
class MailAttachment:
    id: str
    messageId: str
    projectId: str
    fileName: str
    mimeType: str
    sizeBytes: int
    savedFileId: str | None = None
    linkedFileId: str | None = None
    createdAt: str = ""


@dataclass
class MailAccount:
    id: str
    provider: str
    mode: MailAccountMode
    email: str
    displayName: str
    projectId: str | None = None
    status: str = "active"
    isConnected: bool = False
    lastSyncedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class MailEntityLink:
    id: str
    projectId: str
    threadId: str | None = None
    messageId: str | None = None
    entityType: str = "project"
    entityId: str = ""
    relationType: str = "reference"
    confirmed: bool = True
    createdAt: str = ""


@dataclass
class MailDraft:
    id: str
    draftType: MailDraftType
    mode: MailAccountMode
    projectId: str | None = None
    inspectionRoundId: str | None = None
    ownerPartyId: str | None = None
    documentId: str | None = None
    submissionId: str | None = None
    findingIds: list[str] = field(default_factory=list)
    contractId: str | None = None
    estimateId: str | None = None
    accountId: str | None = None
    threadId: str | None = None
    toAddresses: list[str] = field(default_factory=list)
    ccAddresses: list[str] = field(default_factory=list)
    subject: str = ""
    body: str = ""
    attachmentFileIds: list[str] = field(default_factory=list)
    templateId: str | None = None
    aiDraftText: str | None = None
    validationWarnings: list[str] = field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""
    sentAt: str | None = None


@dataclass
class MailTemplate:
    id: str
    name: str
    templateType: str
    subjectTemplate: str
    bodyTemplate: str
    variables: list[str] = field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class MailSignature:
    id: str
    label: str
    content: str
    accountId: str | None = None
    isDefault: bool = False
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class MailSyncJob:
    id: str
    accountId: str
    status: MailSyncStatus
    summary: str
    startedAt: str
    completedAt: str | None = None


@dataclass
class MailProviderEvent:
    id: str
    accountId: str
    eventType: str
    threadId: str | None = None
    messageId: str | None = None
    payloadSummary: str = ""
    createdAt: str = ""


@dataclass
class Submission:
    id: str
    documentId: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    exportedFileId: str
    mailThreadId: str
    submittedAt: str
    status: str = "submitted"
    packageId: str | None = None
    channel: str | None = None
    finalFileId: str | None = None
    externalReference: str | None = None
    memo: str | None = None
    receiptConfirmedAt: str | None = None
    revisionRequestedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ApprovalWorkflow:
    id: str
    documentId: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    title: str
    status: str
    templateId: str | None = None
    currentStepOrder: int = 1
    requestedBy: str | None = None
    requestedAt: str | None = None
    completedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ApprovalStep:
    id: str
    workflowId: str
    stepOrder: int
    role: str
    assigneeUserId: str | None = None
    assigneeLabel: str | None = None
    status: str = "pending"
    required: bool = True
    actedAt: str | None = None
    comment: str | None = None
    delegatedToUserId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ApprovalComment:
    id: str
    workflowId: str
    authorUserId: str
    body: str
    createdAt: str = ""
    stepId: str | None = None


@dataclass
class ApprovalTemplate:
    id: str
    name: str
    documentType: str
    status: str
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ApprovalTemplateStep:
    id: str
    templateId: str
    stepOrder: int
    role: str
    required: bool = True
    defaultAssigneeLabel: str | None = None


@dataclass
class SignatureAsset:
    id: str
    label: str
    assetType: str
    fileId: str
    status: str = "active"
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class SignatureTask:
    id: str
    documentId: str
    projectId: str
    ownerPartyId: str
    taskType: str
    title: str
    status: str = "pending"
    required: bool = True
    signatureAssetId: str | None = None
    signedFileId: str | None = None
    waivedReason: str | None = None
    completedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class FinalDocumentPackage:
    id: str
    documentId: str
    projectId: str
    ownerPartyId: str
    mainFileId: str
    signedFileId: str | None = None
    attachmentFileIds: list[str] = field(default_factory=list)
    status: str = "draft"
    finalizedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class SubmissionAttachment:
    id: str
    submissionId: str
    fileId: str
    label: str
    attachmentType: str
    createdAt: str = ""


@dataclass
class SubmissionRecipient:
    id: str
    submissionId: str
    name: str
    email: str
    ownerPartyId: str | None = None
    organizationName: str | None = None
    roleLabel: str | None = None
    createdAt: str = ""


@dataclass
class SubmissionValidationWarning:
    code: str
    message: str
    severity: str
    field: str | None = None


@dataclass
class SubmissionStatusEvent:
    id: str
    submissionId: str
    status: str
    summary: str
    createdAt: str = ""


@dataclass
class ContractFileLink:
    id: str
    fileId: str
    contractId: str
    fileName: str
    fileType: str
    storagePath: str
    fileCategory: str
    isFinal: bool = False
    isSigned: bool = False
    createdAt: str = ""


@dataclass
class EstimateItem:
    id: str
    label: str
    description: str | None
    quantity: float
    unitPrice: int
    supplyAmount: int
    vatAmount: int
    totalAmount: int


@dataclass
class Estimate:
    id: str
    projectId: str
    estimateNo: str | None
    title: str
    serviceName: str
    validUntil: str | None
    status: EstimateStatus
    supplyAmount: int
    vatAmount: int
    totalAmount: int
    items: list[EstimateItem] = field(default_factory=list)
    finalFileId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""
    convertedContractId: str | None = None


@dataclass
class AuditLog:
    id: str
    entityType: str
    entityId: str
    action: str
    summary: str
    fieldNames: list[str] = field(default_factory=list)
    createdAt: str = ""


@dataclass
class ContractAggregate:
    contract: Contract
    project: Project | None = None
    parties: list[ContractParty] = field(default_factory=list)
    paymentTerms: list[PaymentTerm] = field(default_factory=list)
    versions: list[ContractVersion] = field(default_factory=list)
    changes: list[ContractChange] = field(default_factory=list)
    files: list[ContractFileLink] = field(default_factory=list)
    auditLogs: list[AuditLog] = field(default_factory=list)


@dataclass
class ChecklistTemplate:
    id: str
    name: str
    description: str | None
    projectType: str | None
    documentType: str
    version: str
    status: ChecklistTemplateStatus
    publishedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ChecklistCategory:
    id: str
    templateId: str
    key: ChecklistCategoryKey
    title: str
    displayOrder: int


@dataclass
class ChecklistItem:
    id: str
    templateId: str
    categoryId: str
    categoryKey: ChecklistCategoryKey
    discipline: str | None
    title: str
    detail: str | None
    reportLabel: str | None
    defaultApplicability: bool
    isRequired: bool
    findingRequiredWhen: str
    sourceSectionKey: str | None
    displayOrder: int


@dataclass
class ChecklistSession:
    id: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str | None
    templateId: str
    templateVersion: str
    inspectorUserId: str | None
    inspectionDate: str | None
    status: ChecklistSessionStatus
    startedAt: str | None = None
    completedAt: str | None = None
    reviewedAt: str | None = None
    lockedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ChecklistResult:
    id: str
    sessionId: str
    projectId: str
    inspectionRoundId: str
    checklistItemId: str
    result: ChecklistResultValue
    comment: str | None = None
    reportComment: str | None = None
    actionRequired: bool = False
    responsiblePartyId: str | None = None
    dueDate: str | None = None
    photoIds: list[str] = field(default_factory=list)
    findingCandidateId: str | None = None
    findingId: str | None = None
    reportMappingStatus: str = "not_mapped"
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class FindingCandidate:
    id: str
    projectId: str
    inspectionRoundId: str
    sessionId: str
    checklistResultId: str
    title: str
    detail: str
    riskType: str | None
    requiredAction: str
    status: FindingCandidateStatus
    convertedFindingId: str | None = None
    dismissedReason: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class Finding:
    id: str
    projectId: str
    inspectionRoundId: str
    title: str
    detail: str
    ownerPartyId: str | None = None
    riskType: FindingRiskType | None = None
    requiredAction: str = ""
    responsiblePartyId: str | None = None
    dueDate: str | None = None
    status: FindingStatus = "open"
    sourceType: str | None = None
    sourceId: str | None = None
    checklistResultId: str | None = None
    additionalHazardItemId: str | None = None
    riskReductionItemId: str | None = None
    reportInclude: bool = True
    reportOrder: int | None = None
    createdBy: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class RiskReductionChecklistItem:
    id: str
    sessionId: str
    no: int
    field: str
    workType: str
    contractorPlan: str | None = None
    checkPoint: str | None = None
    result: ChecklistResultValue = "not_checked"
    implementationStatus: str = "not_checked"
    note: str | None = None
    photoIds: list[str] = field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class AdditionalHazardItem:
    id: str
    sessionId: str
    no: int
    hazardDescription: str
    contractorPlan: str | None = None
    checkPoint: str | None = None
    implementationStatus: str = "not_checked"
    note: str | None = None
    photoIds: list[str] = field(default_factory=list)
    findingCandidateId: str | None = None
    findingId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ChecklistPhoto:
    id: str
    projectId: str
    inspectionRoundId: str
    sessionId: str
    checklistResultId: str | None
    additionalHazardId: str | None
    fileId: str
    fileName: str
    storagePath: str
    caption: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ChecklistMobileDraft:
    id: str
    sessionId: str
    clientVersion: int
    draftVersion: int
    payload: dict = field(default_factory=dict)
    conflictDetected: bool = False
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class ChecklistReportMapping:
    id: str
    sessionId: str
    documentId: str | None
    sourceSectionKey: str
    reportLabel: str
    rowSummary: str
    stale: bool = False
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class CorrectiveAction:
    id: str
    findingId: str
    projectId: str
    inspectionRoundId: str
    actionDetail: str
    actionDate: str | None = None
    actionOrganizationId: str | None = None
    submittedBy: str | None = None
    submittedAt: str | None = None
    verifiedBy: str | None = None
    verifiedAt: str | None = None
    verificationComment: str | None = None
    rejectedReason: str | None = None
    status: CorrectiveActionStatus = "draft"
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class PhotoMarkupShape:
    id: str
    shapeType: str
    x: float
    y: float
    width: float | None = None
    height: float | None = None
    color: str = "#FFD84D"
    strokeStyle: str = "dashed"
    text: str | None = None


@dataclass
class PhotoMarkupInfo:
    id: str
    photoId: str
    shapes: list[PhotoMarkupShape] = field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class EvidencePhoto:
    id: str
    projectId: str
    inspectionRoundId: str | None
    ownerPartyId: str | None = None
    findingId: str | None = None
    correctiveActionId: str | None = None
    fileId: str = ""
    photoType: EvidencePhotoType = "other"
    fileName: str = ""
    storagePath: str = ""
    caption: str | None = None
    takenAt: str | None = None
    uploadedBy: str | None = None
    representative: bool = False
    reportInclude: bool = True
    markupInfo: PhotoMarkupInfo | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class PhotoLedger:
    id: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str | None = None
    documentId: str | None = None
    title: str = ""
    status: PhotoLedgerStatus = "draft"
    layoutMode: str = "one_entry_per_page"
    createdAt: str = ""
    updatedAt: str = ""
    syncedAt: str | None = None


@dataclass
class PhotoLedgerEntry:
    id: str
    photoLedgerId: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str | None = None
    findingId: str = ""
    correctiveActionId: str | None = None
    findingPhotoId: str | None = None
    actionPhotoId: str | None = None
    findingCaption: str | None = None
    actionCaption: str | None = None
    displayOrder: int = 0
    confirmed: bool = False
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class PhotoLedgerWarning:
    id: str
    photoLedgerId: str
    entryId: str | None
    code: str
    severity: str
    message: str
    createdAt: str = ""


@dataclass
class FindingTimelineEvent:
    id: str
    findingId: str
    eventType: str
    summary: str
    createdAt: str = ""


@dataclass
class ActionRequestMailDraft:
    id: str
    projectId: str
    inspectionRoundId: str
    findingIds: list[str] = field(default_factory=list)
    ownerPartyId: str | None = None
    contractorContactId: str | None = None
    subject: str = ""
    body: str = ""
    attachmentFileIds: list[str] = field(default_factory=list)
    mailThreadId: str | None = None
    sentAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class SafetyCostUsage:
    id: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    calculatedAmount: int
    usedAmount: int
    usedRateCalculated: float
    userEnteredRate: float | None = None
    basisMonth: str | None = None
    basisDate: str | None = None
    basisDocumentText: str | None = None
    appropriatenessComment: str | None = None
    appropriatenessStatus: SafetyCostAppropriatenessStatus = "not_reviewed"
    status: SafetyCostUsageStatus = "draft"
    confirmedBy: str | None = None
    confirmedAt: str | None = None
    reportInclude: bool = True
    syncedDocumentId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""
    archivedAt: str | None = None


@dataclass
class SafetyCostEvidence:
    id: str
    safetyCostUsageId: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    fileId: str
    evidenceType: SafetyCostEvidenceType
    fileName: str
    storagePath: str
    issuedDate: str | None = None
    submittedBy: str | None = None
    memo: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class SafetyCostReview:
    id: str
    safetyCostUsageId: str
    reviewerId: str
    reviewedAt: str
    reviewComment: str
    appropriatenessStatus: SafetyCostAppropriatenessStatus
    aiDraftComment: str | None = None


@dataclass
class SafetyCostHistoryEvent:
    id: str
    safetyCostUsageId: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    eventType: str
    summary: str
    changedFields: list[str] = field(default_factory=list)
    fileId: str | None = None
    createdAt: str = ""


@dataclass
class SafetyCostValidationWarning:
    type: str
    severity: str
    message: str


@dataclass
class SafetyCostReportMapping:
    id: str
    safetyCostUsageId: str
    documentId: str
    projectSummaryPhrase: str
    implementationBudgetPhrase: str
    sectionKey: str = "safety_cost_usage"
    documentVersionId: str | None = None
    syncedAt: str = ""


@dataclass
class SafetyManagementPlan:
    id: str
    projectId: str
    title: str
    status: SafetyManagementPlanStatus
    templateId: str
    contractId: str | None = None
    inspectionRoundId: str | None = None
    revisionNo: int = 1
    revisionReason: str | None = None
    contentSnapshot: dict | None = None
    latestVersionNo: int = 0
    exportedFileId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""
    archivedAt: str | None = None


@dataclass
class SafetyManagementPlanMeta:
    planId: str
    projectId: str
    templateId: str
    contractId: str | None
    inspectionRoundId: str | None
    generatedMode: str
    draftWatermark: str = "AI DRAFT"


@dataclass
class SafetyManagementProjectSnapshot:
    projectId: str
    projectName: str
    siteName: str
    siteAddress: str
    constructionType: str
    contractorName: str | None = None
    ownerName: str | None = None
    contractTitle: str | None = None
    contractPeriodText: str | None = None
    sourceUpdatedAt: str | None = None


@dataclass
class SafetyManagementPlanSection:
    id: str
    key: str
    title: str
    status: SafetyManagementSectionStatus
    order: int
    content: dict = field(default_factory=dict)
    sourceEntityRefs: list[SourceLink] = field(default_factory=list)
    updatedAt: str = ""


@dataclass
class SafetyManagementPlanSnapshot:
    meta: SafetyManagementPlanMeta
    projectSnapshot: SafetyManagementProjectSnapshot
    variables: dict = field(default_factory=dict)
    sections: list[SafetyManagementPlanSection] = field(default_factory=list)
    missingFields: list[MissingField] = field(default_factory=list)
    reviewWarnings: list[ReviewWarning] = field(default_factory=list)
    sourceLinks: list[SourceLink] = field(default_factory=list)


@dataclass
class SafetyManagementPlanVersion:
    id: str
    planId: str
    versionNo: int
    contentSnapshot: dict
    createdBy: str
    createdAt: str
    changeSummary: str | None = None


@dataclass
class SafetyManagementWorkType:
    id: str
    planId: str
    name: str
    description: str | None = None
    processOrder: int = 0
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class SafetyManagementRiskItem:
    id: str
    planId: str
    workTypeId: str | None
    workTypeName: str | None
    hazard: str
    riskCause: str | None
    reductionMeasure: str
    riskLevel: str = "medium"
    sourceType: SafetyManagementRiskSourceType | None = None
    sourceId: str | None = None
    status: str = "draft"
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class SafetyOrganizationPlan:
    planId: str
    organizationChartFileId: str | None = None
    responsibilities: list[dict] = field(default_factory=list)
    updatedAt: str = ""


@dataclass
class SafetyEducationPlan:
    planId: str
    items: list[dict] = field(default_factory=list)
    updatedAt: str = ""


@dataclass
class SafetyEmergencyPlan:
    planId: str
    contacts: list[dict] = field(default_factory=list)
    updatedAt: str = ""


@dataclass
class SafetyInspectionPlan:
    planId: str
    items: list[dict] = field(default_factory=list)
    updatedAt: str = ""


@dataclass
class SafetyManagementPlanAttachment:
    id: str
    planId: str
    fileId: str
    fileName: str
    storagePath: str
    attachmentType: SafetyManagementAttachmentType
    sourceLabel: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class SafetyManagementExportJob:
    id: str
    planId: str
    projectId: str
    status: str
    fileId: str | None = None
    storagePath: str | None = None
    createdAt: str = ""
    completedAt: str | None = None


@dataclass
class SafetyHealthLedger:
    id: str
    projectId: str
    templateId: str
    title: str
    status: SafetyHealthLedgerStatus
    currentVersionNo: int = 0
    latestSnapshot: dict | None = None
    exportedFileId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""
    archivedAt: str | None = None


@dataclass
class LedgerMeta:
    projectId: str
    projectName: str
    siteName: str | None = None
    siteAddress: str | None = None
    constructionType: str | None = None
    ownerNames: list[str] = field(default_factory=list)
    contractorName: str | None = None
    engineerName: str | None = None
    constructionStartDate: str | None = None
    constructionEndDate: str | None = None
    latestInspectionRoundNo: int | None = None
    latestUpdatedAt: str | None = None
    sourcePlanId: str | None = None
    draftWatermark: str = "AI DRAFT"


@dataclass
class SafetyHealthLedgerSection:
    id: str
    ledgerId: str
    key: str
    title: str
    order: int
    status: SafetyHealthLedgerSectionStatus
    content: dict = field(default_factory=dict)
    sourceLinks: list[SourceLink] = field(default_factory=list)
    updatedAt: str = ""


@dataclass
class LedgerRiskItem:
    id: str
    ledgerId: str
    projectId: str
    sourceType: str | None = None
    sourceId: str | None = None
    workType: str | None = None
    workDescription: str | None = None
    hazardDescription: str = ""
    riskType: str | None = None
    riskLevel: str | None = None
    reductionMeasureSummary: str | None = None
    responsibleOrganizationId: str | None = None
    relatedChecklistItemIds: list[str] = field(default_factory=list)
    relatedFindingIds: list[str] = field(default_factory=list)
    recurrenceCount: int = 0
    status: LedgerRiskStatus = "identified"
    firstDetectedAt: str | None = None
    lastDetectedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class LedgerRiskReductionMeasure:
    id: str
    ledgerId: str
    riskItemId: str | None = None
    title: str = ""
    description: str = ""
    responsibleOrganizationId: str | None = None
    status: str = "planned"
    dueDate: str | None = None
    sourceType: str | None = None
    sourceId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class LedgerInspectionHistory:
    id: str
    ledgerId: str
    projectId: str
    inspectionRoundId: str
    roundNo: int | None = None
    documentNo: str | None = None
    inspectionDate: str | None = None
    inspectorName: str | None = None
    ownerReportSubmittedCount: int = 0
    checklistSessionId: str | None = None
    checklistSummary: str | None = None
    cautionCount: int = 0
    badCount: int = 0
    findingCount: int = 0
    actionCompletedCount: int = 0
    openFindingCount: int = 0
    linkedReportIds: list[str] = field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class LedgerFindingHistory:
    id: str
    ledgerId: str
    projectId: str
    inspectionRoundId: str
    findingId: str
    correctiveActionId: str | None = None
    ownerPartyId: str | None = None
    title: str = ""
    riskType: str | None = None
    responsibleOrganizationId: str | None = None
    status: str = "open"
    requiredAction: str | None = None
    actionDetail: str | None = None
    verifiedBy: str | None = None
    verifiedAt: str | None = None
    recurrenceCount: int = 0
    reportInclude: bool = False
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class LedgerSafetyCostHistory:
    id: str
    ledgerId: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    usageId: str
    basisMonth: str | None = None
    calculatedAmount: int | None = None
    usedAmount: int | None = None
    usedRateCalculated: float | None = None
    appropriatenessStatus: str | None = None
    reportLinked: bool = False
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class LedgerAttachment:
    id: str
    ledgerId: str
    projectId: str
    fileId: str
    fileName: str
    storagePath: str
    attachmentType: str
    sourceEntityType: str | None = None
    sourceEntityId: str | None = None
    sourceLabel: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class SafetyHealthLedgerSnapshot:
    meta: LedgerMeta
    sections: list[SafetyHealthLedgerSection] = field(default_factory=list)
    riskItems: list[LedgerRiskItem] = field(default_factory=list)
    measures: list[LedgerRiskReductionMeasure] = field(default_factory=list)
    inspectionHistory: list[LedgerInspectionHistory] = field(default_factory=list)
    findingHistory: list[LedgerFindingHistory] = field(default_factory=list)
    safetyCostHistory: list[LedgerSafetyCostHistory] = field(default_factory=list)
    attachments: list[LedgerAttachment] = field(default_factory=list)
    missingFields: list[MissingField] = field(default_factory=list)
    reviewWarnings: list[ReviewWarning] = field(default_factory=list)
    sourceLinks: list[SourceLink] = field(default_factory=list)


@dataclass
class SafetyHealthLedgerVersion:
    id: str
    ledgerId: str
    versionNo: int
    snapshot: dict
    createdBy: str
    createdAt: str
    changeSummary: str | None = None


@dataclass
class SafetyHealthLedgerExportJob:
    id: str
    ledgerId: str
    projectId: str
    status: str
    fileId: str | None = None
    storagePath: str | None = None
    createdAt: str = ""
    completedAt: str | None = None


@dataclass
class AdminUser:
    id: str
    name: str
    email: str
    phone: str | None = None
    department: str | None = None
    position: str | None = None
    status: str = "active"
    roleIds: list[str] = field(default_factory=list)
    projectAccessPolicy: str = "assigned_only"
    lastLoginAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class Permission:
    id: str
    key: str
    name: str
    groupKey: str
    description: str | None = None


@dataclass
class Role:
    id: str
    key: str
    name: str
    description: str | None = None
    permissionKeys: list[str] = field(default_factory=list)
    systemRole: bool = False
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class CompanyProfile:
    id: str
    companyName: str
    representativeName: str
    businessNumber: str
    address: str
    phone: str
    email: str
    logoFileId: str | None = None
    sealFileId: str | None = None
    engineerLicenseLabel: str | None = None
    defaultSignatureText: str | None = None
    defaultDocumentFooter: str | None = None
    defaultMailFooter: str | None = None
    updatedAt: str = ""


@dataclass
class DocumentTemplate:
    id: str
    templateKey: str
    name: str
    documentType: str
    status: str = "draft"
    currentVersionId: str | None = None
    publishedVersionId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class TemplateVersion:
    id: str
    templateId: str
    versionNo: int
    status: str = "draft"
    bodyTemplate: str = ""
    changeSummary: str | None = None
    reviewNote: str | None = None
    publishedAt: str | None = None
    publishedBy: str | None = None
    validationPassed: bool = False
    previewPassed: bool = False
    missingRequiredVariables: list[str] = field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class TemplateSection:
    id: str
    versionId: str
    key: str
    title: str
    body: str
    displayOrder: int


@dataclass
class TemplateVariable:
    id: str
    versionId: str
    variableKey: str
    label: str
    dataPath: str
    sourceModel: str
    dataType: str
    required: bool = False
    ownerSpecific: bool = False
    exampleValue: str | None = None
    usedSectionKeys: list[str] = field(default_factory=list)


@dataclass
class TemplateLoop:
    id: str
    versionId: str
    loopKey: str
    dataPath: str
    alias: str
    usedSectionKeys: list[str] = field(default_factory=list)


@dataclass
class TemplateCondition:
    id: str
    versionId: str
    conditionKey: str
    expression: str
    usedSectionKeys: list[str] = field(default_factory=list)


@dataclass
class TemplatePreviewRun:
    id: str
    versionId: str
    previewText: str
    missingFields: list[MissingField] = field(default_factory=list)
    sampleName: str | None = None
    createdAt: str = ""


@dataclass
class Phrase:
    id: str
    phraseType: str
    title: str
    body: str
    tags: list[str] = field(default_factory=list)
    status: str = "draft"
    publishedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class LegalClause:
    id: str
    clauseCode: str
    title: str
    body: str
    status: str = "draft"
    changeReason: str | None = None
    requestedReviewAt: str | None = None
    approvedAt: str | None = None
    approvedBy: str | None = None
    publishedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class PromptTemplate:
    id: str
    promptKey: str
    name: str
    promptType: str
    featureId: str
    status: str = "draft"
    currentVersionId: str | None = None
    publishedVersionId: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class PromptVersion:
    id: str
    promptId: str
    versionNo: int
    status: str = "draft"
    systemMessage: str = ""
    userMessageTemplate: str = ""
    inputSchema: dict | None = None
    outputSchema: dict | None = None
    guardrails: list[str] = field(default_factory=list)
    forbiddenBehaviors: list[str] = field(default_factory=list)
    reviewNote: str | None = None
    publishedAt: str | None = None
    publishedBy: str | None = None
    lastTestRunAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class PromptTestCase:
    id: str
    promptId: str
    name: str
    inputFixture: dict = field(default_factory=dict)
    expectedContains: list[str] = field(default_factory=list)
    expectedMissing: list[str] = field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class PromptRunLog:
    id: str
    promptVersionId: str
    testCaseId: str | None = None
    inputFixture: dict = field(default_factory=dict)
    outputText: str = ""
    schemaValid: bool = True
    forbiddenBehaviorHits: list[str] = field(default_factory=list)
    passed: bool = True
    createdAt: str = ""


@dataclass
class WebhardPolicy:
    id: str
    defaultRootFolderName: str
    generatedDocumentsFolderName: str
    submissionFolderName: str
    sharedLinkExpiryDays: int
    requireLockedFinalFiles: bool = True
    updatedAt: str = ""


@dataclass
class AdminAuditLog:
    id: str
    actorUserId: str
    action: str
    targetType: str
    targetId: str
    targetName: str
    reason: str
    changedFields: list[str] = field(default_factory=list)
    createdAt: str = ""


@dataclass
class DashboardWidget:
    id: str
    title: str
    widgetType: str
    route: str
    scope: str = "global"
    projectId: str | None = None
    ownerPartyId: str | None = None
    displayOrder: int = 0
    settings: dict = field(default_factory=dict)
    enabled: bool = True
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class DashboardSnapshot:
    id: str
    scope: str
    projectId: str | None = None
    snapshotDate: str = ""
    metrics: list[dict] = field(default_factory=list)
    alerts: list[str] = field(default_factory=list)
    createdAt: str = ""


@dataclass
class DashboardMetric:
    id: str
    metricKey: str
    label: str
    value: float | int
    unit: str | None = None
    trend: str | None = None
    status: str = "info"
    route: str | None = None
    projectId: str | None = None
    ownerPartyId: str | None = None
    inspectionRoundId: str | None = None
    documentId: str | None = None
    submissionId: str | None = None
    fileId: str | None = None
    mailThreadId: str | None = None
    metadata: dict = field(default_factory=dict)


@dataclass
class ProjectHealthMetric:
    id: str
    projectId: str
    projectName: str
    riskScore: int
    openFindings: int
    pendingApprovals: int
    overdueReports: int
    submissionLagCount: int
    safetyCostWarningCount: int
    healthStatus: str
    updatedAt: str = ""


@dataclass
class OwnerReportStatusSummary:
    id: str
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    ownerDisplayName: str
    status: str
    documentId: str | None = None
    submissionId: str | None = None
    mailThreadId: str | None = None
    dueDate: str | None = None
    submittedAt: str | None = None


@dataclass
class FindingAgingBucket:
    id: str
    projectId: str
    bucketKey: str
    label: str
    count: int
    findingIds: list[str] = field(default_factory=list)


@dataclass
class StatisticsMetric:
    id: str
    seriesKey: str
    label: str
    x: str
    y: float | int
    projectId: str | None = None
    ownerPartyId: str | None = None
    inspectionRoundId: str | None = None
    basisDate: str | None = None
    periodStart: str | None = None
    periodEnd: str | None = None
    calculationNote: str | None = None
    sourceModels: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)


@dataclass
class DashboardAlert:
    id: str
    alertKey: str
    scope: str
    severity: str
    title: str
    message: str
    route: str
    status: str = "open"
    projectId: str | None = None
    ownerPartyId: str | None = None
    inspectionRoundId: str | None = None
    documentId: str | None = None
    submissionId: str | None = None
    acknowledgedAt: str | None = None
    dismissedAt: str | None = None
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class AlertRule:
    id: str
    ruleKey: str
    name: str
    description: str
    severity: str
    enabled: bool = True
    threshold: float | int | None = None
    scope: str = "global"
    createdAt: str = ""
    updatedAt: str = ""


@dataclass
class DashboardInsightRun:
    id: str
    insightType: str
    scope: str
    projectId: str | None = None
    title: str = ""
    summaryText: str = ""
    sourceMetricKeys: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    createdAt: str = ""
