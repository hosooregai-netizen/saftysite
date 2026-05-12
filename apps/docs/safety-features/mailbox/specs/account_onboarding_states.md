# Account Onboarding States

## 목적

로그인 상태, 메일 provider 상태, 연결 계정 상태를 명확히 분리한다.

## State matrix

| Auth | Provider available | Accounts | UI |
|---|---|---:|---|
| unauthenticated | unknown | 0 | Workspace login 안내 |
| authenticated | false | 0 | provider 설정 필요 안내 |
| authenticated | true | 0 | 구글 메일 연결 CTA |
| authenticated | true | >0 | mailbox shell |
| authenticated | true | stale after oauth | 연결 완료 후 재조회 상태 |

## CTA 기준

- Workspace login CTA는 `/auth/google/callback` 흐름으로 연결한다.
- Gmail connect CTA는 `/mail/connect/google` 흐름으로 연결한다.
- 둘을 같은 버튼/문구로 섞지 않는다.

## 문구

```text
앱 로그인: Google로 로그인
메일 연결: 구글 메일 연결
```

## Known issue watch

- Workspace Google login과 Gmail connect는 서로 다른 OAuth flow다.
- 사용자에게 둘을 같은 의미로 보여주면 안 된다.
