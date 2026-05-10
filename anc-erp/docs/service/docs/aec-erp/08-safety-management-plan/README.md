# 기능 08 — 안전관리계획서 자동화

이 폴더는 A&C 기술사 ERP의 여덟 번째 기능인 `안전관리계획서 자동화` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

안전관리계획서 자동화는 프로젝트 원장, 계약, 공정표, 작업공법, 위험성평가, 조직도, 비상연락망, 교육계획, 점검계획, 산업안전보건관리비 사용계획, 첨부자료를 기반으로 안전관리계획서 초안을 작성하고 A4 미리보기와 PDF/HWPX export를 제공하는 기능이다.

```text
Project
→ ProjectParty / Contact / Contract
→ WorkScheduleAttachment
→ WorkType
→ RiskRegister / RiskItem
→ SafetyManagementPlan
→ SafetyManagementPlanSection
→ A4 Preview
→ FileAsset / Submission
```

## 핵심 설계 포인트

- 안전관리계획서는 기본적으로 `projectId` 기준 프로젝트 단위 계획 문서다.
- 특정 회차에서 개정하거나 보완한 경우 `inspectionRoundId`를 optional revision link로 연결할 수 있다.
- AI는 공사개요, 공종별 위험요인, 감소대책, 교육·점검계획의 초안만 작성한다.
- 법령·표준 문구는 관리자 템플릿에 등록된 문구만 사용한다.
- 최종 export는 최신 저장 snapshot 기준으로 수행한다.
- 리움미술관 승강기 교체공사처럼 승강기/에스컬레이터 교체, 가설전기, 사다리, 화기, 양중, 밀폐공간 등 작업위험을 WorkType + RiskItem으로 구조화한다.
