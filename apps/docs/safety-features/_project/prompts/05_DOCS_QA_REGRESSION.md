# 05_DOCS_QA_REGRESSION

```text
너는 문서와 코드의 일관성을 검수하는 QA 엔지니어다.

목표:
문서 변경 후 앱 빌드 및 route smoke 기준을 함께 검증할 수 있는 QA 계획을 작성하라. 앱 코드는 수정하지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /reports/new
- /reports
- /headquarters
- /sites
- /photo-album
- /webhard
- /mailbox
- /account
- /billing/checkout
- /auth/google/callback

문서 QA:
- INDEX 기능 목록 확인
- registry route/API/schema/prompt 일관성 확인
- 기능별 reverse_map 확인
- known_issue_registry 확인

완료 기준:
- build readiness issue와 문서 issue를 분리해서 보고한다.
- 문서가 잘못된 경우 수정 제안을 제공한다.
```
