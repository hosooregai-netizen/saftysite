# Service Improvement 06: Webhard Permission & Public Share Security

## 목적

웹하드는 이미 Drive-like UI 구조로 개선되었으므로, 이번 단계에서는 권한/공유/공개 링크 보안 경계를 실제 코드 쪽에서 보강한다.

## 적용 파일

```text
apps/api/app/drive_service.py
apps/api/app/main.py
apps/web/lib/workspaceStorageApi.ts
apps/web/features/drive/PublicDriveShareScreen.tsx
```

## 핵심 개선

1. Public share 응답에서 내부 workspace 기준정보 노출을 줄인다.
   - `headquarter_id`, `site_id`를 public payload에서 `null`로 반환한다.
2. Public share API 응답에 `access` metadata를 추가한다.
   - role
   - visibility
   - expires_at
   - revoked state
3. Public children/item endpoint에서 shared root descendant 검사를 명시적으로 유지한다.
4. Public item endpoint에서 folder는 metadata만, file은 content를 반환한다.
5. Public share page 문구를 한국어 중심으로 정리하고 “공유 루트와 하위 항목만 접근 가능”을 명확히 표시한다.

## 적용 순서

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
unzip service_improvement_06_webhard_permission_public_share_overlay.zip

rm -rf apps/web/.next
cd apps/web
npm run build
```

Backend도 확인한다.

```bash
cd apps/api
python -m compileall app
```
