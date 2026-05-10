from pydantic import BaseModel


class InspectionScheduleRoundDraftPayload(BaseModel):
    roundNo: int
    plannedMonth: str | None = None
    plannedDate: str | None = None
    actualInspectionDate: str | None = None
    documentNo: str | None = None
    milestoneLabel: str | None = None


class InspectionSchedulePayload(BaseModel):
    contractId: str | None = None
    scheduleName: str
    basisType: str
    cycleText: str
    totalRounds: int
    startDate: str | None = None
    endDate: str | None = None
    status: str | None = None


class InspectionScheduleUpdatePayload(BaseModel):
    contractId: str | None = None
    scheduleName: str | None = None
    basisType: str | None = None
    cycleText: str | None = None
    totalRounds: int | None = None
    startDate: str | None = None
    endDate: str | None = None
    status: str | None = None


class InspectionSchedulePreviewPayload(BaseModel):
    contractId: str | None = None
    scheduleName: str | None = None
    basisType: str
    cycleText: str
    totalRounds: int
    startDate: str | None = None
    endDate: str | None = None
    rounds: list[InspectionScheduleRoundDraftPayload] = []
    documentNoPrefix: str | None = None
    generateOwnerReportTasks: bool = True


class InspectionRoundPayload(BaseModel):
    scheduleId: str | None = None
    roundNo: int
    name: str | None = None
    status: str | None = None
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


class InspectionRoundUpdatePayload(BaseModel):
    name: str | None = None
    status: str | None = None
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


class InspectionRoundConfirmDatePayload(BaseModel):
    plannedDate: str | None = None
    actualInspectionDate: str | None = None
    inspectorUserId: str | None = None
    confirmerContactId: str | None = None
    contractorContactId: str | None = None


class InspectionRoundReschedulePayload(BaseModel):
    plannedDate: str | None = None
    actualInspectionDate: str | None = None
    reason: str
    requestedBy: str | None = None
    approvedBy: str | None = None
    mailThreadId: str | None = None
    fileId: str | None = None


class InspectionOwnerReportTaskUpdatePayload(BaseModel):
    status: str | None = None
    documentInstanceId: str | None = None
    exportedFileId: str | None = None
    submittedAt: str | None = None
    mailThreadId: str | None = None
    submissionId: str | None = None


class InspectionOwnerReportTaskLinkDocumentPayload(BaseModel):
    documentInstanceId: str


class InspectionOwnerReportTaskMarkExportedPayload(BaseModel):
    exportedFileId: str


class InspectionOwnerReportTaskMarkSubmittedPayload(BaseModel):
    submittedAt: str | None = None
    mailThreadId: str | None = None
    submissionId: str | None = None


class InspectionTaskPayload(BaseModel):
    taskType: str
    title: str
    dueDate: str | None = None
    assigneeId: str | None = None
    status: str | None = None
    linkedEntityType: str | None = None
    linkedEntityId: str | None = None


class InspectionTaskUpdatePayload(BaseModel):
    title: str | None = None
    dueDate: str | None = None
    assigneeId: str | None = None
    status: str | None = None
    linkedEntityType: str | None = None
    linkedEntityId: str | None = None


class WorkScheduleAttachmentPayload(BaseModel):
    fileId: str
    fileName: str
    storagePath: str
    attachmentType: str
    sourceLabel: str | None = None


class WorkScheduleAttachmentUpdatePayload(BaseModel):
    fileName: str | None = None
    storagePath: str | None = None
    attachmentType: str | None = None
    sourceLabel: str | None = None
