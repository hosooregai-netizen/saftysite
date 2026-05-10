from pydantic import BaseModel


class SafetyHealthLedgerCreatePayload(BaseModel):
    projectId: str
    templateId: str
    sourcePlanId: str | None = None
    includeInspectionHistory: bool = True
    includeFindingHistory: bool = True
    includeSafetyCostHistory: bool = True
    revisionReason: str | None = None


class SafetyHealthLedgerUpdatePayload(BaseModel):
    title: str | None = None
    status: str | None = None
    templateId: str | None = None
    revisionReason: str | None = None


class SafetyHealthLedgerSaveSectionPayload(BaseModel):
    sectionKey: str
    content: dict
    status: str | None = None
    changeSummary: str | None = None
    updatedBy: str = "user-engineer-001"


class SafetyHealthLedgerConfirmPayload(BaseModel):
    confirmedBy: str = "user-engineer-001"


class SafetyHealthLedgerExportPayload(BaseModel):
    exportedBy: str = "user-engineer-001"


class LedgerRiskItemPayload(BaseModel):
    sourceType: str | None = None
    sourceId: str | None = None
    workType: str | None = None
    workDescription: str | None = None
    hazardDescription: str
    riskType: str | None = None
    riskLevel: str | None = None
    reductionMeasureSummary: str | None = None
    responsibleOrganizationId: str | None = None
    relatedChecklistItemIds: list[str] = []
    relatedFindingIds: list[str] = []
    status: str = "identified"


class LedgerRiskItemUpdatePayload(BaseModel):
    workType: str | None = None
    workDescription: str | None = None
    hazardDescription: str | None = None
    riskType: str | None = None
    riskLevel: str | None = None
    reductionMeasureSummary: str | None = None
    responsibleOrganizationId: str | None = None
    relatedChecklistItemIds: list[str] | None = None
    relatedFindingIds: list[str] | None = None
    status: str | None = None
    recurrenceCount: int | None = None


class LedgerMeasurePayload(BaseModel):
    riskItemId: str | None = None
    title: str
    description: str
    responsibleOrganizationId: str | None = None
    status: str = "planned"
    dueDate: str | None = None
    sourceType: str | None = None
    sourceId: str | None = None


class LedgerMeasureUpdatePayload(BaseModel):
    riskItemId: str | None = None
    title: str | None = None
    description: str | None = None
    responsibleOrganizationId: str | None = None
    status: str | None = None
    dueDate: str | None = None


class LedgerAttachmentLinkPayload(BaseModel):
    fileId: str
    fileName: str
    storagePath: str
    attachmentType: str
    sourceEntityType: str | None = None
    sourceEntityId: str | None = None
    sourceLabel: str | None = None


class SafetyHealthLedgerVersionPayload(BaseModel):
    changeSummary: str | None = None
    createdBy: str = "user-engineer-001"
