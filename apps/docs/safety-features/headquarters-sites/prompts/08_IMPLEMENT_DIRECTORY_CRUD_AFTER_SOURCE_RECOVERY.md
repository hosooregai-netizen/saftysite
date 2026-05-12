# 08_IMPLEMENT_DIRECTORY_CRUD_AFTER_SOURCE_RECOVERY

```text
너는 사업장/현장 CRUD를 안정화하는 시니어 풀스택 엔지니어다.

참조 문서:
- docs/safety-features/headquarters-sites/specs/directory_crud_hardening.md
- docs/safety-features/headquarters-sites/specs/modal_form_validation_hardening.md

요구사항:
1. 사업장 create/update/deactivate flow를 안정화하라.
2. 현장 create/update/deactivate flow를 안정화하라.
3. modal form validation을 구현하라.
4. 저장 실패 시 rollback/error state를 제공하라.
5. 목록과 상세 panel이 저장 후 갱신되게 하라.

완료 기준:
- /headquarters에서 사업장/현장 CRUD가 동작한다.
- /sites 목록에 변경 사항이 반영된다.
```
