from pydantic import BaseModel


class SafetyManagementPlanCreatePayload(BaseModel):
    projectId: str
    templateId: str
    contractId: str | None = None
    inspectionRoundId: str | None = None
    generationMode: str = "from_project_snapshot"
    revisionReason: str | None = None


class SafetyManagementPlanUpdatePayload(BaseModel):
    title: str | None = None
    status: str | None = None
    contractId: str | None = None
    inspectionRoundId: str | None = None
    revisionReason: str | None = None


class SafetyManagementPlanSaveSectionPayload(BaseModel):
    sectionKey: str
    content: dict
    status: str | None = None
    changeSummary: str | None = None
    updatedBy: str = "user-engineer-001"


class SafetyManagementPlanConfirmPayload(BaseModel):
    confirmedBy: str = "user-engineer-001"


class SafetyManagementPlanExportPayload(BaseModel):
    exportedBy: str = "user-engineer-001"


class SafetyManagementWorkTypePayload(BaseModel):
    name: str
    description: str | None = None
    processOrder: int = 0


class SafetyManagementWorkTypeUpdatePayload(BaseModel):
    name: str | None = None
    description: str | None = None
    processOrder: int | None = None


class SafetyManagementRiskItemPayload(BaseModel):
    workTypeId: str | None = None
    workTypeName: str | None = None
    hazard: str
    riskCause: str | None = None
    reductionMeasure: str
    riskLevel: str = "medium"
    sourceType: str | None = None
    sourceId: str | None = None


class SafetyManagementRiskItemUpdatePayload(BaseModel):
    workTypeId: str | None = None
    workTypeName: str | None = None
    hazard: str | None = None
    riskCause: str | None = None
    reductionMeasure: str | None = None
    riskLevel: str | None = None
    status: str | None = None


class SafetyOrganizationPlanPayload(BaseModel):
    organizationChartFileId: str | None = None
    responsibilities: list[dict] = []


class SafetyEducationPlanPayload(BaseModel):
    items: list[dict] = []


class SafetyEmergencyPlanPayload(BaseModel):
    contacts: list[dict] = []


class SafetyManagementAttachmentLinkPayload(BaseModel):
    fileId: str
    fileName: str
    storagePath: str
    attachmentType: str
    sourceLabel: str | None = None
