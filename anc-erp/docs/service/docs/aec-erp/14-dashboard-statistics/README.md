# 기능 14 — 대시보드/통계

이 폴더는 A&C 기술사 ERP의 열네 번째 기능인 `대시보드/통계` 문서팩이다.

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

대시보드/통계는 00~13 모듈에서 생성되는 업무 데이터를 한 화면에 모아, 오늘 해야 할 일과 위험 신호를 보여주는 운영 관제 기능이다.

핵심 흐름은 아래와 같다.

```text
Project
→ InspectionRound
→ ChecklistSession
→ Finding / CorrectiveAction
→ PhotoLedger
→ SafetyCostUsage
→ DocumentInstance
→ ApprovalWorkflow / SignatureTask
→ Submission
→ MailThread / FileAsset
→ DashboardSnapshot / StatisticsMetric / AlertRule
```

이 기능은 원본 데이터를 직접 수정하지 않는다. 집계, 요약, 알림, 통계, 우선순위 제안만 수행한다.

## 주요 지표

- 오늘/이번 주 점검
- 제출 예정 보고서
- 미제출 보고서
- 미조치 지적사항
- 조치 지연 건수
- 사진대지 누락 건수
- 산업안전보건관리비 사용률
- 결재/서명/날인 대기
- 발주처별 제출 상태
- 웹하드 최근 파일
- 메일 미분류/미확인
- 프로젝트별 리스크 점수
