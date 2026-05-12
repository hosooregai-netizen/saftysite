# account-settings

계정/설정 기능 문서다.

이 기능은 `/account`에서 로그인/Google Workspace OAuth, 세션 상태, 워크스페이스 정보, 게스트 데이터 가져오기, 결제 진입을 관리한다. 기존 메뉴에서는 `설정`이 `계정 및 기본정보`로 표시되므로, 이 기능은 전체 서비스의 인증·워크스페이스·게스트 캐시·결제 진입 허브 역할을 한다.

## 문서 구조

```text
account-settings/
├─ specs/
│  ├─ feature.md
│  ├─ user_flows.md
│  ├─ data_flow.md
│  ├─ schema.md
│  ├─ api_contract.md
│  ├─ auth_profile.md
│  ├─ google_workspace_auth.md
│  ├─ workspace_membership.md
│  ├─ guest_import.md
│  ├─ billing_entry.md
│  ├─ session_state.md
│  ├─ ui_ux.md
│  ├─ validation.md
│  ├─ reverse_map.md
│  ├─ test_scenarios.md
│  ├─ code_inventory.md
│  └─ known_issues.md
└─ prompts/
   ├─ 01_READ_AND_PLAN.md
   ├─ 02_SCHEMA_AND_API_PROMPT.md
   ├─ 03_IMPLEMENT_AUTH_PROFILE.md
   ├─ 04_IMPLEMENT_WORKSPACE_AND_GUEST_IMPORT.md
   ├─ 05_IMPLEMENT_BILLING_ENTRY.md
   ├─ 06_VISUAL_POLISH.md
   └─ 07_QA_REGRESSION.md
```

## 관리 원칙

- specs는 명세, schema, API, 상태, UX, 검증 기준을 담는다.
- prompts는 Codex/구현 에이전트에게 바로 넣을 수 있는 실행 프롬프트를 담는다.
- 앱 코드는 이 문서 패키지 생성 단계에서 수정하지 않는다.
