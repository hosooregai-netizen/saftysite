from pydantic import BaseModel, Field


class ContractPartyPayload(BaseModel):
    organizationId: str
    role: str
    projectPartyId: str | None = None
    displayName: str | None = None
    representativeName: str | None = None
    businessNumber: str | None = None
    address: str | None = None
    phone: str | None = None
    shareRatio: float | None = None
    shareAmount: int | None = None
    paymentRequired: bool = False
    signingRequired: bool = False
    displayOrder: int | None = None


class PaymentSplitItemPayload(BaseModel):
    organizationId: str
    projectPartyId: str | None = None
    label: str
    ratio: float
    amount: int


class PaymentTermPayload(BaseModel):
    label: str
    triggerText: str = ""
    dueDate: str | None = None
    amount: int
    ratio: float | None = None
    status: str = "planned"
    requestDate: str | None = None
    paidDate: str | None = None
    evidenceFileId: str | None = None
    splitItems: list[PaymentSplitItemPayload] = []


class ContractCreatePayload(BaseModel):
    contractTitle: str
    contractType: str = "technical_service"
    contractNo: str | None = None
    serviceName: str = ""
    serviceScope: str = ""
    contractAmount: int
    vatIncluded: bool = True
    vatAmount: int | None = None
    supplyAmount: int | None = None
    contractStartDate: str | None = None
    contractEndDate: str | None = None
    constructionStartDate: str | None = None
    constructionEndDate: str | None = None
    deliverables: list[str] = []
    inspectionCount: int | None = None
    paymentSummary: str | None = None
    status: str = "draft"
    parties: list[ContractPartyPayload] = []
    paymentTerms: list[PaymentTermPayload] = []


class ContractUpdatePayload(BaseModel):
    contractTitle: str | None = None
    contractType: str | None = None
    contractNo: str | None = None
    serviceName: str | None = None
    serviceScope: str | None = None
    contractAmount: int | None = None
    vatIncluded: bool | None = None
    vatAmount: int | None = None
    supplyAmount: int | None = None
    contractStartDate: str | None = None
    contractEndDate: str | None = None
    constructionStartDate: str | None = None
    constructionEndDate: str | None = None
    deliverables: list[str] | None = None
    inspectionCount: int | None = None
    paymentSummary: str | None = None
    status: str | None = None


class ContractPartyUpdatePayload(BaseModel):
    role: str | None = None
    displayName: str | None = None
    representativeName: str | None = None
    businessNumber: str | None = None
    address: str | None = None
    phone: str | None = None
    shareRatio: float | None = None
    shareAmount: int | None = None
    paymentRequired: bool | None = None
    signingRequired: bool | None = None
    displayOrder: int | None = None


class PaymentTermUpdatePayload(BaseModel):
    label: str | None = None
    triggerText: str | None = None
    dueDate: str | None = None
    amount: int | None = None
    ratio: float | None = None
    status: str | None = None
    requestDate: str | None = None
    paidDate: str | None = None
    evidenceFileId: str | None = None
    splitItems: list[PaymentSplitItemPayload] | None = None


class PaymentSplitCalculationPayload(BaseModel):
    amount: int = Field(ge=0)


class ContractFileUploadPayload(BaseModel):
    fileName: str
    fileType: str | None = None
    fileCategory: str = "attachment"


class EstimateItemPayload(BaseModel):
    id: str | None = None
    label: str
    description: str | None = None
    quantity: float = 1
    unitPrice: int
    supplyAmount: int
    vatAmount: int
    totalAmount: int


class EstimateCreatePayload(BaseModel):
    estimateNo: str | None = None
    title: str
    serviceName: str = ""
    validUntil: str | None = None
    status: str = "draft"
    supplyAmount: int
    vatAmount: int
    totalAmount: int
    items: list[EstimateItemPayload] = []


class EstimateUpdatePayload(BaseModel):
    estimateNo: str | None = None
    title: str | None = None
    serviceName: str | None = None
    validUntil: str | None = None
    status: str | None = None
    supplyAmount: int | None = None
    vatAmount: int | None = None
    totalAmount: int | None = None
    items: list[EstimateItemPayload] | None = None
