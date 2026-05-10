# A&C ERP Containment Map

기능 폴더는 구현 단위이고, 실제 화면/데이터는 아래 포함 구조를 따른다.

```text
Project
├── Contracts / Estimates
├── InspectionRounds
│   ├── Checklist
│   ├── Findings / CorrectiveActions
│   ├── PhotoLedger
│   ├── SafetyCostUsage
│   └── OwnerReportTasks
└── Documents / Reports
    ├── Sections
    ├── Approval / Signature
    └── Submission
```

| Feature folder | Feature | Actual parent | Primary container | Primary routes |
|---|---|---|---|---|
| `00-overall` | 전체 골격 / Bootstrap | repository root / docs | Repository + ERP shell | /dashboard, /projects, /webhard, /mail, /admin |
| `01-project-field` | 프로젝트/현장 원장 관리 | Project root | Project | /projects, /projects/new, /projects/[projectId] |
| `02-contract-estimate` | 계약/견적 관리 | Project | Project Detail > Contracts tab | /projects/[projectId]/contracts, /projects/[projectId]/contracts/new, /contracts/[contractId] |
| `03-inspection-schedule` | 점검회차/일정 관리 | Project | Project Detail > Inspection Rounds tab | /projects/[projectId]/inspections, /inspections/[inspectionRoundId], /calendar/inspections |
| `05-field-inspection-checklist` | 현장점검 체크리스트 | InspectionRound | Inspection Round Detail > Checklist tab | /inspections/[inspectionRoundId]/checklist, /inspections/[inspectionRoundId]/checklist/mobile, /inspections/[inspectionRoundId]/checklist/review |
| `06-finding-action-photo-ledger` | 지적사항/조치현황/사진대지 | InspectionRound + Document section | Inspection Round Detail > Findings/Photo Ledger tabs; Document > photo_ledger section | /inspections/[inspectionRoundId]/findings, /inspections/[inspectionRoundId]/photo-ledger, /documents/safety-reports/[documentId]/sections/photo_ledger |
| `07-safety-cost-usage` | 산업안전보건관리비 사용내용 확인 | InspectionRound + OwnerParty + Document section | Inspection Round Detail > Safety Cost tab; Document > safety_cost_usage section | /projects/[projectId]/safety-costs, /inspections/[inspectionRoundId]/safety-costs, /documents/safety-reports/[documentId]/sections/safety_cost_usage |
| `04-safety-health-ledger-report` | 공사안전보건대장 이행확인 보고서 자동화 | Project + InspectionRound + OwnerParty | Project Detail > Documents; InspectionRound > Owner Report Tasks; DocumentInstance | /projects/[projectId]/documents/safety-reports, /documents/safety-reports/[documentId], /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document |
| `08-safety-management-plan` | 안전관리계획서 자동화 | Project Document | Project Detail > Documents > Safety Management Plan | /projects/[projectId]/documents/safety-management-plans, /documents/safety-management-plans/[documentId] |
| `09-safety-health-ledger` | 안전보건대장 자동화 | Project Document / Project ledger | Project Detail > Documents > Safety Health Ledger | /projects/[projectId]/documents/safety-health-ledgers, /documents/safety-health-ledgers/[documentId] |
| `10-webhard` | 웹하드 | Full-screen app + Project-linked file layer | Webhard shell; Project Detail > Webhard tab | /webhard, /webhard/projects/[projectId], /projects/[projectId]/webhard |
| `11-mailbox` | 메일함 | Full-screen app + Project/Document/Submission linked communication layer | Mailbox 3-pane shell; Project Detail > Mail tab | /mail, /mail/compose, /projects/[projectId]/mail |
| `12-approval-signature-submission` | 결재/서명/제출 | DocumentInstance | Document Detail > Approval/Signature/Submission; global inbox as queue only | /documents/[documentId]/approval, /documents/[documentId]/signature, /documents/[documentId]/submission, /approvals |
| `13-admin-template-prompt` | 관리자/템플릿/프롬프트 | Admin module | Admin shell | /admin, /admin/templates, /admin/prompts, /admin/checklists |
| `14-dashboard-statistics` | 대시보드/통계 | Global dashboard + Project health summaries | Dashboard shell | /dashboard, /dashboard/projects, /dashboard/documents, /dashboard/findings |
