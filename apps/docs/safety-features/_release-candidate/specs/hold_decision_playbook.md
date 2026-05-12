# Hold Decision Playbook

## Hold 조건

아래 중 하나라도 있으면 release hold다.

- S0 blocker 존재
- S1 blocker 존재
- clean build 실패
- workspace/public share security 실패
- billing idempotency 실패
- report export gate 실패
- mailbox state contradiction 재발
- webhard Drive-like visual regression

## Hold 후 절차

```text
1. blocker owner 지정
2. remaining patch sprint 생성
3. focused patch prompt 실행
4. focused QA
5. related regression QA
6. release decision report 업데이트
```

## Hold 문구 예시

```text
이번 RC는 release hold입니다.
주요 원인은 [feature]의 [blocker]이며, release 전 [patch]와 [regression]이 필요합니다.
```
