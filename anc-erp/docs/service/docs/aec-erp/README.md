# A&C 기술사 ERP 문서팩 — 00~14 누적 v1

이 패키지는 업로드된 대화 흐름을 기준으로, A&C 기술사 ERP의 전체 골격과 기능 01~14를 누적 정리한 문서팩이다.

## 포함 범위

```text
00. 전체 골격
01. 프로젝트/현장 원장 관리
02. 계약/견적 관리
03. 점검회차/일정 관리
04. 공사안전보건대장 이행확인 보고서 자동화
05. 현장점검 체크리스트
06. 지적사항/조치현황/사진대지
07. 산업안전보건관리비 사용내용 확인
08. 안전관리계획서 자동화
09. 안전보건대장 자동화
10. 웹하드
11. 메일함
12. 결재/서명/제출
13. 관리자/템플릿/프롬프트
14. 대시보드/통계
```

## 기능별 파일 세트

각 기능은 동일한 8개 파일 구조를 유지한다.

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

## 이번 추가분

이번 버전은 기존 00~13 구조를 유지하면서 `14-dashboard-statistics`를 추가했다. 14번 기능은 A&C 기술사 ERP에서 프로젝트, 점검회차, 보고서, 지적사항, 산업안전보건관리비, 웹하드, 메일함, 결재/제출 데이터를 집계하여 오늘 업무, 제출 예정, 미조치, 지연, 프로젝트 위험도, 발주처별 제출 상태, 월별 통계를 보여주는 운영 관제 모듈이다.

14번 기능의 핵심은 아래와 같다.

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

## 누적 핵심 원칙

- 모든 기능은 `Project`를 중심으로 연결한다.
- 발주처별 분기 기능은 `ownerPartyId`를 반드시 고려한다.
- 문서 자동화 기능은 `DocumentTemplate`과 `PromptTemplate`의 버전 관리를 전제로 한다.
- 대시보드는 원본 업무 데이터를 수정하지 않고 집계/요약/알림만 수행한다.
- 통계 수치는 기준일, 계산 기준, 원본 모델을 함께 표시한다.
- AI 초안과 AI 브리핑은 최종 판단이 아니며, 원본 데이터 기반으로만 작성한다.
- 기능 구현 전 Reverse Map으로 화면, API, 모델, 프롬프트, 테스트를 역추적한다.
