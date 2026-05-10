# Implementation Sequence

## 안정화 우선순위

1. auth-workspace
2. account-settings
3. headquarters-sites source readiness
4. report-workspace guided upload
5. report-workspace AI/review/export
6. billing-credits ledger/export billing
7. webhard permissions/public share
8. mailbox source readiness
9. mailbox Gmail OAuth/sync
10. mailbox 3-pane UI
11. photo-album source readiness/linking
12. report-list filter/sort

## 이유

- 인증/워크스페이스가 흔들리면 모든 기능 권한이 흔들린다.
- 사업장/현장은 보고서/사진첩/메일 context의 기준 데이터다.
- 보고서 출력은 결제/크레딧과 연결된다.
- 웹하드와 메일함은 별도 workspace shell이므로 UI/보안 회귀 가능성이 높다.
- source readiness가 필요한 기능은 clean build를 먼저 통과해야 한다.
