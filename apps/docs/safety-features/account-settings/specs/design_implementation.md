# Design Implementation Spec: Account Settings Design Implementation

## Layout Pattern

```text
Settings hub
```

## Target Routes

- /account

## Design Goal

설정 화면에서 앱 로그인, Gmail 연결, guest import, billing entry를 명확히 분리한다.

## Implementation Requirements

1. Google Workspace 로그인과 Gmail 연결을 별도 section으로 분리한다.
2. session mode를 로그인 완료, 임시 작업공간, 로컬 임시 보관으로 표시한다.
3. guest cache summary는 사업장/현장, 사진첩, 웹하드, 메일 임시보관을 보여준다.
4. 임시 자료 가져오기 버튼은 authenticated workspace에서만 활성화한다.
5. billing package card는 로그인 상태에 따라 checkout 또는 auth-required로 이동한다.

## Non-regression

- Workspace login 성공을 Gmail connected로 표시하지 말 것
- guest import 중복 실행 가능 UI 금지

## Target Files

- apps/web/components/AccountSettingsScreen.tsx
- apps/web/lib/sessionAuthFlow.ts
- apps/web/lib/guestWorkspaceCache.ts

## QA

- clean build
- route smoke
- visual QA
- accessibility check
- feature-specific non-regression check
