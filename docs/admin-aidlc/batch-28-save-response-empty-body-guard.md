# Batch 28: Save Response Empty Body Guard

## Why
- 사업장/현장 수정 저장과 기술지도 보고서 저장 후 간헐적으로 `Failed to execute 'json' on 'Response': Unexpected end of JSON input` 오류가 발생했다.
- 원인은 저장 요청이 2xx로 끝났는데도 응답 body가 비어 있거나 중간에 잘린 경우, 클라이언트가 무조건 `response.json()`을 호출하던 구조였다.

## What Changed
- 안전 API 공통 클라이언트와 admin 서버 프록시에서 성공 응답 body를 먼저 텍스트로 읽고, 빈 body면 `undefined`로 안전하게 처리하도록 바꿨다.
- 현장/사업장 수정은 성공 응답 body가 비어 있을 때 각각 `/sites/{id}`, `/headquarters/{id}`를 즉시 재조회하도록 fallback을 추가했다.
- 기술지도 포함 보고서 자동저장과 상태 변경도 성공 응답 body가 비어 있으면 `report_key` 또는 `report_id`로 재조회하도록 보강했다.
- 이 변경으로 저장 직후 JSON 파싱 오류 대신, 저장 결과를 다시 읽어 안정적으로 UI 상태를 갱신한다.

## Proof
- `npx tsc --noEmit --pretty false`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3211 npm run test:client:smoke -- admin-sites admin-reports`

## Notes
- 이번 수정은 저장 contract를 바꾸지 않고, 2xx 빈 응답에 대한 클라이언트 복원력을 높이는 배치다.
