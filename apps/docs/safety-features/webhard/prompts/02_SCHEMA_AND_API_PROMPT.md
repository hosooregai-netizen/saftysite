# Prompt 02: Webhard Schema and API Contract

```text
너는 웹하드 기능의 schema/API 계약을 안정화하는 시니어 백엔드/프론트엔드 엔지니어다.

목표:
문서 `docs/safety-features/webhard/specs/schema.md`와 `api_contract.md`를 기준으로 DriveItem, DriveShare, DrivePermission, WorkspaceGroup의 frontend/backend 계약을 검증하고 필요한 최소 수정을 하라.

반드시 확인할 문서:
- docs/safety-features/webhard/specs/schema.md
- docs/safety-features/webhard/specs/api_contract.md
- docs/safety-features/webhard/specs/permissions.md
- docs/safety-features/webhard/specs/reverse_map.md

대상 코드:
- apps/web/features/drive/types.ts
- apps/web/features/drive/driveApi.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/api/app/models.py
- apps/api/app/main.py
- apps/api/app/drive_service.py
- apps/api/app/store.py

요구사항:
1. Backend snake_case와 frontend camelCase 매핑을 명확히 유지하라.
2. DriveItem fields가 frontend/backend에서 누락 없이 일관되게 매핑되는지 확인하라.
3. DriveShare fields가 visibility, role, expires_at, revoked_at, is_revoked를 포함하는지 확인하라.
4. DrivePermission fields가 principal_type, principal_id, email, role, inherited_from_item_id, expires_at을 포함하는지 확인하라.
5. WorkspaceGroup/WorkspaceGroupMember response가 group permission UI에서 사용할 수 있을 만큼 충분한지 확인하라.
6. Public share item serializer는 private fields를 제한해야 한다.
7. API response shape는 `{ rows: [...] }` 또는 명시된 object shape를 유지하라.
8. 기존 frontend 호출부가 깨지지 않게 backward compatible mapping을 유지하라.

수정 원칙:
- 큰 기능 추가 금지.
- schema/API mismatch만 수정.
- API 이름을 바꿔야 한다면 기존 wrapper를 남겨 호환성을 유지.
- 문서와 코드가 다르면 코드 또는 문서를 함께 업데이트.

검증:
- 타입 체크 또는 `npm run build` 가능 상태 확인.
- `/webhard` 목록 조회가 깨지지 않아야 한다.
- `/share/[token]` public viewer가 깨지지 않아야 한다.

완료 기준:
- schema.md와 실제 타입/모델/API response가 일치한다.
- driveApi mapping이 명확하다.
- public serializer가 private metadata를 과도하게 반환하지 않는다.
```
