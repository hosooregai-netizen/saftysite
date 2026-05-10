from pydantic import BaseModel


class SafetyReportDraftPayload(BaseModel):
    projectId: str
    inspectionRoundId: str
    ownerPartyId: str
    templateId: str
    ownerReportTaskId: str | None = None
    generationMode: str = "from_linked_data"
    cloneFromDocumentId: str | None = None


class SafetyReportUpdatePayload(BaseModel):
    title: str | None = None
    status: str | None = None
    documentNo: str | None = None


class SafetyReportSaveSectionPayload(BaseModel):
    sectionKey: str
    content: dict
    status: str | None = None
    changeSummary: str | None = None
    updatedBy: str = "user-engineer-001"


class SafetyReportConfirmPayload(BaseModel):
    confirmedBy: str = "user-engineer-001"


class SafetyReportExportPayload(BaseModel):
    exportedBy: str = "user-engineer-001"


class SafetyReportCloneForOwnerPayload(BaseModel):
    ownerPartyId: str
    ownerReportTaskId: str | None = None


class SafetyReportLinkOwnerTaskPayload(BaseModel):
    ownerReportTaskId: str


class SafetyReportMarkSubmittedPayload(BaseModel):
    submittedAt: str | None = None
    mailThreadId: str | None = None
    submissionId: str | None = None

