# Empty / Error / Loading / Success State Patterns

## Empty

```text
아이콘
제목
설명
Primary CTA
Secondary CTA
```

예:

```text
표시할 메일이 없습니다.
검색 조건을 조정하거나 메일 계정 동기화를 다시 실행해 주세요.
[동기화] [필터 초기화]
```

## Error

- 사용자에게 원인과 다음 행동을 알려준다.
- API detail을 그대로 노출하지 않는다.
- 재시도 버튼을 제공한다.

## Loading

- 전체 화면 loading은 최소화한다.
- 목록은 skeleton row 사용.
- AI 생성/업로드/메일 동기화는 진행 상태를 별도로 표시한다.

## OAuth/Connect

- 연결 전
- 연결 중
- 연결 완료
- 재연결 필요
- 연결 실패
- 계정은 연결됐지만 데이터 sync 실패
