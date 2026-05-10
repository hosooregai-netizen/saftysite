# Step 08: account-settings specs/prompts

이번 단계는 `docs/safety-features/account-settings/` 구조를 생성한다.

## 답변

네, 지금까지 만든 구조는 의도한 대로 `specs/`와 `prompts/`를 분리해서 만들고 있다.

- `specs/`는 기능 명세, schema, API, data flow, UI/UX, validation, reverse map을 담는다.
- `prompts/`는 Codex/구현 에이전트에 바로 넣을 수 있는 실행 프롬프트를 담는다.

## 이번 단계 범위

- `/account`
- `/auth/google/callback`
- Google Workspace OAuth
- session state
- workspace membership
- guest workspace import
- billing checkout entry
- account/profile UI

## 생성 구조

```text
docs/safety-features/account-settings/
├─ README.md
├─ STEP08_MANIFEST.md
├─ specs/
└─ prompts/
```

## 다음 단계 추천

Step 09는 `billing-credits`가 좋다. account-settings에서 결제 진입까지 만들었으므로 다음은 checkout, confirm, webhook, credit ledger를 문서화하는 순서가 자연스럽다.
