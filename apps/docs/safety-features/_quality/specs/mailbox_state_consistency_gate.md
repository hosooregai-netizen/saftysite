# Mailbox State Consistency Gate

## Gate

Release candidate 전 아래 조건을 만족해야 한다.

- [ ] OAuth success와 no-account state가 동시에 표시되지 않는다.
- [ ] connected account가 있으면 connected mailbox shell이 표시된다.
- [ ] inbox 0건은 계정 없음이 아니라 empty inbox로 표시된다.
- [ ] sync error와 reconnect_required가 명확히 표시된다.
- [ ] Workspace login과 Gmail connect 문구가 분리되어 있다.
- [ ] three-pane layout이 유지된다.

## Visual reference

메일함은 좌측 메뉴, 연결 계정, 받은편지함 목록, 상세 영역이 명확히 분리되어야 한다.
