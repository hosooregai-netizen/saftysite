# 11_IMPLEMENT_GUEST_AUTH_MODE_SPLIT

```text
너는 guest mode와 authenticated mode를 분리하는 시니어 프론트엔드 엔지니어다.

참조 문서:
- docs/safety-features/headquarters-sites/specs/guest_auth_mode_hardening.md
- docs/safety-features/auth-workspace/specs/guest_import.md

요구사항:
1. guest mode에서 가능한 action과 제한 action을 구분하라.
2. login required action은 login gate modal을 띄워라.
3. authenticated mode에서는 서버 CRUD/assignment action을 표시하라.
4. guest directory가 보고서 작성과 사진첩 필터에 이어지게 하라.

완료 기준:
- 비로그인/로그인 상태가 UI에서 명확히 구분된다.
```
