# 06_VISUAL_QA_REGRESSION

```text
너는 디자인 시스템 적용 후 시각 회귀 테스트를 수행하는 QA 엔지니어다.

목표:
주요 route의 visual QA를 수행하고 디자인 시스템 문서와 실제 UI가 일치하는지 검증하라.

검증 route:
- /reports/new
- /reports
- /reports/{reportId}
- /headquarters
- /sites
- /photo-album
- /webhard
- /share/{token}
- /mailbox
- /account
- /billing/checkout

검증 기준:
- docs/safety-features/_design-system/specs/visual_qa_checklist.md
- 기능별 specs/ui_ux.md
- 기능별 specs/validation.md

요구사항:
1. desktop 기준 screenshot QA를 수행하라.
2. tablet/mobile layout 위험을 확인하라.
3. empty/error/loading state를 확인하라.
4. focus/keyboard/accessibility를 확인하라.
5. 회귀가 있으면 기능별 known_issues.md에 기록하라.

완료 기준:
- route별 pass/fail table
- P0 visual regression 목록
- 수정 우선순위
```
