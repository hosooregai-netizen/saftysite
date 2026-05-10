# 기능 11 — 메일함

이 폴더는 A&C 기술사 ERP의 열한 번째 기능인 `메일함` 문서팩이다.

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

메일함은 A&C 기술사 ERP 안에서 프로젝트별 업무 메일을 관리하고, 발주처별 보고서 제출, 시공사 조치요청, 자료요청, 일정협의, 계약/견적 발송, 첨부파일 웹하드 저장, 제출 이력 연결을 수행하는 3-pane 업무 메일 모듈이다.

```text
MailAccount
→ MailThread
→ MailMessage
→ MailAttachment
→ Project / InspectionRound / DocumentInstance / Finding / Submission
→ Webhard FileAsset
```

## 핵심 설계 포인트

- 메일함은 단순 받은편지함이 아니라 프로젝트 커뮤니케이션 저장소다.
- OAuth 연결 전에는 guest draft mode로 메일 초안 작성과 복사 기능을 제공한다.
- OAuth 연결 후에는 메일 sync/send를 지원한다.
- 메일은 프로젝트, 점검회차, 발주처, 문서, 지적사항, 제출 이력과 연결될 수 있다.
- 메일 첨부파일은 웹하드 폴더에 저장하고 원본 메일과 연결한다.
- 보고서 제출 메일은 Submission을 생성하거나 갱신한다.
- 조치요청 메일은 Finding/CorrectiveAction 상태와 연결한다.
- AI 메일 초안은 발송 전 사용자가 반드시 검토해야 한다.
