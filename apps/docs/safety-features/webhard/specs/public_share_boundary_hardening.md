# Public Share Boundary Hardening

## 목표

`/share/[token]`으로 접근한 사용자가 공유된 root item과 그 descendants 밖으로 나가지 못하게 한다.

## Root boundary

```text
Share token
→ root item
→ allowed: root item
→ allowed: descendants of root item
→ blocked: sibling, parent, workspace root, other item
```

## API 기준

```text
GET /api/v1/drive/shares/{token}
GET /api/v1/drive/shares/{token}/items?parent_id=
GET /api/v1/drive/shares/{token}/items/{item_id}
```

## 차단 조건

| 조건 | 응답 |
|---|---|
| token 없음 | 404 |
| expired | 404 또는 expired message |
| revoked | 404 또는 revoked message |
| root deleted/trashed | 404 |
| parent_id outside root | 403 또는 404 |
| item_id outside root | 403 또는 404 |
| child trashed/deleted | 목록 제외 |
| role viewer인데 edit 요청 | 403 |

## 민감 필드 반환 기준

| 필드 | Public viewer |
|---|---|
| name | O |
| kind | O |
| sizeBytes | O |
| contentType | O |
| createdAt/updatedAt | 제한 가능 |
| dataUrl | 권한 확인 후 |
| textContent | 권한 확인 후 |
| externalUrl | 권한 확인 후 |
| internal workspace path | X |
| owner email | 제한 |
| workspace metadata | X |

## 테스트

- valid folder share
- nested folder navigation
- shared root 밖 parent_id 요청
- expired token
- revoked token
- trashed child exclusion
- viewer no edit action
