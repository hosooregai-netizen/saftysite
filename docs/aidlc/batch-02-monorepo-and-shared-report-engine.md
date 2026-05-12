# Batch 02. Monorepo And Shared Report Engine

## 요구사항

- `apps/web`, `apps/api`, `packages/*` 구조를 루트 기준으로 고정한다.
- 기존 inspection 문서 정본/렌더링 자산은 `packages/report-engine` 경계로 이동할 수 있어야 한다.

## 계약

- workspace root: `package.json`
- shared engine bridge: `packages/report-engine/src/index.ts`

## 입출력 예시

- 입력: `ReportPayload`
- 출력: `hwpx`, `pdf`, export metadata

## 검증

- web workspace build
- contracts package import

## 잔여 리스크

- 실제 legacy 렌더링 함수는 아직 bridge package로 완전 이동하지 않았다.
