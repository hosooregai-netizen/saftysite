from pydantic import BaseModel


class ChecklistTemplatePayload(BaseModel):
    name: str
    description: str | None = None
    projectType: str | None = None
    documentType: str = "safety_health_ledger_inspection_report"
    version: str = "1.0.0"
    status: str | None = None


class ChecklistTemplateUpdatePayload(BaseModel):
    name: str | None = None
    description: str | None = None
    projectType: str | None = None
    documentType: str | None = None
    version: str | None = None
    status: str | None = None


class ChecklistItemPayload(BaseModel):
    categoryId: str
    categoryKey: str
    discipline: str | None = None
    title: str
    detail: str | None = None
    reportLabel: str | None = None
    defaultApplicability: bool = True
    isRequired: bool = True
    findingRequiredWhen: str = "caution_or_bad"
    sourceSectionKey: str | None = None
    displayOrder: int = 0


class ChecklistItemUpdatePayload(BaseModel):
    categoryId: str | None = None
    categoryKey: str | None = None
    discipline: str | None = None
    title: str | None = None
    detail: str | None = None
    reportLabel: str | None = None
    defaultApplicability: bool | None = None
    isRequired: bool | None = None
    findingRequiredWhen: str | None = None
    sourceSectionKey: str | None = None
    displayOrder: int | None = None


class ChecklistItemsReorderPayload(BaseModel):
    itemIds: list[str]


class ChecklistSessionPayload(BaseModel):
    templateId: str
    ownerPartyId: str | None = None
    inspectorUserId: str | None = None
    inspectionDate: str | None = None


class ChecklistSessionUpdatePayload(BaseModel):
    ownerPartyId: str | None = None
    inspectorUserId: str | None = None
    inspectionDate: str | None = None
    status: str | None = None


class ChecklistResultPayload(BaseModel):
    checklistItemId: str
    result: str = "not_checked"
    comment: str | None = None
    reportComment: str | None = None
    actionRequired: bool = False
    responsiblePartyId: str | None = None
    dueDate: str | None = None


class ChecklistResultUpdatePayload(BaseModel):
    result: str | None = None
    comment: str | None = None
    reportComment: str | None = None
    actionRequired: bool | None = None
    responsiblePartyId: str | None = None
    dueDate: str | None = None


class ChecklistBulkSaveRowPayload(BaseModel):
    resultId: str
    result: str | None = None
    comment: str | None = None
    reportComment: str | None = None
    actionRequired: bool | None = None
    responsiblePartyId: str | None = None
    dueDate: str | None = None


class ChecklistBulkSavePayload(BaseModel):
    rows: list[ChecklistBulkSaveRowPayload]


class ChecklistFillNotApplicablePayload(BaseModel):
    reason: str | None = None


class FindingCandidateCreatePayload(BaseModel):
    title: str | None = None
    detail: str | None = None
    riskType: str | None = None
    requiredAction: str | None = None


class FindingCandidateDismissPayload(BaseModel):
    dismissedReason: str | None = None


class AdditionalHazardPayload(BaseModel):
    hazardDescription: str
    contractorPlan: str | None = None
    checkPoint: str | None = None
    implementationStatus: str = "not_checked"
    note: str | None = None


class AdditionalHazardUpdatePayload(BaseModel):
    hazardDescription: str | None = None
    contractorPlan: str | None = None
    checkPoint: str | None = None
    implementationStatus: str | None = None
    note: str | None = None


class ChecklistPhotoUploadPayload(BaseModel):
    fileId: str
    fileName: str
    storagePath: str
    caption: str | None = None
    additionalHazardId: str | None = None


class ChecklistPhotoLinkPayload(BaseModel):
    photoId: str
    additionalHazardId: str | None = None


class ChecklistMobileDraftPayload(BaseModel):
    clientVersion: int = 1
    draftVersion: int = 1
    payload: dict = {}


class ChecklistMobileDraftCommitPayload(BaseModel):
    clientVersion: int
    draftVersion: int
    payload: dict = {}
