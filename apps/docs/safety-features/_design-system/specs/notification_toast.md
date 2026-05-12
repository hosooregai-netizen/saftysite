# Notification / Toast / Snackbar

## 사용 상황

| 상황 | Pattern |
|---|---|
| 파일 업로드 완료 | snackbar |
| 메일 발송 완료 | snackbar |
| 저장 완료 | subtle status text or snackbar |
| 심각한 오류 | inline error + toast |
| OAuth 실패 | inline status panel |
| 결제 성공 | success page + ledger update |

## 위치

- workspace: bottom-right
- ERP page: top of panel or bottom-right
- modal: modal 내부 error 우선

## 메시지 원칙

- 무엇이 일어났는지
- 다음에 무엇을 할 수 있는지
- undo가 가능한지

예:

```text
3개 파일을 업로드했습니다. [실행 취소]
```
