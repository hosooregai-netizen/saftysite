# 16_PHOTO_ALBUM_QA_AFTER_HARDENING

```text
너는 사진첩 hardening 이후 QA를 수행하는 QA 엔지니어다.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /photo-album
- /photo-album?headquarterId={id}
- /photo-album?headquarterId={id}&siteId={id}

완료 기준:
- build 통과
- route smoke 통과
- guest mode 동작
- authenticated mode error/fallback 동작
- visual regression 없음
```
