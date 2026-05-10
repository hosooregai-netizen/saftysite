# Form & Modal Pattern

## 사용 기능

- headquarters-sites create/edit
- account settings
- report meta form
- webhard share dialog
- mailbox compose helper dialogs
- billing confirm dialogs

## 구조

```text
Modal Header
Form Body
Validation Message
Footer Actions
```

## 원칙

- primary action은 오른쪽
- cancel/close는 왼쪽 또는 보조
- 저장 중 상태 표시
- 저장 실패 시 field-level error + summary error
- Escape로 닫기 가능
- 변경 사항이 있으면 닫기 전 확인
