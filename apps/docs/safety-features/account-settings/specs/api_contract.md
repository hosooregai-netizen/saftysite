# API Contract: Account Settings

## Auth

### `POST /api/v1/auth/signup`

일반 회원가입.

Request:

```ts
{
  name: string;
  email: string;
  password: string;
}
```

Response:

```ts
AuthResponse
```

### `POST /api/v1/auth/login`

일반 로그인.

Request:

```ts
{
  email: string;
  password: string;
}
```

Response:

```ts
AuthResponse
```

### `POST /api/v1/auth/anonymous`

익명 세션 생성.

Response:

```ts
AuthResponse
```

### `POST /api/v1/auth/google/start`

Google Workspace OAuth 시작.

Request:

```ts
{
  redirect_uri: string;
}
```

Response:

```ts
{
  authUrl: string;
  state: string;
}
```

### `POST /api/v1/auth/google/complete`

Google Workspace OAuth 완료.

Request:

```ts
{
  code: string;
  redirect_uri: string;
  state: string;
}
```

Response:

```ts
AuthResponse
```

### `POST /api/v1/auth/claim-anonymous`

anonymous workspace를 authenticated user에게 claim한다.

Request:

```ts
{
  anonymous_token: string;
}
```

Response:

```ts
{
  workspace: Workspace;
  membership: Membership;
}
```

### `GET /api/v1/auth/me`

현재 사용자와 workspace 정보를 조회한다.

Response:

```ts
AuthResponse 또는 CurrentUserResponse
```

## Workspace

### `POST /api/v1/workspaces`

워크스페이스 생성.

### `GET /api/v1/workspaces/me`

현재 워크스페이스 조회.

### `POST /api/v1/workspaces/import-guest-cache`

게스트 캐시 데이터를 현재 워크스페이스로 가져온다.

Request:

```ts
{
  directory?: {
    headquarters: SafetyHeadquarter[];
    sites: SafetySite[];
  };
  mailboxDrafts?: GuestMailboxDraft[];
  photoAlbum?: GuestPhotoAlbumItem[];
  drive?: {
    items: GuestDriveItem[];
    shares: GuestDriveShare[];
  };
}
```

Response:

```ts
GuestWorkspaceImportResponse
```

## Billing entry

### `POST /api/v1/billing/checkout`

checkout 시작. 상세 명세는 `billing-credits`에서 관리한다.

### `GET /api/v1/credits/balance`

credit balance 조회. 상세 명세는 `billing-credits`에서 관리한다.

## Error 기준

| 상황 | 상태 |
|---|---|
| redirect_uri 미허용 | 400 |
| state 누락 또는 만료 | 400/401 |
| Google provider error | 400 |
| anonymous token invalid | 409 또는 404 |
| guest import 중복 | 200 with skipped |
| 인증 필요 | 401 |
| workspace 없음 | 409 |
