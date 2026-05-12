# 13_HEADQUARTERS_SITES_QA_AFTER_HARDENING

```text
너는 사업장/현장 hardening 이후 QA를 수행하는 QA 엔지니어다.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /headquarters
- /sites
- /reports/new?headquarterId={id}&siteId={id}
- /photo-album?headquarterId={id}&siteId={id}

완료 기준:
- build 통과
- CRUD/assignment/filter/linking QA 통과
- ERP AppShell visual pattern 유지
```
