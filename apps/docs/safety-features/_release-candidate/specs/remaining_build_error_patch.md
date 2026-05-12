# Remaining Build Error Patch

## 목적

Step 17 source recovery 적용 후 남은 build error를 기능별 patch로 분류한다.

## Error 분류

| Error type | Owner feature | 조치 |
|---|---|---|
| `Cannot find module` | source recovery | 누락 파일 생성 |
| prop mismatch | 해당 component feature | props contract 수정 |
| type mismatch | schema/API owner | type 정의 보강 |
| API payload mismatch | API contract owner | snake/camel 변환 확인 |
| CSS class missing | design-system/source recovery | module CSS 보강 |
| server/client boundary | route owner | `'use client'` 또는 server helper 분리 |

## Patch 산출물

```text
remaining-error-patch/
├─ source overlay
├─ build error report
├─ changed file list
└─ QA checklist
```

## 완료 기준

- clean build 성공
- route smoke에서 Step 17 복구 대상 route가 렌더링됨
- 기능별 known issue가 업데이트됨
