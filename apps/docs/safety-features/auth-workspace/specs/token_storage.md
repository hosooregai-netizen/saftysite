# Token Storage

## Frontend

현재 session token은 브라우저 storage에 저장된다.

관련 키:

```text
saftysite-web-report-session-v2
saftysite-web-google-auth:<state>
saftysite-web-google-mail-connect:pending
```

## Backend

backend는 token → user_id mapping을 유지한다.

## 보안 기준

- token은 로그에 출력하지 않는다.
- OAuth state context에는 최소 정보만 저장한다.
- state context는 callback 후 제거한다.
- mail account refresh token과 app session token은 별도 관리한다.
- localStorage/sessionStorage 사용 시 XSS 방어가 중요하다.

## 개선 후보

- HttpOnly cookie 기반 session
- CSRF token
- OAuth state expiry
- refreshable app session token
- workspace switcher support
