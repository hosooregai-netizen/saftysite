# 00_MASTER_CREATE_COMBINED_DOCS_PACKAGE

```text
너는 Next.js + FastAPI 기반 SaaS 프로젝트의 문서 릴리즈 패키지를 구성하는 시니어 테크니컬 라이터다.

목표:
Step 01~13에서 생성한 `docs/safety-features/` overlay를 하나의 통합 docs package로 묶고, 적용 순서, 충돌 정책, 롤백 기준, 최종 QA 순서를 문서화하라.

반드시 포함할 폴더:
- _project
- _design-system
- _templates
- _registry
- _quality
- _release
- webhard
- mailbox
- report-workspace
- report-list
- headquarters-sites
- photo-album
- account-settings
- billing-credits
- auth-workspace

요구사항:
1. specs와 prompts 분리 원칙을 유지하라.
2. 기존 `apps/docs/technical-guidance-auto-report/`는 삭제하거나 이동하지 마라.
3. 통합 package manifest를 작성하라.
4. 적용 순서와 충돌 정책을 작성하라.
5. rollback 기준을 작성하라.
6. 최종 QA 실행 순서를 작성하라.
7. 앱 소스 코드는 수정하지 마라.
8. .next, .venv, __MACOSX는 건드리지 마라.

완료 기준:
- 통합 overlay 하나로 docs/safety-features 구조를 적용할 수 있다.
- `_release/`에서 적용/검증/롤백 기준을 확인할 수 있다.
- `_quality/`와 `_registry/`를 통해 최종 검증을 실행할 수 있다.
```
