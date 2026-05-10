# Source Recovery Follow-up

Step 17 파일은 clean build를 위한 MVP fallback layer다. 실제 업무 품질을 위해서는 다음을 보강해야 한다.

- API response shape 정규화
- form validation
- table/filter/pagination UI
- assignment modal
- guest/auth mode 분리
- linked feature navigation
- error/loading/empty state

검증:

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```
