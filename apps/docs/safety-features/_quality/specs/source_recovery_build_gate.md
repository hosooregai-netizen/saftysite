# Source Recovery Build Gate

Step 17 source overlay 적용 후 Step 18 QA를 통과해야 다음 구현 단계로 넘어간다.

## Gate

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 필수 route smoke

- `/mailbox`
- `/photo-album`
- `/headquarters`
- `/sites`
- `/reports/new`

## Blocking

- missing import
- route build failure
- report export bridge build failure
