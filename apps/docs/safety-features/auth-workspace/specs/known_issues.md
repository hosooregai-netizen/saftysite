# Known Issues: Auth Workspace

## 1. Google Workspace auth와 Gmail OAuth 혼동 위험

Workspace 로그인은 `/auth/google/callback`, Gmail 연결은 `/mail/connect/google`이다. UI에서 두 연결 상태를 분리해서 표시해야 한다.

## 2. Redirect URI mismatch

`localhost`와 `127.0.0.1`은 서로 다른 redirect URI다. 개발 환경에서 allowlist를 명확히 해야 한다.

## 3. OAuth state expiry 부족 가능성

state가 생성되지만 만료 시간이 강하게 검증되지 않을 수 있다. `created_at` 기반 expiry를 적용하는 것이 좋다.

## 4. Storage 기반 token 보안

프론트 token storage는 XSS에 취약할 수 있다. 운영 단계에서는 HttpOnly cookie나 강화된 token 정책 검토가 필요하다.

## 5. Guest import 중복

guest cache가 여러 번 import되면 중복 데이터가 생길 수 있다. import marker와 idempotency 기준이 필요하다.

## 6. Multi-workspace switcher 미구현 가능성

`GET /workspaces/me`는 여러 workspace를 반환할 수 있지만 UI가 단일 workspace만 전제할 수 있다.
