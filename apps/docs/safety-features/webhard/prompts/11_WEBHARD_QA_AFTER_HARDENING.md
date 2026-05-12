# 11_WEBHARD_QA_AFTER_HARDENING

```text
너는 웹하드 권한/공유 hardening 이후 QA를 수행하는 QA 엔지니어다.

목표:
Drive-like UI, 권한 모델, 공유 dialog, public share page, 보안 경계를 검증하라.

참조:
- docs/safety-features/webhard/specs/qa_after_permission_hardening.md
- docs/safety-features/webhard/specs/drive_ui_regression_gate.md
- docs/safety-features/_quality/specs/public_share_security.md

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /webhard
- /share/{validToken}
- /share/{expiredToken}
- /share/{revokedToken}

Security:
- shared root 밖 parent_id 접근 차단
- expired/revoked share 차단
- viewer edit/delete/share UI 숨김
- content field 권한 확인

완료 기준:
- build 통과
- route smoke 통과
- public share security 통과
- Drive-like visual non-regression 통과
```
