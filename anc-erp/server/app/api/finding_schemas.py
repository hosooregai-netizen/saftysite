from pydantic import BaseModel


class FindingPayload(BaseModel):
    inspectionRoundId: str | None = None
    ownerPartyId: str | None = None
    title: str
    detail: str
    riskType: str | None = None
    requiredAction: str | None = None
    responsiblePartyId: str | None = None
    dueDate: str | None = None
    status: str | None = None
    sourceType: str | None = None
    sourceId: str | None = None
    checklistResultId: str | None = None
    additionalHazardItemId: str | None = None
    riskReductionItemId: str | None = None
    reportInclude: bool = True
    reportOrder: int | None = None


class FindingUpdatePayload(BaseModel):
    ownerPartyId: str | None = None
    title: str | None = None
    detail: str | None = None
    riskType: str | None = None
    requiredAction: str | None = None
    responsiblePartyId: str | None = None
    dueDate: str | None = None
    status: str | None = None
    reportInclude: bool | None = None
    reportOrder: int | None = None


class FindingRequestActionPayload(BaseModel):
    requiredAction: str | None = None
    dueDate: str | None = None


class FindingVerifyPayload(BaseModel):
    verifiedBy: str | None = None
    verificationComment: str | None = None


class FindingRejectPayload(BaseModel):
    rejectedReason: str


class FindingLinkChecklistResultPayload(BaseModel):
    checklistResultId: str


class FindingLinkOwnerPayload(BaseModel):
    ownerPartyId: str


class CorrectiveActionPayload(BaseModel):
    actionDetail: str
    actionDate: str | None = None
    actionOrganizationId: str | None = None


class CorrectiveActionUpdatePayload(BaseModel):
    actionDetail: str | None = None
    actionDate: str | None = None
    actionOrganizationId: str | None = None
    verificationComment: str | None = None


class CorrectiveActionSubmitPayload(BaseModel):
    actionDetail: str
    actionDate: str | None = None
    actionOrganizationId: str | None = None
    submittedBy: str | None = None


class CorrectiveActionVerifyPayload(BaseModel):
    verifiedBy: str
    verifiedAt: str
    verificationComment: str | None = None


class CorrectiveActionRejectPayload(BaseModel):
    rejectedReason: str


class EvidencePhotoUploadPayload(BaseModel):
    fileId: str
    fileName: str
    storagePath: str
    photoType: str = "finding_photo"
    caption: str | None = None
    takenAt: str | None = None
    uploadedBy: str | None = None
    correctiveActionId: str | None = None
    ownerPartyId: str | None = None


class EvidencePhotoLinkPayload(BaseModel):
    photoId: str
    correctiveActionId: str | None = None


class EvidencePhotoUpdatePayload(BaseModel):
    photoType: str | None = None
    caption: str | None = None
    takenAt: str | None = None
    reportInclude: bool | None = None


class PhotoMarkupShapePayload(BaseModel):
    id: str
    shapeType: str
    x: float
    y: float
    width: float | None = None
    height: float | None = None
    color: str = "#FFD84D"
    strokeStyle: str = "dashed"
    text: str | None = None


class PhotoMarkupPayload(BaseModel):
    shapes: list[PhotoMarkupShapePayload]


class EvidencePhotoCaptionPayload(BaseModel):
    caption: str


class PhotoLedgerPayload(BaseModel):
    ownerPartyId: str | None = None
    documentId: str | None = None
    title: str | None = None
    layoutMode: str = "one_entry_per_page"


class PhotoLedgerUpdatePayload(BaseModel):
    ownerPartyId: str | None = None
    documentId: str | None = None
    title: str | None = None
    layoutMode: str | None = None
    status: str | None = None


class PhotoLedgerEntryPayload(BaseModel):
    findingId: str
    correctiveActionId: str | None = None
    findingPhotoId: str | None = None
    actionPhotoId: str | None = None
    findingCaption: str | None = None
    actionCaption: str | None = None
    ownerPartyId: str | None = None
    confirmed: bool = False


class PhotoLedgerEntryUpdatePayload(BaseModel):
    correctiveActionId: str | None = None
    findingPhotoId: str | None = None
    actionPhotoId: str | None = None
    findingCaption: str | None = None
    actionCaption: str | None = None
    confirmed: bool | None = None


class PhotoLedgerReorderPayload(BaseModel):
    entryIds: list[str]


class PhotoLedgerSyncPayload(BaseModel):
    documentId: str


class ActionRequestMailDraftPayload(BaseModel):
    projectId: str
    inspectionRoundId: str
    findingIds: list[str]
    ownerPartyId: str | None = None
    contractorContactId: str | None = None


class ActionRequestMailSendPayload(BaseModel):
    mailDraftId: str
