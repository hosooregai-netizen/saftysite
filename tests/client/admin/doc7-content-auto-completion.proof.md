# Doc7 Content Auto Completion Proof

## Scope
- uploaded `유해위험작업 안전대책` maps into `Doc7` 관리대책
- uploaded `법령 참고자료` maps into `Doc7` 관련 법령
- web and mobile step 7 share the same auto-completion rule

## Verification
- `npx tsc --noEmit --pretty false`
- `node --import tsx --test lib/doc7AutoCompletion.test.ts`

## Expectations
- selecting `재해유형` and `기인물` updates `DOC7 참고자료`, 관리대책, 관련 법령 together
- typing into `유해위험요인` or `개선요청사항` retriggers matching
- manually edited 관리대책 stays intact even when auto-completion reruns
