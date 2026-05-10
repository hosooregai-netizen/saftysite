# Anonymous Claim

## 목적

비로그인 상태에서 생성한 임시 workspace를 Google/일반 로그인 사용자에게 이전한다.

## 흐름

```text
anonymousToken 확보
→ 로그인 완료
→ POST /api/v1/auth/claim-anonymous
→ anonymous user 조회
→ anonymous membership 조회
→ workspace.owner_user_id = authenticated user id
→ authenticated membership 생성 또는 재사용
→ anonymous membership 삭제
→ anonymous token 삭제
```

## 이전 대상

- Workspace owner
- Membership
- Workspace data는 workspace_id가 유지되므로 그대로 보존

## 이후 guest cache import와 차이

| 구분 | 설명 |
|---|---|
| claim-anonymous | 서버에 이미 생성된 anonymous workspace를 사용자에게 이전 |
| guest cache import | 브라우저 local guest cache를 현재 workspace로 복사 |

둘 다 실행될 수 있다.

## 실패 처리

| 실패 | 처리 |
|---|---|
| anonymous token 없음 | 로그인 후 일반 workspace 유지 |
| token이 anonymous가 아님 | 오류 표시 |
| 이전할 workspace 없음 | 오류 표시 또는 import만 진행 |
| 이미 이전됨 | 중복 처리 방지 |
