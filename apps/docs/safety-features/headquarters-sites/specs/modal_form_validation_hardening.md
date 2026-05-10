# Modal Form Validation Hardening

## 목표

사업장/현장 생성/수정 modal form의 validation과 상태 표현을 안정화한다.

## 상태

```text
idle
dirty
validating
submitting
saved
failed
```

## 검증

사업장 `name`은 required다. 현장 `headquarter_id`, `site_name`은 required다. 저장 버튼은 invalid일 때 disabled되고, 서버 오류는 form 상단에 표시한다.

## Accessibility

- modal focus trap
- Escape close
- error message와 input aria 연결
- 첫 invalid field로 focus 이동
