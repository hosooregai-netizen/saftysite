# API Contract: Auth Workspace

## Auth

### `POST /api/v1/auth/signup`

Request:

```ts
{ email: string; password: string; name: string }
```

Response:

```ts
AuthResponse
```

### `POST /api/v1/auth/login`

Request:

```ts
{ email: string; password: string }
```

Response:

```ts
AuthResponse
```

### `POST /api/v1/auth/anonymous`

익명 사용자와 임시 workspace를 만든다.

Response:

```ts
AuthResponse
```

### `POST /api/v1/auth/google/start`

Request:

```ts
{ redirect_uri: string }
```

Response:

```ts
{
  authorization_url: string;
  redirect_uri: string;
  state: string;
}
```

### `POST /api/v1/auth/google/complete`

Request:

```ts
{
  code: string;
  state: string;
  redirect_uri: string;
}
```

Response:

```ts
AuthResponse
```

### `POST /api/v1/auth/claim-anonymous`

Request:

```ts
{ anonymous_token: string }
```

Response:

```ts
{
  workspace: Workspace;
  membership: Membership;
  creditBalance: number;
}
```

### `GET /api/v1/auth/me`

Response:

```ts
Omit<User, 'password'>
```

## Workspaces

### `POST /api/v1/workspaces`

Request:

```ts
{ name: string }
```

Response:

```ts
{ workspace: Workspace; membership: Membership; creditBalance: number }
```

### `GET /api/v1/workspaces/me`

Response:

```ts
Array<{ workspace: Workspace; membership: Membership; creditBalance: number }>
```

### `POST /api/v1/workspaces/import-guest-cache`

Request:

```ts
ImportGuestWorkspaceCacheRequest
```

Response:

```ts
GuestWorkspaceImportResponse
```

## Error 기준

| 상황 | 상태 |
|---|---|
| 이메일 중복 | 409 |
| 로그인 실패 | 401 |
| Google config 없음 | 409 |
| redirect_uri 불일치 | 409 |
| OAuth state 없음 | 404 |
| anonymous token 없음 | 404 |
| anonymous 상태에서 claim 시도 | 400 |
| workspace 없음 | 404 또는 409 |
