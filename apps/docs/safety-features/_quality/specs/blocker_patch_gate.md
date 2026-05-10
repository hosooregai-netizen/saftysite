# Blocker Patch Gate

## Patch 통과 조건

- blocker root cause가 확인되었다.
- 최소 범위 patch가 적용되었다.
- clean build가 통과했다.
- focused QA가 통과했다.
- related regression이 통과했다.
- 문서/registry가 업데이트되었다.
- release decision report가 업데이트되었다.

## Patch 실패 조건

- 원래 blocker가 재현된다.
- 새로운 S0/S1 blocker가 생긴다.
- 관련 기능 regression이 발생한다.
- 문서가 실제 코드와 다시 불일치한다.
