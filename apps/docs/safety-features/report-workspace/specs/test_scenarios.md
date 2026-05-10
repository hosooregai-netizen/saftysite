# Test Scenarios: Report Workspace

## Smoke

- [ ] `/reports/new` 진입
- [ ] `/reports` 진입
- [ ] 존재하는 `/reports/{reportId}` 진입
- [ ] 없는 report id는 error state 표시

## New report

- [ ] 기존 사업장/현장 선택
- [ ] 신규 사업장 생성
- [ ] 신규 현장 생성
- [ ] 메타 입력
- [ ] 사진 업로드
- [ ] 업로드 실패 처리
- [ ] report 생성

## Guided photo

- [ ] step-1 업로드
- [ ] step-2 업로드
- [ ] step-3~5 optional 업로드
- [ ] 대표 사진 선택
- [ ] doc3/doc7 후보 저장

## AI draft

- [ ] guided bucket 불완전 시 실패
- [ ] 유효한 bucket에서 draft 생성
- [ ] AiRun 저장
- [ ] report status draft_ready
- [ ] generated snapshot fallback

## Review

- [ ] section draft 수정
- [ ] finding candidate 수정
- [ ] review queue item 해결
- [ ] responsibility checkbox
- [ ] review complete

## Export

- [ ] review 전 PDF export 409
- [ ] review 전 HWPX export 409
- [ ] review 후 PDF export 성공
- [ ] review 후 HWPX export 성공
- [ ] credit 차감 기록
- [ ] export history 조회

## Security

- [ ] 다른 workspace report 접근 차단
- [ ] 다른 workspace photo id 사용 차단
- [ ] export 권한 없는 사용자 차단
- [ ] local snapshot이 server data를 덮어쓰지 않음
