## Scope

- 작업자 일정/세션/보고서 모델이 기술지도 보고서 서식 4의 최신 필드 구조를 함께 따르도록 정렬한다.
- 작업자 캘린더, 점검 세션 Doc7 입력, 모바일 카드, 보고서 목록, HWPX 생성 스크립트와 스모크 흐름이 같은 필드 매핑을 공유한다.

## Proof

- `npx tsc --noEmit --pretty false`
- `npm run aidlc:audit`
