# A&C ERP Bootstrap Skeleton

초기 기술 스켈레톤만 포함한다.

## 구조

- `client`: Next.js App Router 기반 ERP 셸
- `server`: FastAPI 기반 API 스켈레톤
- `packages/contracts`: 공유 타입/상수
- `packages/api-client`: 공유 API 클라이언트

## 테스트

```bash
cd anc-erp
npm run test:client
npm run test:server
```
