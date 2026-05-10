# 08_IMPLEMENT_SHARE_DIALOG_AND_BADGES

```text
너는 Drive-like 웹하드 공유 UX를 구현하는 시니어 프론트엔드 엔지니어다.

목표:
공유 다이얼로그와 목록 공유 badge를 People with access / General access 구조로 개선하라.

참조:
- docs/safety-features/webhard/specs/share_dialog_hardening.md
- docs/safety-features/webhard/specs/drive_ui_regression_gate.md

대상:
- apps/web/features/drive/*
- apps/web/components/WebhardScreen.tsx
- apps/web/lib/workspaceStorageApi.ts

요구사항:
1. 공유 dialog에 People with access 영역을 만든다.
2. General access에서 restricted/anyone_with_link를 선택할 수 있게 한다.
3. role viewer/editor를 선택할 수 있게 한다.
4. expiresAt 설정을 지원한다.
5. 링크 복사/폐기 액션을 제공한다.
6. 목록 row/grid card에 공유 badge를 표시한다.
7. can_share_item=false이면 read-only dialog를 표시한다.

완료 기준:
- 공유 상태가 목록에서 명확히 보인다.
- 폴더 공유 시 상속 안내가 표시된다.
- 공유 dialog가 Drive-like 구조를 유지한다.
```
