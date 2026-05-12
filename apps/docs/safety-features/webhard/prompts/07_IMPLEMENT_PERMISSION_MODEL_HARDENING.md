# 07_IMPLEMENT_PERMISSION_MODEL_HARDENING

```text
너는 웹하드 권한 모델을 구현하는 시니어 백엔드 엔지니어다.

목표:
DrivePermission, DriveShare, WorkspaceGroup 기반 권한 모델을 검증하고 보강하라.

참조:
- docs/safety-features/webhard/specs/permission_model_hardening.md
- docs/safety-features/webhard/specs/inheritance_and_effective_permission.md

대상:
- apps/api/app/models.py
- apps/api/app/drive_service.py
- apps/api/app/main.py
- apps/api/app/store.py

요구사항:
1. can_read_item/can_edit_item/can_share_item을 검증하라.
2. resolve_effective_permission을 구현/검증하라.
3. is_descendant_of를 모든 public share API에서 사용하라.
4. workspace 밖 item permission 생성을 차단하라.
5. deleted/trashed item 권한을 일반 목록/public 목록에서 제외하라.

완료 기준:
- 폴더 권한이 하위 파일에 적용된다.
- viewer는 edit/share/delete 권한이 없다.
- workspace 밖 item 권한 부여가 실패한다.
```
