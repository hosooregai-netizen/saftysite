# Source Recovery Validation

## 1. Import scan

확인해야 할 항목:

- `@/types/mail`
- `@/lib/mail/apiClient`
- `@/features/mailbox/components/MailConnectCallback`
- `@/types/photos`
- `@/features/photos/components/PhotoAlbumPanel`
- `@/lib/safetyApi/adminEndpoints`
- `@/types/backend`
- `@/types/controller`
- `@/types/admin`

## 2. Clean build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 3. Route smoke

- `/mailbox`
- `/mail/connect/google?error=access_denied`
- `/photo-album`
- `/headquarters`
- `/sites`
- `/reports/new`
- `/api/documents/inspection/pdf`
- `/api/documents/inspection/hwpx`

## 4. 주의

이 overlay는 missing source를 복구하는 MVP source layer다. 실제 UI/도메인 완성도는 각 기능별 implementation prompt로 이어서 고도화해야 한다.
