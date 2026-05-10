import type {
  Contact,
  ExtractedContact,
  ExtractedOrganization,
  ExtractedProject,
  ExtractedProjectParty,
  Organization,
  Project,
  ProjectActivityLog,
  ProjectExtractionResult,
  ProjectExtractionValidationResult,
  ProjectParty,
  ProjectRelatedCounts,
  ProjectRequirementStatus,
} from "../../packages/contracts/src";

export const sampleProject: Project = {
  id: "project-sample-001",
  projectCode: "ANC-2025-001",
  projectName: "리움미술관 승강기 교체공사",
  siteName: "리움미술관",
  siteAddress: "서울시 용산구 한남동 이태원로 55길 60-16",
  constructionType: "승강기 교체공사",
  constructionDescription: "승강기 교체 및 부대 안전시설 정비",
  totalAmount: 9130000000,
  startDate: "2025-10-01",
  endDate: "2028-02-29",
  actualStartDate: "2025-11-03",
  progressRate: 3.9,
  inspectionCycleText: "3개월 이내 1회",
  totalInspectionRounds: 10,
  status: "active",
  memo: "문서/점검/발주처 분기를 위한 기준 프로젝트 원장",
  createdAt: "2026-05-01T09:00:00+09:00",
  updatedAt: "2026-05-09T10:00:00+09:00",
};

export const sampleOrganizations: Organization[] = [
  {
    id: "org-owner-001",
    name: "삼성문화재단",
    type: "owner",
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
  {
    id: "org-owner-002",
    name: "삼성생명공익재단",
    type: "owner",
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
  {
    id: "org-contractor-001",
    name: "현대엘리베이터(주)",
    type: "contractor",
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
  {
    id: "org-engineer-001",
    name: "A&C기술사사무소",
    type: "engineer",
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
];

export const sampleProjectParties: ProjectParty[] = [
  {
    id: "project-party-owner-001",
    projectId: sampleProject.id,
    organizationId: "org-owner-001",
    role: "owner",
    shareRatio: 50,
    shareAmount: 4565000000,
    requiresSeparateReport: true,
    reportRecipient: true,
    invoiceRecipient: false,
    displayOrder: 1,
    ownerPartyId: "owner-samsung-cultural-foundation",
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
  {
    id: "project-party-owner-002",
    projectId: sampleProject.id,
    organizationId: "org-owner-002",
    role: "owner",
    shareRatio: 50,
    shareAmount: 4565000000,
    requiresSeparateReport: true,
    reportRecipient: true,
    invoiceRecipient: false,
    displayOrder: 2,
    ownerPartyId: "owner-samsung-life-foundation",
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
  {
    id: "project-party-contractor-001",
    projectId: sampleProject.id,
    organizationId: "org-contractor-001",
    role: "contractor",
    requiresSeparateReport: false,
    reportRecipient: false,
    invoiceRecipient: true,
    displayOrder: 3,
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
  {
    id: "project-party-engineer-001",
    projectId: sampleProject.id,
    organizationId: "org-engineer-001",
    role: "engineer",
    requiresSeparateReport: false,
    reportRecipient: false,
    invoiceRecipient: false,
    displayOrder: 4,
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
];

export const sampleContacts: Contact[] = [
  {
    id: "contact-owner-001",
    projectId: sampleProject.id,
    organizationId: "org-owner-001",
    name: "김발주",
    position: "과장",
    phone: "010-1111-2222",
    email: "owner1@example.com",
    roleDescription: "보고서 수신 담당",
    isPrimary: true,
    receivesReport: true,
    receivesActionRequest: false,
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
  {
    id: "contact-owner-002",
    projectId: sampleProject.id,
    organizationId: "org-owner-002",
    name: "박발주",
    position: "대리",
    phone: "010-3333-4444",
    email: "owner2@example.com",
    roleDescription: "발주처 담당자",
    isPrimary: false,
    receivesReport: true,
    receivesActionRequest: false,
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
  {
    id: "contact-contractor-001",
    projectId: sampleProject.id,
    organizationId: "org-contractor-001",
    name: "이시공",
    position: "소장",
    phone: "010-5555-6666",
    email: "contractor@example.com",
    roleDescription: "현장 시공 담당",
    isPrimary: false,
    receivesReport: false,
    receivesActionRequest: true,
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-01T09:00:00+09:00",
  },
];

export const sampleRelatedCounts: ProjectRelatedCounts = {
  projectId: sampleProject.id,
  contracts: 1,
  inspectionRounds: 1,
  documents: 1,
  files: 1,
  mailThreads: 0,
  openFindings: 0,
};

export const sampleRequirements: ProjectRequirementStatus = {
  projectId: sampleProject.id,
  forSafetyReport: [],
  forContract: [],
  forInspectionRound: [],
  forMailSubmission: [],
  warnings: [],
};

export const sampleProjectHistory: ProjectActivityLog[] = [
  {
    id: "project-log-seed-001",
    projectId: sampleProject.id,
    action: "project.created",
    summary: "프로젝트 원장과 기본 웹하드 폴더 생성 요청이 등록되었습니다.",
    fieldNames: ["projectName", "siteName", "siteAddress"],
    createdAt: "2026-05-01T09:00:00+09:00",
  },
  {
    id: "project-log-seed-002",
    projectId: sampleProject.id,
    action: "project.updated",
    summary: "공정율과 점검조건이 최근 업데이트되었습니다.",
    fieldNames: ["progressRate", "inspectionCycleText"],
    createdAt: "2026-05-09T10:00:00+09:00",
  },
];

export const sampleExtractionSourceText = `
사업명: 리움미술관 승강기 교체공사
현장명: 리움미술관
현장주소: 서울시 용산구 한남동 이태원로 55길 60-16
공사종류: 승강기 교체공사
공사금액: 9,130,000,000원
공사기간: 2025-10-01 ~ 2028-02-29
실착공일: 2025-11-03
공정율: 3.9%
점검주기: 3개월 이내 1회
총 점검회차: 10
발주처: 삼성문화재단, 삼성생명공익재단
시공사: 현대엘리베이터(주)
엔지니어링사: A&C기술사사무소
담당자: 김발주 | 소속: 삼성문화재단 | 이메일: owner1@example.com | 전화: 010-1111-2222
`;

export const sampleExtractedProject: ExtractedProject = {
  projectName: sampleProject.projectName,
  siteName: sampleProject.siteName,
  siteAddress: sampleProject.siteAddress,
  constructionType: sampleProject.constructionType,
  totalAmount: sampleProject.totalAmount,
  startDate: sampleProject.startDate,
  endDate: sampleProject.endDate,
  actualStartDate: sampleProject.actualStartDate,
  progressRate: sampleProject.progressRate,
  inspectionCycleText: sampleProject.inspectionCycleText,
  totalInspectionRounds: sampleProject.totalInspectionRounds,
  status: "planning",
};

export const sampleExtractedOrganizations: ExtractedOrganization[] = sampleOrganizations.map((item) => ({
  name: item.name,
  type: item.type,
}));

export const sampleExtractedProjectParties: ExtractedProjectParty[] = sampleProjectParties.map((party) => ({
  organizationName: getOrganizationName(party.organizationId),
  role: party.role,
  shareRatio: party.shareRatio,
  shareAmount: party.shareAmount,
  requiresSeparateReport: party.role === "owner" ? null : false,
  reportRecipient: party.role === "owner" ? null : false,
  invoiceRecipient: party.role === "contractor" ? null : false,
}));

export const sampleExtractedContacts: ExtractedContact[] = sampleContacts.map((contact) => ({
  organizationName: getOrganizationName(contact.organizationId),
  name: contact.name,
  position: contact.position,
  phone: contact.phone,
  email: contact.email,
  roleDescription: contact.roleDescription,
  receivesReport: Boolean(contact.receivesReport),
  receivesActionRequest: Boolean(contact.receivesActionRequest),
}));

export const sampleExtractionPreview: ProjectExtractionResult = {
  project: sampleExtractedProject,
  organizations: sampleExtractedOrganizations,
  projectParties: sampleExtractedProjectParties,
  contacts: sampleExtractedContacts,
  warnings: [],
  isDraft: true,
};

export const sampleExtractionValidation: ProjectExtractionValidationResult = {
  projectId: sampleProject.id,
  warnings: [
    "ownerSeparateReportSettingUnknown",
    "ownerReportRecipientSettingUnknown",
  ],
  isDraft: true,
};

export function getSampleProjectData(projectId: string) {
  return {
    project: { ...sampleProject, id: projectId },
    organizations: sampleOrganizations,
    projectParties: sampleProjectParties.map((party) => ({ ...party, projectId })),
    contacts: sampleContacts.map((contact) => ({ ...contact, projectId })),
    relatedCounts: { ...sampleRelatedCounts, projectId },
    requirements: { ...sampleRequirements, projectId },
    activityLogs: sampleProjectHistory.map((log) => ({ ...log, projectId })),
  };
}

export function formatCurrency(value?: number | null) {
  if (value == null) {
    return "-";
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

export function getOrganizationName(organizationId: string) {
  return sampleOrganizations.find((item) => item.id === organizationId)?.name ?? "미지정";
}
