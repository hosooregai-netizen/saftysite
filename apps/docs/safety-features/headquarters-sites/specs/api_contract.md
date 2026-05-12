# API Contract: Headquarters & Sites

## Safety users

### `GET /api/v1/safety/users`

배정 대상 사용자 목록을 조회한다.

## Headquarters

### `GET /api/v1/safety/headquarters`

사용자의 workspace 기준 사업장 목록을 조회한다.

### `POST /api/v1/safety/headquarters`

사업장을 생성한다.

### `PATCH /api/v1/safety/headquarters/{headquarter_id}`

사업장을 수정한다.

### `DELETE /api/v1/safety/headquarters/{headquarter_id}`

사업장을 비활성화하거나 삭제 처리한다.

## Sites

### `GET /api/v1/safety/sites`

현장 목록을 조회한다.

### `POST /api/v1/safety/sites`

현장을 생성한다.

### `GET /api/v1/safety/sites/{site_id}`

현장 상세를 조회한다.

### `PATCH /api/v1/safety/sites/{site_id}`

현장을 수정한다.

### `DELETE /api/v1/safety/sites/{site_id}`

현장을 비활성화하거나 삭제 처리한다.

## Assignments

### `GET /api/v1/safety/assignments`

현장 배정 목록을 조회한다.

### `POST /api/v1/safety/assignments`

현장 배정을 생성한다.

### `PATCH /api/v1/safety/assignments/{assignment_id}`

현장 배정을 수정한다.

### `DELETE /api/v1/safety/assignments/{assignment_id}`

현장 배정을 비활성화한다.

## Headquarter assignments

### `GET /api/v1/safety/headquarter-assignments`

사업장 배정 목록을 조회한다.

### `POST /api/v1/safety/headquarter-assignments`

사업장 배정을 생성한다.

### `PATCH /api/v1/safety/headquarter-assignments/{assignment_id}`

사업장 배정을 수정한다.

### `DELETE /api/v1/safety/headquarter-assignments/{assignment_id}`

사업장 배정을 비활성화한다.

## My assignments

### `GET /api/v1/safety/assignments/me/sites`

현재 사용자에게 배정된 현장 목록을 조회한다.

### `GET /api/v1/safety/headquarter-assignments/me`

현재 사용자에게 배정된 사업장 목록을 조회한다.

## Admin list

### `GET /api/v1/admin/headquarters/list`

관리자용 사업장 페이지네이션 목록.

Query:

```ts
{
  id?: string;
  limit?: number;
  offset?: number;
  query?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}
```

### `GET /api/v1/admin/sites/list`

관리자용 현장 페이지네이션 목록.

Query:

```ts
{
  id?: string;
  headquarter_id?: string;
  limit?: number;
  offset?: number;
  query?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  assignment?: string;
}
```

### `GET /api/v1/admin/sites/{site_id}`

관리자용 현장 상세.

### `GET /api/v1/admin/users/list`

관리자용 사용자 목록.

### `GET /api/v1/admin/directory/assignments`

기준정보 배정 현황.

## Error 기준

| 상황 | 상태 |
|---|---|
| 인증 없음 | 401 |
| workspace 없음 | 409 |
| 권한 없음 | 403 또는 404 |
| headquarter 없음 | 404 |
| site 없음 | 404 |
| 필수 입력 누락 | 400 |
| 중복 관리번호/사업개시번호 | 409 |
