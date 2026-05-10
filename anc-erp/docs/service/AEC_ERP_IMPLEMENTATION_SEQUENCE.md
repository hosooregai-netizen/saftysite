# A&C ERP Implementation Sequence

## Root prompts

1. `codex-runbook/ROOT_PROMPTS/00_READ_AND_PLAN.md`
2. `codex-runbook/ROOT_PROMPTS/01_BOOTSTRAP_SKELETON.md`
3. `codex-runbook/ROOT_PROMPTS/02_BOOTSTRAP_REVERSE_AUDIT.md`
4. `codex-runbook/ROOT_PROMPTS/03_VALIDATE_CONTAINMENT_BEFORE_IMPLEMENTATION.md`

## Feature order

| Order | Folder | Feature | Actual parent/container | Primary routes |
|---:|---|---|---|---|
| 0 | `00-overall-bootstrap` | 전체 골격 / Bootstrap | repository root / docs | /dashboard, /projects, /webhard, /mail, /admin |
| 1 | `01-project-field` | 프로젝트/현장 원장 관리 | Project root | /projects, /projects/new, /projects/[projectId] |
| 2 | `02-contract-estimate` | 계약/견적 관리 | Project | /projects/[projectId]/contracts, /projects/[projectId]/contracts/new, /contracts/[contractId] |
| 3 | `03-inspection-schedule` | 점검회차/일정 관리 | Project | /projects/[projectId]/inspections, /inspections/[inspectionRoundId], /calendar/inspections |
| 4 | `05-field-inspection-checklist` | 현장점검 체크리스트 | InspectionRound | /inspections/[inspectionRoundId]/checklist, /inspections/[inspectionRoundId]/checklist/mobile, /inspections/[inspectionRoundId]/checklist/review |
| 5 | `06-finding-action-photo-ledger` | 지적사항/조치현황/사진대지 | InspectionRound + Document section | /inspections/[inspectionRoundId]/findings, /inspections/[inspectionRoundId]/photo-ledger, /documents/safety-reports/[documentId]/sections/photo_ledger |
| 6 | `07-safety-cost-usage` | 산업안전보건관리비 사용내용 확인 | InspectionRound + OwnerParty + Document section | /projects/[projectId]/safety-costs, /inspections/[inspectionRoundId]/safety-costs, /documents/safety-reports/[documentId]/sections/safety_cost_usage |
| 7 | `04-safety-health-ledger-report` | 공사안전보건대장 이행확인 보고서 자동화 | Project + InspectionRound + OwnerParty | /projects/[projectId]/documents/safety-reports, /documents/safety-reports/[documentId], /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document |
| 8 | `08-safety-management-plan` | 안전관리계획서 자동화 | Project Document | /projects/[projectId]/documents/safety-management-plans, /documents/safety-management-plans/[documentId] |
| 9 | `09-safety-health-ledger` | 안전보건대장 자동화 | Project Document / Project ledger | /projects/[projectId]/documents/safety-health-ledgers, /documents/safety-health-ledgers/[documentId] |
| 10 | `10-webhard` | 웹하드 | Full-screen app + Project-linked file layer | /webhard, /webhard/projects/[projectId], /projects/[projectId]/webhard |
| 11 | `11-mailbox` | 메일함 | Full-screen app + Project/Document/Submission linked communication layer | /mail, /mail/compose, /projects/[projectId]/mail |
| 12 | `12-approval-signature-submission` | 결재/서명/제출 | DocumentInstance | /documents/[documentId]/approval, /documents/[documentId]/signature, /documents/[documentId]/submission, /approvals |
| 13 | `13-admin-template-prompt` | 관리자/템플릿/프롬프트 | Admin module | /admin, /admin/templates, /admin/prompts, /admin/checklists |
| 14 | `14-dashboard-statistics` | 대시보드/통계 | Global dashboard + Project health summaries | /dashboard, /dashboard/projects, /dashboard/documents, /dashboard/findings |

## Per-feature prompt order

```text
00_PLAN_ONLY.md
05_VALIDATE_PARENT_CHILD_PLACEMENT.md
01_IMPLEMENT_FEATURE.md
02_DESIGN_PASS.md
03_REVERSE_AUDIT.md
04_PATCH_FROM_AUDIT.md
```
