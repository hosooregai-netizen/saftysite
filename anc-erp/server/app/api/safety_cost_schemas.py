from pydantic import BaseModel


class SafetyCostUsagePayload(BaseModel):
    ownerPartyId: str
    calculatedAmount: int
    usedAmount: int
    userEnteredRate: float | None = None
    basisMonth: str | None = None
    basisDate: str | None = None
    basisDocumentText: str | None = None
    appropriatenessComment: str | None = None
    appropriatenessStatus: str | None = None
    reportInclude: bool = True


class SafetyCostUsageUpdatePayload(BaseModel):
    calculatedAmount: int | None = None
    usedAmount: int | None = None
    userEnteredRate: float | None = None
    basisMonth: str | None = None
    basisDate: str | None = None
    basisDocumentText: str | None = None
    appropriatenessComment: str | None = None
    appropriatenessStatus: str | None = None
    reportInclude: bool | None = None
    status: str | None = None


class SafetyCostReviewPayload(BaseModel):
    reviewerId: str
    reviewComment: str
    appropriatenessStatus: str
    aiDraftComment: str | None = None


class SafetyCostConfirmPayload(BaseModel):
    confirmedBy: str
    confirmedAt: str | None = None


class SafetyCostEvidenceUploadPayload(BaseModel):
    fileId: str
    evidenceType: str
    fileName: str
    storagePath: str
    issuedDate: str | None = None
    submittedBy: str | None = None
    memo: str | None = None


class SafetyCostEvidenceLinkPayload(BaseModel):
    fileId: str
    evidenceType: str
    fileName: str
    storagePath: str
    issuedDate: str | None = None
    submittedBy: str | None = None
    memo: str | None = None


class SafetyCostEvidenceUpdatePayload(BaseModel):
    evidenceType: str | None = None
    fileName: str | None = None
    storagePath: str | None = None
    issuedDate: str | None = None
    submittedBy: str | None = None
    memo: str | None = None


class SafetyCostSyncPayload(BaseModel):
    documentId: str
