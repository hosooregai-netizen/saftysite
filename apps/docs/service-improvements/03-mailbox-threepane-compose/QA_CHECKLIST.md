# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `npm run build`

## Compose

- [ ] 새 메일 작성창이 열린다.
- [ ] 받는 사람 입력 후 Enter로 chip이 생성된다.
- [ ] 수신자 chip 삭제가 가능하다.
- [ ] 추천 주소 목록이 표시된다.
- [ ] 추천 주소 클릭 시 수신자에 추가된다.
- [ ] 받는 사람 없으면 발송 버튼이 비활성화된다.
- [ ] 제목/본문/첨부가 모두 없으면 발송 버튼이 비활성화된다.
- [ ] 첨부 추가/삭제가 동작한다.
- [ ] 작성창 최소화/최대화/닫기가 동작한다.

## State

- [ ] 계정 없음 state와 OAuth success pending state가 혼동되지 않는다.
- [ ] 연결 계정 있음 + 메일 없음 state가 명확하다.
