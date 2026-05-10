# 09_IMPLEMENT_PUBLIC_SHARE_BOUNDARY

```text
너는 public file sharing 보안을 구현하는 시니어 백엔드 엔지니어다.

목표:
공유 token으로 접근 가능한 범위를 shared root와 descendants로 제한하라.

참조:
- docs/safety-features/webhard/specs/public_share_boundary_hardening.md
- docs/safety-features/webhard/specs/storage_security_followup.md

대상:
- apps/api/app/main.py
- apps/api/app/drive_service.py
- apps/api/app/models.py

요구사항:
1. token active/expired/revoked를 검증하라.
2. root deleted/trashed 접근을 차단하라.
3. parent_id가 shared root 밖이면 403/404를 반환하라.
4. item_id가 shared root 밖이면 403/404를 반환하라.
5. public metadata와 content response를 분리하라.
6. 권한 확인 전 dataUrl/textContent/externalUrl을 반환하지 마라.

완료 기준:
- shared root 밖 접근이 차단된다.
- expired/revoked token이 데이터를 반환하지 않는다.
- public viewer는 민감 workspace metadata를 보지 못한다.
```
