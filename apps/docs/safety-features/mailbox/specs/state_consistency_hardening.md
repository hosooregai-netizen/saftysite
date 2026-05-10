# Mailbox State Consistency Hardening

## 목적

메일함에서 서로 모순되는 상태 메시지가 동시에 보이지 않도록 account/onboarding/OAuth/sync 상태를 하나의 상태 머신으로 정리한다.

## 현재 문제

대표 문제:

```text
구글 메일 계정을 연결했습니다.
연결된 메일 계정이 없습니다.
```

이 조합은 사용자에게 OAuth는 성공했지만 계정 저장/조회는 실패한 것처럼 보인다.

## 상태 우선순위

메일함 화면은 다음 우선순위로 상태를 결정한다.

```text
1. loading
2. auth required
3. oauth error
4. oauth success but account list stale
5. no connected accounts
6. connected accounts + syncing
7. connected accounts + no threads
8. connected accounts + threads
```

## 상태 정의

| State | 조건 | 화면 |
|---|---|---|
| loading | session/accounts/drafts loading | shell skeleton |
| auth_required | authenticated session 없음 | account onboarding |
| oauth_error | callback error 또는 complete 실패 | error toast + reconnect CTA |
| oauth_success_pending_refresh | oauth success notice가 있고 accounts가 비었음 | 계정 목록 재조회 CTA, 계정 없음 문구 숨김 |
| no_accounts | success notice 없음 + accounts 0 | 계정 연결 onboarding |
| connected_empty | accounts > 0 + threads 0 | 받은편지함 empty state |
| connected_threads | accounts > 0 + threads > 0 | normal 3-pane |

## 금지 상태

아래 조합은 절대 표시하지 않는다.

```text
OAuth success notice + 연결된 메일 계정이 없습니다.
OAuth success notice + 계정 연결 onboarding full card
connected account card + 계정 연결 필요 full card
sync error + success-only badge
```

## 권장 UI 문구

### OAuth success but account list stale

```text
구글 메일 연결을 완료했습니다. 계정 목록을 다시 불러오는 중입니다.
[다시 불러오기]
```

### Connected but empty inbox

```text
표시할 메일이 없습니다.
메일 계정 동기화를 다시 실행하거나 다른 폴더를 확인해 주세요.
[동기화]
```

### No account

```text
메일 사용을 시작하려면 계정 연결이 필요합니다.
구글 메일을 연결하면 받은 메일 확인, 발송, 임시보관함 관리를 이어서 사용할 수 있습니다.
[구글 메일 연결]
```

## 구현 원칙

- account list는 single source of truth다.
- OAuth notice는 transient state다.
- success notice가 있어도 account list가 비어 있으면 즉시 refetch를 시도한다.
- refetch 후에도 accounts가 비면 `연결 확인 필요` 상태로 표시하고 단순 `계정 없음`과 구분한다.
- `userId`/`user_id` legacy mismatch가 남아 있으면 backend issue로 분류한다.
