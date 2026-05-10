# QA Checklist

## Backend

- [ ] `python -m compileall app`
- [ ] Google OAuth start URL에 `gmail.send` scope 포함
- [ ] OAuth complete 후 실제 Gmail address 저장
- [ ] refresh token encrypted 저장
- [ ] `/api/v1/mail/sync` initial sync 성공
- [ ] `/api/v1/mail/send` Gmail account에서 Gmail API 호출

## Frontend

- [ ] `/mailbox` route smoke
- [ ] 새 메일 작성
- [ ] 받는 사람/제목/본문 입력
- [ ] 발송 성공 후 보낸메일함에 표시
- [ ] Gmail 발송 실패 시 오류 표시

## Negative

- [ ] refresh token 없음 → 재연결 필요 오류
- [ ] to 없음 → 발송 실패
- [ ] Gmail API error → local outbox만 저장하지 않음
- [ ] Google 계정 아닌 provider → 기존 local outbox 동작 유지
