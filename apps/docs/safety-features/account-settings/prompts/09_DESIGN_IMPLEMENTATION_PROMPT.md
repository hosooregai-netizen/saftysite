# 09_DESIGN_IMPLEMENTATION_PROMPT: Account Settings Design Implementation

```text
너는 Settings hub 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
설정 화면에서 앱 로그인, Gmail 연결, guest import, billing entry를 명확히 분리한다.

대상 route:
- /account

대상 파일:
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/lib/sessionAuthFlow.ts
- apps/web/lib/guestWorkspaceCache.ts

반드시 먼저 읽을 문서:
- docs/safety-features/_design-system/specs/README.md
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/account-settings/specs/ui_ux.md
- docs/safety-features/account-settings/specs/validation.md
- docs/safety-features/account-settings/specs/known_issues.md

구현 요구사항:
1. Google Workspace 로그인과 Gmail 연결을 별도 section으로 분리한다.
2. session mode를 로그인 완료, 임시 작업공간, 로컬 임시 보관으로 표시한다.
3. guest cache summary는 사업장/현장, 사진첩, 웹하드, 메일 임시보관을 보여준다.
4. 임시 자료 가져오기 버튼은 authenticated workspace에서만 활성화한다.
5. billing package card는 로그인 상태에 따라 checkout 또는 auth-required로 이동한다.

Non-regression:
- Workspace login 성공을 Gmail connected로 표시하지 말 것
- guest import 중복 실행 가능 UI 금지

공통 디자인 기준:
1. loading / empty / error / auth-required / permission-denied 상태를 분리하라.
2. primary CTA와 secondary CTA의 위계를 명확히 하라.
3. disabled 상태에는 이유를 보여라.
4. icon-only button에는 aria-label을 추가하라.
5. table/list row는 keyboard focus가 가능해야 한다.
6. modal/dialog는 Escape 닫기 또는 명확한 닫기 버튼을 제공해야 한다.
7. mobile에서는 주요 작업이 사라지지 않게 stack/drawer 구조를 제공하라.
8. 기존 feature의 data flow와 API contract를 변경하지 말고, 필요한 경우 별도 구현 프롬프트로 분리하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Visual QA:
- 대상 route가 지정된 layout pattern으로 보이는지 확인한다.
- empty/error/loading 상태를 각각 확인한다.
- mobile width에서 주요 CTA가 보이는지 확인한다.
- 기능별 non-regression 항목을 확인한다.

완료 기준:
- 대상 route visual QA 통과
- 기능별 non-regression 통과
- build 통과
- 변경된 UI 기준을 specs/ui_ux.md 또는 design_implementation.md에 반영
```
