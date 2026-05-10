# API Contract: <Feature Name>

## Endpoints

| Method | Path | 설명 | Auth |
|---|---|---|---|
| GET |  | 목록 조회 | Required |
| POST |  | 생성 | Required |

## Request/Response

### GET example

Request:

```http
GET /api/v1/example
```

Response:

```json
{
  "items": []
}
```

## Error handling

| Status | 의미 | UI 처리 |
|---|---|---|
| 400 | 잘못된 요청 | form error |
| 401 | 인증 필요 | login CTA |
| 403 | 권한 없음 | forbidden state |
| 404 | 없음 | not found state |
| 500 | 서버 오류 | retry CTA |
```
