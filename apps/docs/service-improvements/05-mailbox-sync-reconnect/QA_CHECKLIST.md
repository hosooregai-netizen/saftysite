# QA Checklist

## Route

- [ ] `/mailbox`
- [ ] `/mail/connect/google?error=access_denied`

## Sync states

- [ ] 계정 없음 상태와 동기화 필요 상태가 구분된다.
- [ ] 초기 백필 미완료 계정에서 “초기 Gmail 동기화가 필요합니다.”가 표시된다.
- [ ] 동기화 중에는 “Gmail 메일을 가져오는 중입니다.”가 표시된다.
- [ ] 동기화 완료 후 마지막 동기화 시각이 표시된다.
- [ ] syncError가 있으면 오류 banner가 표시된다.
- [ ] refresh token/invalid_grant 오류는 “구글 메일 재연결” CTA를 표시한다.
- [ ] 지금 동기화 버튼으로 수동 동기화를 실행할 수 있다.

## Non-regression

- [ ] “구글 메일 계정을 연결했습니다”와 “연결된 메일 계정이 없습니다”가 동시에 보이지 않는다.
- [ ] 메일함 three-pane layout이 유지된다.
- [ ] 작성창이 계속 동작한다.
