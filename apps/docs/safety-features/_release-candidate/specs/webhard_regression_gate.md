# Webhard Regression Gate

## 목표

웹하드는 이미 Drive-like 방향으로 개선되었으므로, 기능 hardening 중 ERP 카드형으로 회귀하지 않게 한다.

## Visual gate

- 좌측 Drive navigation 유지
- 중앙 file canvas 유지
- optional details panel 유지
- `탐색 카드 + 폴더 카드 + 자료 목록 카드 + 상시 상세 카드` 구조 금지
- 공유 상태/권한/public share root boundary 유지

## QA

- `/webhard`
- `/share/{validToken}`
- `/share/{expiredOrRevokedToken}`
- shared root outside access negative test
