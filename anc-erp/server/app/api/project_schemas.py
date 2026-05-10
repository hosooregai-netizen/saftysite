from pydantic import BaseModel, Field


class ProjectCreatePayload(BaseModel):
    projectName: str
    projectCode: str | None = None
    siteName: str = ""
    siteAddress: str = ""
    constructionType: str = ""
    constructionDescription: str | None = None
    totalAmount: int | None = None
    startDate: str | None = None
    endDate: str | None = None
    actualStartDate: str | None = None
    progressRate: float | None = None
    inspectionCycleText: str | None = None
    totalInspectionRounds: int | None = None
    status: str = "planning"
    memo: str | None = None


class ProjectUpdatePayload(BaseModel):
    projectName: str | None = None
    projectCode: str | None = None
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
    status: str | None = None
    memo: str | None = None


class OrganizationPayload(BaseModel):
    name: str
    type: str
    businessNumber: str | None = None
    representativeName: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None


class OrganizationUpdatePayload(BaseModel):
    name: str | None = None
    type: str | None = None
    businessNumber: str | None = None
    representativeName: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None


class ProjectPartyPayload(BaseModel):
    organizationId: str
    role: str
    shareRatio: float | None = None
    shareAmount: int | None = None
    requiresSeparateReport: bool = False
    reportRecipient: bool = False
    invoiceRecipient: bool = False
    displayOrder: int | None = None
    note: str | None = None
    ownerPartyId: str | None = None


class ProjectPartyUpdatePayload(BaseModel):
    role: str | None = None
    shareRatio: float | None = None
    shareAmount: int | None = None
    requiresSeparateReport: bool | None = None
    reportRecipient: bool | None = None
    invoiceRecipient: bool | None = None
    displayOrder: int | None = None
    note: str | None = None
    ownerPartyId: str | None = None


class ProjectPartyReorderPayload(BaseModel):
    partyIds: list[str]


class ShareCalculationPartyPayload(BaseModel):
    shareRatio: float | None = None
    shareAmount: int | None = None


class ProjectPartyShareCalculationPayload(BaseModel):
    totalAmount: int | None = None
    parties: list[ShareCalculationPartyPayload]


class ContactPayload(BaseModel):
    organizationId: str
    name: str
    position: str | None = None
    phone: str | None = None
    email: str | None = None
    roleDescription: str | None = None
    isPrimary: bool = False
    receivesReport: bool = False
    receivesActionRequest: bool = False


class ContactUpdatePayload(BaseModel):
    name: str | None = None
    position: str | None = None
    phone: str | None = None
    email: str | None = None
    roleDescription: str | None = None
    isPrimary: bool | None = None
    receivesReport: bool | None = None
    receivesActionRequest: bool | None = None


class SetPrimaryContactPayload(BaseModel):
    contactId: str


class ExtractProjectPayload(BaseModel):
    sourceText: str = Field(min_length=1)


class ValidateExtractedInfoPayload(BaseModel):
    project: dict
    organizations: list[dict] = []
    projectParties: list[dict] = []
    contacts: list[dict] = []
    warnings: list[str] = []


class ApplyExtractedInfoPayload(BaseModel):
    project: dict
    organizations: list[dict] = []
    projectParties: list[dict] = []
    contacts: list[dict] = []
