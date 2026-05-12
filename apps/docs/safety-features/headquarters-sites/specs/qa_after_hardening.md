# Headquarters/Sites QA After Hardening

## Build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke

```text
/headquarters
/headquarters?headquarterId={id}
/headquarters?headquarterId={id}&siteId={id}
/sites
/reports/new?headquarterId={id}&siteId={id}
/photo-album?headquarterId={id}&siteId={id}
```

## Functional QA

- guest mode 사업장/현장 생성
- login gate modal
- authenticated 사업장/현장 목록
- 사업장/현장 CRUD
- 검색/필터/정렬/pagination
- assignment 추가/해제
- 보고서 작성 링크
- 사진첩 링크
