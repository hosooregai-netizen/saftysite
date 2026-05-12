# Step 17 Manifest: Missing Source Recovery Implementation

## 목적

Step 15/16에서 확인된 missing source readiness issue를 실제 source overlay로 복구한다.

## 포함 범위

- mailbox source recovery
- photo-album source recovery
- headquarters-sites admin/source recovery
- shared types and API utilities
- document API bridge helpers
- report session mapper root constants/types

## 적용 후 검증

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

이 패키지는 source overlay이며, 실제 프로젝트에 적용한 뒤 clean build로 최종 검증해야 한다.
