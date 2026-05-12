# Step 24 Master Prompt: Webhard Permission & Public Share Hardening

```text
너는 Google Drive/Box/Dropbox 같은 파일 관리 SaaS의 권한/공유 모델을 구현해본 시니어 풀스택 엔지니어다.

목표:
웹하드의 권한, 링크 공유, 폴더 상속, 공개 공유 페이지 보안 경계를 강화하라.

대상 파일:
- apps/web/components/WebhardScreen.tsx
- apps/web/features/drive/*
- apps/web/components/PublicDriveShareScreen.tsx
- apps/web/app/share/[token]/page.tsx
- apps/web/lib/workspaceStorageApi.ts
- apps/web/lib/webhard/*
- apps/api/app/main.py
- apps/api/app/drive_service.py
- apps/api/app/models.py
- apps/api/app/store.py

참조 문서:
- docs/safety-features/webhard/specs/permission_model_hardening.md
- docs/safety-features/webhard/specs/inheritance_and_effective_permission.md
- docs/safety-features/webhard/specs/share_dialog_hardening.md
- docs/safety-features/webhard/specs/public_share_boundary_hardening.md
- docs/safety-features/webhard/specs/public_share_page_hardening.md
- docs/safety-features/webhard/specs/drive_ui_regression_gate.md

요구사항:
1. DrivePermission / DriveShare 모델과 API를 검증/보강한다.
2. 폴더 권한 상속과 effective permission resolver를 구현/검증한다.
3. share dialog를 People with access / General access 구조로 정리한다.
4. restricted / anyone_with_link와 viewer / editor role을 명확히 처리한다.
5. public share token은 shared root와 descendants 밖으로 나가지 못하게 한다.
6. expired / revoked / deleted / trashed share 접근을 차단한다.
7. public share page는 root 기준 breadcrumb만 표시한다.
8. 권한 없는 사용자에게 dataUrl/textContent/externalUrl을 반환하지 않는다.
9. Drive-like UI가 ERP 카드형으로 회귀하지 않게 한다.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /webhard route smoke 통과
- /share/{token} public viewer 동작
- shared root 밖 접근 차단
- expired/revoked share 차단
- 공유 badge와 share dialog 동작
- Drive-like visual non-regression 통과
```
