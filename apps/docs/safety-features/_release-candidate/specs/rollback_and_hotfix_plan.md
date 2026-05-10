# Rollback & Hotfix Plan

## Rollback trigger

- release 후 auth failure
- billing double credit
- public share data leak
- report export failure
- mailbox OAuth callback failure
- build/runtime critical crash

## Rollback 절차

```text
1. release 중지
2. 마지막 stable tag로 rollback
3. affected feature disable 또는 route guard
4. incident note 작성
5. hotfix branch 생성
```

## Hotfix 우선순위

1. 보안/데이터 노출
2. 결제/크레딧
3. 인증/세션
4. 보고서 출력
5. 공개 공유
6. 메일/사진첩/기준정보
