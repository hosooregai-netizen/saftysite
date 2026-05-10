from pydantic import BaseModel, Field


class MailAccountGuestPayload(BaseModel):
    projectId: str | None = None
    email: str = "guest-draft@anc.local"
    displayName: str = "A&C Guest Draft"


class MailAccountUpdatePayload(BaseModel):
    displayName: str | None = None
    status: str | None = None


class MailThreadUpdatePayload(BaseModel):
    status: str | None = None


class MailMessageUpdatePayload(BaseModel):
    folder: str | None = None
    isRead: bool | None = None


class MailMessageLinkEntityPayload(BaseModel):
    projectId: str
    entityType: str
    entityId: str
    relationType: str = "reference"


class MailDraftPayload(BaseModel):
    draftType: str
    mode: str = "guest_draft_mode"
    projectId: str | None = None
    inspectionRoundId: str | None = None
    ownerPartyId: str | None = None
    documentId: str | None = None
    submissionId: str | None = None
    findingIds: list[str] = Field(default_factory=list)
    contractId: str | None = None
    estimateId: str | None = None
    accountId: str | None = None
    threadId: str | None = None
    toAddresses: list[str] = Field(default_factory=list)
    ccAddresses: list[str] = Field(default_factory=list)
    subject: str = ""
    body: str = ""
    attachmentFileIds: list[str] = Field(default_factory=list)
    templateId: str | None = None


class MailDraftUpdatePayload(BaseModel):
    mode: str | None = None
    accountId: str | None = None
    toAddresses: list[str] | None = None
    ccAddresses: list[str] | None = None
    subject: str | None = None
    body: str | None = None
    attachmentFileIds: list[str] | None = None
    templateId: str | None = None


class MailDraftGeneratePayload(BaseModel):
    prompt: str | None = None


class MailDraftSendPayload(BaseModel):
    sentAt: str | None = None


class MailSendPayload(BaseModel):
    draftType: str
    mode: str = "connected_oauth_mode"
    projectId: str | None = None
    inspectionRoundId: str | None = None
    ownerPartyId: str | None = None
    documentId: str | None = None
    submissionId: str | None = None
    findingIds: list[str] = Field(default_factory=list)
    accountId: str | None = None
    toAddresses: list[str] = Field(default_factory=list)
    ccAddresses: list[str] = Field(default_factory=list)
    subject: str
    body: str
    attachmentFileIds: list[str] = Field(default_factory=list)
    sentAt: str | None = None


class MailAttachmentLinkFilePayload(BaseModel):
    fileId: str


class MailAttachmentBulkSavePayload(BaseModel):
    projectId: str
    attachmentIds: list[str]


class ContextMailDraftPayload(BaseModel):
    ownerPartyId: str | None = None
    findingIds: list[str] = Field(default_factory=list)
    contractorContactId: str | None = None
    subject: str | None = None
    body: str | None = None


class MailTemplatePayload(BaseModel):
    name: str
    templateType: str
    subjectTemplate: str
    bodyTemplate: str
    variables: list[str] = Field(default_factory=list)


class MailTemplateUpdatePayload(BaseModel):
    name: str | None = None
    subjectTemplate: str | None = None
    bodyTemplate: str | None = None
    variables: list[str] | None = None


class MailSignaturePayload(BaseModel):
    label: str
    content: str
    accountId: str | None = None
    isDefault: bool = False


class MailSignatureUpdatePayload(BaseModel):
    label: str | None = None
    content: str | None = None
    isDefault: bool | None = None
