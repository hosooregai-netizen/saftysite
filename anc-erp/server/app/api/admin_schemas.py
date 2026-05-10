from pydantic import BaseModel


class AdminUserPayload(BaseModel):
    name: str
    email: str
    phone: str | None = None
    department: str | None = None
    position: str | None = None
    status: str = "active"
    roleIds: list[str] = []
    projectAccessPolicy: str = "assigned_only"


class AdminUserUpdatePayload(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    department: str | None = None
    position: str | None = None
    status: str | None = None
    roleIds: list[str] | None = None
    projectAccessPolicy: str | None = None


class RolePayload(BaseModel):
    key: str
    name: str
    description: str | None = None
    permissionKeys: list[str] = []
    systemRole: bool = False


class RoleUpdatePayload(BaseModel):
    key: str | None = None
    name: str | None = None
    description: str | None = None
    permissionKeys: list[str] | None = None


class RolePermissionsPayload(BaseModel):
    permissionKeys: list[str]
    reason: str = "권한 변경"
    actedBy: str = "user-admin-001"


class CompanyProfileUpdatePayload(BaseModel):
    companyName: str | None = None
    representativeName: str | None = None
    businessNumber: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    engineerLicenseLabel: str | None = None
    defaultSignatureText: str | None = None
    defaultDocumentFooter: str | None = None
    defaultMailFooter: str | None = None
    reason: str = "회사정보 수정"
    actedBy: str = "user-admin-001"


class CompanyFileUploadPayload(BaseModel):
    fileName: str
    fileType: str = "image/png"
    actedBy: str = "user-admin-001"
    reason: str = "회사 자산 업로드"


class DocumentTemplatePayload(BaseModel):
    templateKey: str
    name: str
    documentType: str


class DocumentTemplateUpdatePayload(BaseModel):
    name: str | None = None
    documentType: str | None = None
    status: str | None = None


class TemplateVersionPayload(BaseModel):
    bodyTemplate: str = ""
    changeSummary: str | None = None


class TemplateVersionUpdatePayload(BaseModel):
    bodyTemplate: str | None = None
    changeSummary: str | None = None
    reviewNote: str | None = None
    status: str | None = None


class TemplateReviewActionPayload(BaseModel):
    actedBy: str = "user-template-manager-001"
    reason: str = "버전 상태 변경"
    targetVersionId: str | None = None


class TemplateSectionPayload(BaseModel):
    key: str
    title: str
    body: str = ""
    displayOrder: int = 1


class TemplateSectionUpdatePayload(BaseModel):
    key: str | None = None
    title: str | None = None
    body: str | None = None
    displayOrder: int | None = None


class TemplateVariableUpdatePayload(BaseModel):
    label: str | None = None
    dataPath: str | None = None
    sourceModel: str | None = None
    dataType: str | None = None
    required: bool | None = None
    ownerSpecific: bool | None = None
    exampleValue: str | None = None


class TemplatePreviewPayload(BaseModel):
    sampleName: str = "기본 샘플"
    sampleData: dict = {}


class ChecklistTemplateAdminPayload(BaseModel):
    name: str
    description: str | None = None
    projectType: str | None = None
    documentType: str = "safety_health_ledger_inspection_report"
    version: str = "1.0.0"


class ChecklistTemplateAdminUpdatePayload(BaseModel):
    name: str | None = None
    description: str | None = None
    projectType: str | None = None
    documentType: str | None = None
    version: str | None = None
    status: str | None = None


class PhrasePayload(BaseModel):
    phraseType: str
    title: str
    body: str
    tags: list[str] = []


class PhraseUpdatePayload(BaseModel):
    phraseType: str | None = None
    title: str | None = None
    body: str | None = None
    tags: list[str] | None = None


class LegalClausePayload(BaseModel):
    clauseCode: str
    title: str
    body: str
    changeReason: str
    actedBy: str = "user-legal-001"
    hasLegalPermission: bool = True


class LegalClauseUpdatePayload(BaseModel):
    title: str | None = None
    body: str | None = None
    changeReason: str | None = None
    actedBy: str = "user-legal-001"
    hasLegalPermission: bool = True


class LegalClauseActionPayload(BaseModel):
    actedBy: str = "user-legal-001"
    reason: str = "법령 문구 검토"
    hasLegalPermission: bool = True


class PromptTemplatePayload(BaseModel):
    promptKey: str
    name: str
    promptType: str
    featureId: str


class PromptTemplateUpdatePayload(BaseModel):
    name: str | None = None
    promptType: str | None = None
    featureId: str | None = None
    status: str | None = None


class PromptVersionPayload(BaseModel):
    systemMessage: str = ""
    userMessageTemplate: str = ""
    inputSchema: dict | None = None
    outputSchema: dict | None = None
    guardrails: list[str] = []
    forbiddenBehaviors: list[str] = []
    changeSummary: str | None = None


class PromptVersionUpdatePayload(BaseModel):
    systemMessage: str | None = None
    userMessageTemplate: str | None = None
    inputSchema: dict | None = None
    outputSchema: dict | None = None
    guardrails: list[str] | None = None
    forbiddenBehaviors: list[str] | None = None
    reviewNote: str | None = None
    status: str | None = None


class PromptVersionActionPayload(BaseModel):
    actedBy: str = "user-prompt-manager-001"
    reason: str = "프롬프트 상태 변경"
    targetVersionId: str | None = None


class PromptRunPayload(BaseModel):
    inputFixture: dict = {}


class PromptTestCasePayload(BaseModel):
    name: str
    inputFixture: dict = {}
    expectedContains: list[str] = []
    expectedMissing: list[str] = []


class PromptTestCaseUpdatePayload(BaseModel):
    name: str | None = None
    inputFixture: dict | None = None
    expectedContains: list[str] | None = None
    expectedMissing: list[str] | None = None


class WebhardPolicyUpdatePayload(BaseModel):
    defaultRootFolderName: str | None = None
    generatedDocumentsFolderName: str | None = None
    submissionFolderName: str | None = None
    sharedLinkExpiryDays: int | None = None
    requireLockedFinalFiles: bool | None = None
    actedBy: str = "user-admin-001"
    reason: str = "웹하드 정책 수정"
