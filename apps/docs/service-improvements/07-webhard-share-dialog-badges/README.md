# Service Improvement 07: Webhard Share Dialog & Badges UX

## 목적

6단계에서 public share security를 보강한 뒤, 웹하드 내부 UI에서 공유 상태를 더 명확히 보여준다.

## 적용 파일

```text
apps/web/features/drive/DriveShareDialog.tsx
apps/web/features/drive/DriveGrid.tsx
apps/web/features/drive/useDriveItems.ts
```

## 핵심 개선

- 공유 다이얼로그의 영어권 문구를 한국어 업무 UI에 맞게 정리
- `People with access` → `접근 권한`
- `General access` → `일반 접근`
- `Restricted` → `제한됨`
- `Anyone with link` → `링크가 있는 사용자`
- `Viewer` / `Editor` → `보기 전용` / `편집 가능`
- 일반 접근 helper에 현재 링크 상태, 권한, 만료 정보를 표시
- Grid card에서도 table처럼 공유 badge detail을 표시
- 공유 badge에 aria-label 추가
- 링크 공유 상태를 `링크 공유`, `제한 링크`, `사용자 N명`, `공유 중지됨`, `비공개`로 구분

## 적용 순서

```bash
unzip service_improvement_06_webhard_permission_public_share_overlay.zip
unzip service_improvement_07_webhard_share_dialog_badges_overlay.zip

rm -rf apps/web/.next
cd apps/web
npm run build
```
