# Function Index

## 기능 문서 작성 규칙

각 기능은 아래 8개 파일로 구성한다.

```text
XX-feature-name/
├── README.md
├── markdown/
│   ├── 01_PRODUCT_MARKDOWN.md
│   ├── 02_TECH_MARKDOWN.md
│   ├── 05_DESIGN_MARKDOWN.md
│   └── 07_REVERSE_MAP.md
└── prompts/
    ├── 03_SERVICE_AI_PROMPT.md
    ├── 04_CODEX_IMPLEMENTATION_PROMPT.md
    ├── 06_DESIGN_PROMPT.md
    └── 08_REVERSE_PROMPT.md
```

## 기능별 진행 순서

| 번호 | 기능 | 우선순위 | 현재 포함 |
|---:|---|---|---|
| 01 | 프로젝트/현장 원장 관리 | P0 | 포함 |
| 02 | 계약/견적 관리 | P0 | 포함 |
| 03 | 점검회차/일정 관리 | P0 | 포함 |
| 04 | 공사안전보건대장 이행확인 보고서 자동화 | P0 | 포함 |
| 05 | 현장점검 체크리스트 | P0 | 포함 |
| 06 | 지적사항/조치현황/사진대지 | P0 | 포함 |
| 07 | 산업안전보건관리비 사용내용 확인 | P0 | 포함 |
| 08 | 안전관리계획서 자동화 | P1 | 포함 |
| 09 | 안전보건대장 자동화 | P1 | 포함 |
| 10 | 웹하드 | P0.5 | 포함 |
| 11 | 메일함 | P0.5 | 포함 |
| 12 | 결재/서명/제출 | P1 | 포함 |
| 13 | 관리자/템플릿/프롬프트 | P1 | 포함 |
| 14 | 대시보드/통계 | P1 | 포함 |

## 현재 누적 패키지 핵심 흐름

```text
Project
→ Contract
→ InspectionSchedule / InspectionRound
→ ChecklistSession / ChecklistResult
→ FindingCandidate / Finding
→ CorrectiveAction / EvidencePhoto
→ PhotoLedger
→ SafetyCostUsage
→ SafetyManagementPlan
→ SafetyHealthLedger
→ SafetyReport
→ FileAsset / Folder / ShareLink
→ MailAccount / MailThread / MailMessage
→ ApprovalWorkflow / SignatureTask
→ FinalDocumentPackage / Submission
→ DocumentTemplate / PromptTemplate / AdminAuditLog
→ DashboardSnapshot / StatisticsMetric / AlertRule
```
