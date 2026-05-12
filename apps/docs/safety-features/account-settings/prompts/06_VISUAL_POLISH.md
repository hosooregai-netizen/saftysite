# 06_VISUAL_POLISH

```text
너는 ERP 설정 화면 UI를 정리하는 시니어 프론트엔드 엔지니어다.

목표:
계정/설정 화면을 사용자가 현재 계정, 워크스페이스, 임시 데이터, 결제 상태를 쉽게 이해할 수 있게 개선하라.

참조 문서:
- docs/safety-features/account-settings/specs/ui_ux.md
- docs/safety-features/_design-system/specs/design_principles.md
- docs/safety-features/_design-system/specs/layout_patterns.md

대상 코드:
- apps/web/components/AccountSettingsScreen.tsx

요구사항:
1. ERP AppShell 안의 설정 화면으로 유지하라.
2. Header, account panel, workspace panel, guest import panel, billing panel을 분리하라.
3. Google Workspace 로그인과 Google 메일 연결을 명확히 구분하라.
4. authError/billingError/billingNotice는 alert로 표시하라.
5. session mode badge를 표시하라.
6. mobile에서도 카드가 지나치게 길어지지 않게 하라.

완료 기준:
- 사용자가 현재 로그인/워크스페이스/결제 진입 상태를 한눈에 이해한다.
```
