# ERP Doc7 Content Auto Completion Proof

## Scope
- technical guidance `Doc7` web editor
- mobile step 7 editor
- AI refill path for finding auto-fill

## Verification
- `npx tsc --noEmit --pretty false`
- `node --import tsx --test lib/doc7AutoCompletion.test.ts`

## Expected Behavior
- `재해유형`과 `기인물` 변경 시 참고자료, 관리대책, 관련 법령 자동완성 동기화
- `유해위험요인` 또는 `개선요청사항` 입력 변경 시 자동완성 재실행
- 모바일 step 7과 웹 Doc7이 같은 규칙으로 동작
