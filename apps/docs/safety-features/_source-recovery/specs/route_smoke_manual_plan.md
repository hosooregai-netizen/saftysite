# Route Smoke Manual Plan After Source Recovery

## 우선 확인 route

```text
/mailbox
/mail/connect/google?error=access_denied
/photo-album
/headquarters
/sites
/reports/new
/reports
/webhard
/account
```

## 확인 기준

### Mailbox

- 계정 없음/onboarding/계정 연결 상태가 일관되게 표시된다.
- `구글 메일 계정을 연결했습니다.`와 `연결된 메일 계정이 없습니다.`가 동시에 나오지 않는다.
- 새 메일 compose panel이 열릴 수 있다.

### Photo Album

- empty state 또는 grid가 렌더링된다.
- 사업장/현장 filter가 UI를 깨지 않는다.

### Headquarters/Sites

- 기준정보 화면이 import error 없이 렌더링된다.
- 로그인 필요 state가 명확하다.

### Reports New

- 사업장/현장 modal import error 없이 진입한다.

### Webhard

- Drive-like layout이 유지된다.
