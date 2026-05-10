# Prompt 03: Implement Permission and Share

```text
너는 파일 공유/권한 모델을 구현하는 시니어 백엔드 엔지니어다.

목표:
웹하드의 권한/공유 모델을 `docs/safety-features/webhard/specs/permissions.md` 기준으로 검증하고 보강하라. 폴더 권한 상속, 링크 공유, public token boundary가 가장 중요하다.

반드시 확인할 문서:
- docs/safety-features/webhard/specs/permissions.md
- docs/safety-features/webhard/specs/public_share.md
- docs/safety-features/webhard/specs/api_contract.md
- docs/safety-features/webhard/specs/test_scenarios.md

대상 코드:
- apps/api/app/main.py
- apps/api/app/drive_service.py
- apps/api/app/models.py
- apps/api/app/store.py
- apps/web/features/drive/DriveShareDialog.tsx
- apps/web/features/drive/driveApi.ts
- apps/web/lib/workspaceStorageApi.ts

백엔드 요구사항:
1. 권한 함수가 중앙화되어 있는지 확인하고 없으면 구현하라.
   - can_read_item
   - can_edit_item
   - can_share_item
   - resolve_effective_permission
   - is_descendant_of
   - resolve_share_link_access

2. 폴더 권한 상속을 보장하라.
   - parent/ancestor permission이 child에 적용되어야 한다.
   - inherited permission은 표시 가능하지만 child에서 직접 수정하면 안 된다.

3. permission expiry를 반영하라.
   - expires_at이 과거면 inactive.

4. share link 상태를 반영하라.
   - is_revoked true면 접근 불가.
   - expires_at 과거면 접근 불가.
   - root item deleted/trashed면 접근 불가.

5. public token boundary를 보장하라.
   - shared root와 descendants만 접근 허용.
   - sibling, parent, workspace root 접근 차단.

6. permission/share API는 workspace_id를 반드시 검증하라.

프론트 요구사항:
1. DriveShareDialog에 People with access / General access 구조가 유지되어야 한다.
2. inherited permission은 source item을 표시하고 read-only로 보여야 한다.
3. Restricted / Anyone with link, Viewer / Editor, expiry, revoke가 동작해야 한다.
4. 공유 상태 badge가 실제 share/permission 상태를 반영해야 한다.

보안 요구사항:
- 권한 없는 사용자는 item 존재 여부를 알 수 없도록 404를 우선 사용.
- data_url, text_content, external_url은 권한 검사 후에만 반환.
- 공개 API는 private workspace/user/group metadata를 노출하지 않음.

테스트:
- docs/safety-features/webhard/specs/test_scenarios.md의 share/permission/public share 케이스를 기준으로 수동 또는 자동 테스트를 추가/실행하라.

완료 기준:
- 폴더 A 공유 시 하위 파일만 public link로 탐색 가능.
- 폴더 A 밖 항목 요청은 실패.
- revoked/expired/deleted/trashed share는 실패.
- viewer/editor 권한 차이가 backend에서 적용됨.
```
