# 기능 13 — 관리자/템플릿/프롬프트

이 폴더는 A&C 기술사 ERP의 열세 번째 기능인 `관리자/템플릿/프롬프트` 문서팩이다.

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

관리자/템플릿/프롬프트는 A&C 기술사 ERP에서 사용자, 권한, 회사정보, 문서 템플릿, 체크리스트 템플릿, 표준 문구, 법령/고시 문구, 서비스 AI 프롬프트, Codex 구현 프롬프트, 디자인 프롬프트, Reverse Prompt를 버전 단위로 관리하는 운영 모듈이다.

이 기능은 문서 자동화의 품질 관리 레이어다.

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

## 핵심 설계 포인트

- 문서 템플릿은 `draft → review → published → archived` 상태를 가진다.
- 프롬프트도 문서 템플릿처럼 버전 관리한다.
- 법령/고시/표준 문구는 일반 문구보다 더 엄격한 권한과 감사로그를 가진다.
- 템플릿 변경은 기존 생성 문서를 훼손하면 안 된다.
- 문서 생성 시점에는 templateVersionId와 promptVersionId를 snapshot으로 남긴다.
- 발행 전에는 샘플 데이터 기반 preview와 테스트케이스를 통과해야 한다.
