# Source Chat Summary — 00~13

업로드된 대화 내역 기준으로 A&C 기술사 ERP는 기존 app의 ERP 틀을 따르되, apps의 웹하드와 메일함을 포함하고, 기술지도보고가 아니라 A&C기술사사무소가 수행하는 안전관리계획서, 안전보건대장, 공사안전보건대장 이행확인 보고서 문서 자동화를 중심으로 설계한다.

이번 누적 패키지는 00 전체 골격부터 13 관리자/템플릿/프롬프트까지 이어진다.

## 현재 누적 흐름

```text
Project
→ Contract
→ InspectionRound
→ ChecklistSession
→ Finding / CorrectiveAction / EvidencePhoto
→ SafetyCostUsage
→ SafetyManagementPlan
→ SafetyHealthLedger
→ SafetyReport / PhotoLedger
→ FileAsset / Webhard
→ MailThread / MailMessage
→ ApprovalWorkflow / SignatureTask
→ FinalDocumentPackage / Submission
→ DocumentTemplate / PromptTemplate / AdminAuditLog
```

## 13번 관리자/템플릿/프롬프트 추가 기준

관리자/템플릿/프롬프트 기능은 ERP의 문서 자동화 품질과 운영 안정성을 관리한다. 프로젝트, 계약, 보고서, 안전관리계획서, 안전보건대장, 사진대지, 메일 초안은 모두 템플릿과 프롬프트에 의존하므로, 템플릿 본문·변수·반복 섹션·조건부 섹션·표준 문구·법령 문구·프롬프트·테스트케이스를 버전 단위로 관리해야 한다.

핵심 연결은 다음과 같다.

```text
DocumentTemplate
→ TemplateVersion
→ TemplateVariable / TemplateLoop / TemplateCondition
→ StandardPhrase / LegalClause
→ PromptTemplate
→ PromptVersion
→ PromptTestCase
→ PromptRunLog
→ TemplateRelease
→ AdminAuditLog
```

## 13번이 이전 기능에 주는 영향

- 04 이행확인 보고서는 `safety_report` 문서 템플릿과 `safety-report-generation` 프롬프트 버전을 사용한다.
- 05 체크리스트는 `ChecklistTemplate`과 `ChecklistItem` 버전을 사용한다.
- 06 사진대지는 `photo_ledger` 템플릿과 캡션 프롬프트 버전을 사용한다.
- 08 안전관리계획서와 09 안전보건대장은 섹션 템플릿, 위험요인 라이브러리, 표준 문구를 사용한다.
- 10 웹하드와 11 메일함은 파일 분류/메일 초안 프롬프트와 저장 정책을 사용한다.
- 12 결재/서명/제출은 결재선 템플릿, 서명/직인 정책, 제출 체크리스트 템플릿을 사용한다.


## 14 — 대시보드/통계

마지막 기능은 기존 00~13 모듈의 데이터를 수정하지 않고 집계하는 운영 관제 레이어로 정의한다. 오늘의 점검, 제출 예정 보고서, 미조치 지적사항, 조치 지연, 산업안전보건관리비 사용률, 결재 대기, 웹하드/메일 활동, 발주처별 제출 상태를 프로젝트·회차·발주처 기준으로 요약한다.
