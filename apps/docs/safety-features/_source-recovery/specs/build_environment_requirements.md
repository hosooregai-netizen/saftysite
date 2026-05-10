# Build Environment Requirements

## 목적

Step 17/19 검증은 정적 import scan 기준이다. 최종 판정은 실제 Next.js build 환경에서 해야 한다.

## 필요 조건

- Node.js runtime
- `apps/web` dependencies installed
- `next`, `react`, `react-dom`, `@saftysite/contracts` resolution
- workspace package resolution if monorepo uses local packages
- backend build는 Python dependencies와 별도 검증

## 실행

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## build가 불가능한 경우

다음 사유를 구분한다.

| 사유 | 의미 |
|---|---|
| node_modules 없음 | dependency install 필요 |
| package workspace resolution 실패 | monorepo package 설정 확인 |
| missing import | source recovery 추가 필요 |
| TS type mismatch | type contract hardening 필요 |
| route build error | page/component runtime issue |
| env var error | config fallback 또는 env 문서 확인 |
