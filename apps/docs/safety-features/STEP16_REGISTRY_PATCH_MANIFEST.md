# Step 16 Manifest: Registry Patch from Verification

## 목적

Step 15에서 실제 최신 코드와 문서를 대조한 결과를 registry, project specs, quality specs에 반영한다.

## 반영 기준

- 입력 코드: `apps(3).zip`
- 실제 frontend route 수: 27
- 실제 FastAPI endpoint 수: 109
- source readiness watchlist missing: 13

## 핵심 패치

1. `/dashboard`, `/pricing` route를 registry에 반영한다.
2. `/api/*` frontend proxy route를 화면 기능 route와 분리한다.
3. FastAPI actual endpoint 109개를 endpoint inventory로 반영한다.
4. mailbox/photo-album/headquarters-sites missing source readiness를 registry에 반영한다.
5. verification 결과를 release/quality 문서와 연결한다.
