export type ModuleNavigationItem = {
  featureId: string;
  name: string;
  route: string;
  actualParent: string;
  primaryContainer: string;
};

export const globalNavigation: ModuleNavigationItem[] = [
  {
    featureId: "00-overall-bootstrap",
    name: "대시보드",
    route: "/dashboard",
    actualParent: "repository root / docs",
    primaryContainer: "Repository + ERP shell",
  },
  {
    featureId: "project.field.registry",
    name: "프로젝트/현장",
    route: "/projects",
    actualParent: "Project root",
    primaryContainer: "Project",
  },
  {
    featureId: "webhard.files",
    name: "웹하드",
    route: "/webhard",
    actualParent: "Full-screen app + Project-linked file layer",
    primaryContainer: "Webhard shell",
  },
  {
    featureId: "mailbox.messages",
    name: "메일함",
    route: "/mail",
    actualParent: "Full-screen app + Project/Document/Submission linked communication layer",
    primaryContainer: "Mailbox 3-pane shell",
  },
  {
    featureId: "admin.template.prompt",
    name: "관리자",
    route: "/admin",
    actualParent: "Admin module",
    primaryContainer: "Admin shell",
  },
];

export const moduleNavigation: ModuleNavigationItem[] = [
  ...globalNavigation,
  {
    featureId: "contract.estimate.management",
    name: "계약/견적",
    route: "/projects/project-sample-001/contracts",
    actualParent: "Project",
    primaryContainer: "Project Detail > Contracts tab",
  },
  {
    featureId: "inspection.schedule.management",
    name: "점검회차/일정",
    route: "/projects/project-sample-001/inspections",
    actualParent: "Project",
    primaryContainer: "Project Detail > Inspection Rounds tab",
  },
  {
    featureId: "document.safety_health_ledger_report",
    name: "이행확인 보고서",
    route: "/projects/project-sample-001/documents/safety-reports",
    actualParent: "Project + InspectionRound + OwnerParty",
    primaryContainer: "Project Detail > Documents; DocumentInstance",
  },
  {
    featureId: "inspection.checklist.management",
    name: "체크리스트",
    route: "/inspections/round-sample-001/checklist",
    actualParent: "InspectionRound",
    primaryContainer: "Inspection Round Detail > Checklist tab",
  },
  {
    featureId: "finding.action.photo_ledger",
    name: "지적/조치/사진대지",
    route: "/inspections/round-sample-001/findings",
    actualParent: "InspectionRound + Document section",
    primaryContainer: "Inspection Round Detail > Findings / Photo Ledger tabs",
  },
  {
    featureId: "safety_cost.usage",
    name: "산안비 사용내역",
    route: "/inspections/round-sample-001/safety-costs",
    actualParent: "InspectionRound + OwnerParty + Document section",
    primaryContainer: "Inspection Round Detail > Safety Cost tab",
  },
  {
    featureId: "document.safety_management_plan",
    name: "안전관리계획서",
    route: "/projects/project-sample-001/documents/safety-management-plans",
    actualParent: "Project Document",
    primaryContainer: "Project Detail > Documents > Safety Management Plan",
  },
  {
    featureId: "document.safety_health_ledger",
    name: "안전보건대장",
    route: "/projects/project-sample-001/documents/safety-health-ledgers",
    actualParent: "Project Document / Project ledger",
    primaryContainer: "Project Detail > Documents > Safety Health Ledger",
  },
  {
    featureId: "approval.signature.submission",
    name: "결재/서명/제출",
    route: "/documents/doc-sample-001/approval",
    actualParent: "DocumentInstance",
    primaryContainer: "Document Detail > Approval / Signature / Submission",
  },
];

export function getFeatureNavigationItem(featureId: string): ModuleNavigationItem {
  const featureItem = moduleNavigation.find((item) => item.featureId === featureId);

  if (!featureItem) {
    throw new Error(`Unknown feature navigation item: ${featureId}`);
  }

  return featureItem;
}

export const containmentSummary = [
  {
    title: "Project",
    items: [
      "ProjectParty / Contact",
      "Contract / Estimate",
      "InspectionRound",
      "DocumentInstance",
      "FileAsset / MailThread",
    ],
  },
  {
    title: "InspectionRound",
    items: [
      "ChecklistSession / ChecklistResult",
      "Finding / CorrectiveAction / EvidencePhoto",
      "PhotoLedger / SafetyCostUsage",
      "OwnerReportTask",
    ],
  },
  {
    title: "DocumentInstance",
    items: [
      "DocumentSection",
      "PhotoLedger Section",
      "SafetyCost Section",
      "ApprovalWorkflow / Submission",
    ],
  },
];

export const projectDetailLinks = [
  { label: "프로젝트 개요", href: "/projects/project-sample-001" },
  { label: "계약/견적", href: "/projects/project-sample-001/contracts" },
  { label: "점검회차", href: "/projects/project-sample-001/inspections" },
  { label: "문서함", href: "/projects/project-sample-001/documents/safety-reports" },
  { label: "안전관리계획서", href: "/projects/project-sample-001/documents/safety-management-plans" },
  { label: "안전보건대장", href: "/projects/project-sample-001/documents/safety-health-ledgers" },
  { label: "웹하드", href: "/projects/project-sample-001/webhard" },
  { label: "메일", href: "/projects/project-sample-001/mail" },
];

export const inspectionRoundLinks = [
  { label: "체크리스트", href: "/inspections/round-sample-001/checklist" },
  { label: "지적사항", href: "/inspections/round-sample-001/findings" },
  { label: "사진대지", href: "/inspections/round-sample-001/photo-ledger" },
  { label: "산안비", href: "/inspections/round-sample-001/safety-costs" },
  {
    label: "발주처별 보고서 작업",
    href: "/inspections/round-sample-001/owner-reports/sample-owner-task/document",
  },
];

export const documentDetailLinks = [
  { label: "보고서 상세", href: "/documents/safety-reports/doc-sample-001" },
  { label: "결재", href: "/documents/doc-sample-001/approval" },
  { label: "서명", href: "/documents/doc-sample-001/signature" },
  { label: "제출", href: "/documents/doc-sample-001/submission" },
];

export function getProjectRegistryTabLinks(projectId: string) {
  return [
    { label: "개요", href: `/projects/${projectId}/overview` },
    { label: "계약/견적", href: `/projects/${projectId}/contracts` },
    { label: "점검회차", href: `/projects/${projectId}/inspections` },
    { label: "관계자", href: `/projects/${projectId}/parties` },
    { label: "연락처", href: `/projects/${projectId}/contacts` },
    { label: "누락정보", href: `/projects/${projectId}/requirements` },
    { label: "관련업무", href: `/projects/${projectId}/related` },
    { label: "이력", href: `/projects/${projectId}/history` },
    { label: "설정", href: `/projects/${projectId}/settings` },
  ];
}
