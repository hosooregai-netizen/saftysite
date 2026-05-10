# Compose Panel Hardening

## 목적

새 메일/답장/전달/임시저장 흐름을 안정화한다.

## Compose modes

| Mode | 초기값 |
|---|---|
| new | empty recipients/body |
| draft | draft values |
| reply | reply subject, thread recipients |
| forward | forward subject/body |

## 요구사항

- 받는 사람 input에서 Enter/Comma로 recipient 확정
- recipient suggestion keyboard navigation
- 첨부 파일 추가/삭제
- 전송 전 수신자와 제목 validation
- 닫기 전 draft 저장 확인
- minimized/maximized 상태 유지

## Validation

```text
수신자 없음 → 보내기 비활성 또는 error
본문/제목 모두 없음 → draft 저장 가능하되 경고
첨부 변환 실패 → 해당 첨부만 error
```

## Draft save

- 자동 저장은 debounce 적용
- 수동 임시저장 버튼 제공
- 저장 성공/실패는 compose toolbar에 표시
