# auth-workspace

인증, 세션, 워크스페이스, 익명 세션 전환, Google Workspace 로그인, guest cache import를 관리하는 기반 기능 문서다.

이 기능은 거의 모든 업무 기능의 전제 조건이다.

- 웹하드: workspace 기준 자료와 공유 권한
- 메일함: Workspace 로그인과 Gmail 메일 연결의 분리
- 보고서: report workspace 접근 권한
- 사진첩: guest cache와 authenticated workspace import
- 결제/크레딧: workspace 단위 결제와 ledger

## 문서 구조

```text
auth-workspace/
├─ specs/
│  ├─ feature.md
│  ├─ user_flows.md
│  ├─ data_flow.md
│  ├─ schema.md
│  ├─ api_contract.md
│  ├─ session_modes.md
│  ├─ google_workspace_auth.md
│  ├─ anonymous_claim.md
│  ├─ workspace_access.md
│  ├─ token_storage.md
│  ├─ guest_import.md
│  ├─ ui_ux.md
│  ├─ validation.md
│  ├─ reverse_map.md
│  ├─ test_scenarios.md
│  ├─ code_inventory.md
│  └─ known_issues.md
└─ prompts/
   ├─ 01_READ_AND_PLAN.md
   ├─ 02_SCHEMA_AND_API_PROMPT.md
   ├─ 03_IMPLEMENT_GOOGLE_WORKSPACE_AUTH.md
   ├─ 04_IMPLEMENT_WORKSPACE_ACCESS.md
   ├─ 05_IMPLEMENT_SESSION_AND_GUEST_CLAIM.md
   ├─ 06_IMPLEMENT_GUEST_IMPORT.md
   └─ 07_QA_REGRESSION.md
```

## 핵심 원칙

- Workspace 로그인과 Gmail 메일 연결은 서로 다른 OAuth flow다.
- anonymous/local/authenticated session mode를 명확히 구분한다.
- guest cache import는 로그인 직후 한 번만 안전하게 수행한다.
- token과 OAuth state는 로그에 남기지 않는다.
- 모든 workspace 데이터 API는 workspace access를 검증해야 한다.
