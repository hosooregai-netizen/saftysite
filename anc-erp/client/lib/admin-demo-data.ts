import type {
  AdminAuditLog,
  AdminDashboardSummaryResponse,
  AdminUser,
  CompanyProfile,
  DocumentTemplateDetailResponse,
  DocumentTemplateListItem,
  LegalClause,
  Permission,
  Phrase,
  PromptDetailResponse,
  PromptListItem,
  PromptVersion,
  Role,
  TemplateCondition,
  TemplateLoop,
  TemplateSection,
  TemplateVariable,
  TemplateVersion,
  WebhardPolicy,
} from "../../packages/contracts/src";

export function getSampleAdminUsers(): AdminUser[] {
  return [
    {
      id: "user-admin-001",
      name: "관리자",
      email: "admin@anc.local",
      department: "운영관리",
      position: "Admin",
      status: "active",
      roleIds: ["role-001"],
      projectAccessPolicy: "all",
      lastLoginAt: "2026-05-10T15:00:00+09:00",
      createdAt: "2026-05-10T15:00:00+09:00",
      updatedAt: "2026-05-10T15:00:00+09:00",
    },
  ];
}

export function getSampleRoles(): Role[] {
  return [
    {
      id: "role-001",
      key: "super_admin",
      name: "최고관리자",
      permissionKeys: ["template.publish", "prompt.publish", "admin.audit.read"],
      systemRole: true,
      createdAt: "2026-05-10T15:00:00+09:00",
      updatedAt: "2026-05-10T15:00:00+09:00",
    },
    {
      id: "role-002",
      key: "template_manager",
      name: "템플릿 관리자",
      permissionKeys: ["template.read", "template.write", "template.publish"],
      systemRole: false,
      createdAt: "2026-05-10T15:00:00+09:00",
      updatedAt: "2026-05-10T15:00:00+09:00",
    },
  ];
}

export function getSamplePermissions(): Permission[] {
  return [
    { id: "permission-001", key: "template.read", name: "템플릿 조회", groupKey: "template" },
    { id: "permission-002", key: "template.publish", name: "템플릿 발행", groupKey: "template" },
    { id: "permission-003", key: "prompt.read", name: "프롬프트 조회", groupKey: "prompt" },
    { id: "permission-004", key: "prompt.publish", name: "프롬프트 발행", groupKey: "prompt" },
    { id: "permission-005", key: "legal_clause.write", name: "법령 수정", groupKey: "legal" },
  ];
}

export function getSampleCompanyProfile(): CompanyProfile {
  return {
    id: "company-profile-001",
    companyName: "A&C기술사사무소",
    representativeName: "대표기술사",
    businessNumber: "000-00-00000",
    address: "서울시 강남구 테헤란로 100",
    phone: "02-0000-0000",
    email: "office@anc.local",
    engineerLicenseLabel: "건설안전기술사",
    defaultSignatureText: "본 문서는 업무용 초안입니다.",
    defaultDocumentFooter: "A&C 기술사 ERP 문서 시스템",
    defaultMailFooter: "A&C기술사사무소",
    updatedAt: "2026-05-10T15:00:00+09:00",
  };
}

function getSampleTemplateVersion(): TemplateVersion {
  return {
    id: "template-version-sample-001",
    templateId: "document-template-sample-001",
    versionNo: 1,
    status: "published",
    bodyTemplate: "{{project.projectName}} / {{owner.organizationName}}",
    changeSummary: "초기 발행본",
    reviewNote: null,
    publishedAt: "2026-05-10T15:00:00+09:00",
    publishedBy: "user-admin-001",
    validationPassed: true,
    previewPassed: true,
    missingRequiredVariables: [],
    createdAt: "2026-05-10T15:00:00+09:00",
    updatedAt: "2026-05-10T15:00:00+09:00",
  };
}

export function getSampleDocumentTemplateList(): DocumentTemplateListItem[] {
  const currentVersion = getSampleTemplateVersion();
  return [
    {
      template: {
        id: "document-template-sample-001",
        templateKey: "safety_health_ledger_inspection_report",
        name: "이행확인 보고서 템플릿",
        documentType: "safety_health_ledger_inspection_report",
        status: "published",
        currentVersionId: currentVersion.id,
        publishedVersionId: currentVersion.id,
        createdAt: "2026-05-10T15:00:00+09:00",
        updatedAt: "2026-05-10T15:00:00+09:00",
      },
      currentVersion,
      sectionCount: 2,
      variableCount: 2,
    },
  ];
}

export function getSampleDocumentTemplateDetail(templateId = "document-template-sample-001"): DocumentTemplateDetailResponse {
  const item = getSampleDocumentTemplateList()[0];
  const sections: TemplateSection[] = [
    { id: "template-section-001", versionId: item.currentVersion!.id, key: "cover", title: "표지", body: "{{project.projectName}}", displayOrder: 1 },
    { id: "template-section-002", versionId: item.currentVersion!.id, key: "body", title: "본문", body: "{{owner.organizationName}}", displayOrder: 2 },
  ];
  const variables: TemplateVariable[] = [
    {
      id: "template-variable-001",
      versionId: item.currentVersion!.id,
      variableKey: "project.projectName",
      label: "프로젝트명",
      dataPath: "project.projectName",
      sourceModel: "Project",
      dataType: "string",
      required: true,
      ownerSpecific: false,
      exampleValue: "샘플 프로젝트",
      usedSectionKeys: ["cover"],
    },
    {
      id: "template-variable-002",
      versionId: item.currentVersion!.id,
      variableKey: "owner.organizationName",
      label: "발주처명",
      dataPath: "owner.organizationName",
      sourceModel: "ProjectParty",
      dataType: "string",
      required: true,
      ownerSpecific: true,
      exampleValue: "샘플 발주처",
      usedSectionKeys: ["body"],
    },
  ];
  const loops: TemplateLoop[] = [];
  const conditions: TemplateCondition[] = [
    {
      id: "template-condition-001",
      versionId: item.currentVersion!.id,
      conditionKey: "owner.requiresSeparateReport",
      expression: "owner.requiresSeparateReport",
      usedSectionKeys: ["body"],
    },
  ];
  return {
    template: { ...item.template, id: templateId },
    currentVersion: item.currentVersion,
    versions: [item.currentVersion!],
    sections,
    variables,
    loops,
    conditions,
  };
}

function getSamplePromptVersion(): PromptVersion {
  return {
    id: "prompt-version-sample-001",
    promptId: "prompt-template-sample-001",
    versionNo: 1,
    status: "published",
    systemMessage: "시스템 메시지",
    userMessageTemplate: "사용자 메시지",
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    guardrails: ["Do not invent facts"],
    forbiddenBehaviors: ["invent_legal_text"],
    reviewNote: null,
    publishedAt: "2026-05-10T15:00:00+09:00",
    publishedBy: "user-admin-001",
    lastTestRunAt: "2026-05-10T15:00:00+09:00",
    createdAt: "2026-05-10T15:00:00+09:00",
    updatedAt: "2026-05-10T15:00:00+09:00",
  };
}

export function getSamplePromptList(): PromptListItem[] {
  const currentVersion = getSamplePromptVersion();
  return [
    {
      prompt: {
        id: "prompt-template-sample-001",
        promptKey: "template-variable-mapping-and-prompt-governance",
        name: "템플릿/프롬프트 거버넌스",
        promptType: "service_ai",
        featureId: "admin.template.prompt",
        status: "published",
        currentVersionId: currentVersion.id,
        publishedVersionId: currentVersion.id,
        createdAt: "2026-05-10T15:00:00+09:00",
        updatedAt: "2026-05-10T15:00:00+09:00",
      },
      currentVersion,
      testCaseCount: 1,
      runLogCount: 1,
    },
  ];
}

export function getSamplePromptDetail(promptId = "prompt-template-sample-001"): PromptDetailResponse {
  const item = getSamplePromptList()[0];
  return {
    prompt: { ...item.prompt, id: promptId },
    currentVersion: item.currentVersion,
    versions: [item.currentVersion!],
    testCases: [
      {
        id: "prompt-test-case-001",
        promptId,
        name: "기본 케이스",
        inputFixture: { projectId: "project-sample-001" },
        expectedContains: ["draft"],
        expectedMissing: [],
        createdAt: "2026-05-10T15:00:00+09:00",
        updatedAt: "2026-05-10T15:00:00+09:00",
      },
    ],
    runLogs: [
      {
        id: "prompt-run-log-001",
        promptVersionId: item.currentVersion!.id,
        testCaseId: "prompt-test-case-001",
        inputFixture: { projectId: "project-sample-001" },
        outputText: '{"draft":"ok"}',
        schemaValid: true,
        forbiddenBehaviorHits: [],
        passed: true,
        createdAt: "2026-05-10T15:00:00+09:00",
      },
    ],
  };
}

export function getSamplePhrases(): Phrase[] {
  return [
    {
      id: "phrase-001",
      phraseType: "standard_phrase",
      title: "보고서 기본 안내",
      body: "본 문서는 업무상 초안이며 사용자 확인 후 확정됩니다.",
      tags: ["draft"],
      status: "published",
      publishedAt: "2026-05-10T15:00:00+09:00",
      createdAt: "2026-05-10T15:00:00+09:00",
      updatedAt: "2026-05-10T15:00:00+09:00",
    },
  ];
}

export function getSampleLegalClauses(): LegalClause[] {
  return [
    {
      id: "legal-clause-001",
      clauseCode: "OSHA-001",
      title: "산업안전보건 기본 문구",
      body: "법령 문구 초안",
      status: "approved",
      changeReason: "초기 등록",
      requestedReviewAt: "2026-05-10T15:00:00+09:00",
      approvedAt: "2026-05-10T15:00:00+09:00",
      approvedBy: "user-legal-001",
      publishedAt: null,
      createdAt: "2026-05-10T15:00:00+09:00",
      updatedAt: "2026-05-10T15:00:00+09:00",
    },
  ];
}

export function getSampleWebhardPolicy(): WebhardPolicy {
  return {
    id: "webhard-policy-001",
    defaultRootFolderName: "A&C ERP 자료함",
    generatedDocumentsFolderName: "최종본",
    submissionFolderName: "제출본",
    sharedLinkExpiryDays: 14,
    requireLockedFinalFiles: true,
    updatedAt: "2026-05-10T15:00:00+09:00",
  };
}

export function getSampleAdminAuditLogs(): AdminAuditLog[] {
  return [
    {
      id: "admin-audit-001",
      actorUserId: "user-admin-001",
      action: "template_version.published",
      targetType: "template_version",
      targetId: "template-version-sample-001",
      targetName: "이행확인 보고서 템플릿",
      reason: "초기 발행",
      changedFields: ["status"],
      createdAt: "2026-05-10T15:00:00+09:00",
    },
  ];
}

export function getSampleAdminDashboardSummary(): AdminDashboardSummaryResponse {
  return {
    counts: {
      users: getSampleAdminUsers().length,
      activeTemplates: 1,
      reviewTemplates: 0,
      publishedPrompts: 1,
      failedPromptTests: 0,
    },
    recentLegalChanges: getSampleAdminAuditLogs(),
    recentAuditLogs: getSampleAdminAuditLogs(),
    warnings: [],
  };
}
