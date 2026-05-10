# 기능 12 — 결재/서명/제출

이 폴더는 A&C 기술사 ERP의 열두 번째 기능인 `결재/서명/제출` 문서팩이다.

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

결재/서명/제출은 A&C ERP에서 문서 초안이 최종 제출본이 되기까지의 내부 통제와 외부 제출 이력을 관리하는 기능이다.

```text
DocumentInstance
→ ApprovalWorkflow
→ ApprovalStep
→ SignatureTask
→ FinalDocumentPackage
→ Submission
→ MailThread / FileAsset / Webhard
```

## 핵심 설계 포인트

- 문서 초안과 최종본을 구분한다.
- 내부 검토, 기술사 확인, 서명/날인, 발주처 제출을 단계별로 관리한다.
- 공사안전보건대장 이행확인 보고서처럼 발주처별 제출이 필요한 문서는 `ownerPartyId` 기준 제출 이력을 분리한다.
- 제출 전 필수 누락정보, 최신 저장본 여부, 최종본 파일, 날인본 파일, 수신자, 첨부파일을 검증한다.
- 제출은 메일함의 MailThread/MailMessage와 웹하드 FileAsset에 연결된다.
- 반려/수정 요청은 문서 버전과 결재 이력에 남긴다.
- 수동 제출과 메일 제출을 모두 지원한다.
