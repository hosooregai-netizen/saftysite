# Step 10: auth-workspace specs/prompts

이번 단계는 `docs/safety-features/auth-workspace/` 구조를 생성한다.

## 목적

인증, 세션, 워크스페이스, Google Workspace 로그인, anonymous claim, guest cache import를 specs와 prompts로 분리한다.

## 핵심 범위

- `/account`
- `/auth/google/callback`
- `/api/v1/auth/*`
- `/api/v1/workspaces/*`
- session mode: authenticated / anonymous / local
- Google Workspace login
- anonymous workspace claim
- guest cache import
- workspace access guard

## 생성 구조

```text
docs/safety-features/auth-workspace/
├─ README.md
├─ specs/
└─ prompts/
```

## 핵심 주의점

Workspace Google 로그인과 Gmail 메일 연결은 분리해야 한다.

```text
/auth/google/callback
→ 앱 계정/워크스페이스 로그인

/mail/connect/google
→ Gmail API 메일 계정 연결
```

## 다음 단계 추천

Step 11은 `design-system` 또는 `_registry` 업데이트가 좋다. 지금까지 만든 기능 문서들을 한눈에 찾을 수 있도록 registry/index를 갱신하는 단계가 자연스럽다.
