# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web`
- [ ] `npm run build`

## State consistency

- [ ] OAuth 성공 메시지와 “연결된 메일 계정이 없습니다”가 동시에 표시되지 않는다.
- [ ] OAuth 성공 직후 계정 목록이 없으면 pending refresh state가 표시된다.
- [ ] 실제 계정이 없을 때만 계정 연결 CTA가 표시된다.
- [ ] 연결 계정이 있으면 sidebar에 계정이 표시된다.
- [ ] 연결 계정이 있고 메일이 0건이면 thread list empty state가 표시된다.

## API normalization

- [ ] `authorization_url`이 `authorizationUrl`로 정규화된다.
- [ ] `/mail/threads` 응답이 `{ rows, total }`로 처리된다.
- [ ] `/mail/sync` snake_case 응답이 camelCase summary로 처리된다.
- [ ] draft / message attachment field가 camelCase로 처리된다.

## UX

- [ ] “Google로 로그인”과 “Google 메일 연결” 문구가 분리되어 있다.
- [ ] 새 메일 버튼은 연결 계정이 있을 때만 활성화된다.
- [ ] 메일 동기화 실패 시 error banner가 표시된다.
