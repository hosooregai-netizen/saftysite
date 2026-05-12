# Remaining Patch Sprint Plan

## 목적

RC QA에서 발견된 blocker를 짧은 patch sprint로 처리한다.

## Sprint 우선순위

```text
1. S0 security/billing/auth
2. S1 build/core route/happy path
3. S2 UX state contradiction
4. S3 visual polish
5. S4 docs only
```

## Patch sprint 흐름

```text
Blocker intake
→ severity 분류
→ feature owner 지정
→ patch prompt 작성
→ source patch 적용
→ focused QA
→ regression QA
→ release decision update
```

## Patch prompt template

```text
너는 [feature] blocker를 수정하는 시니어 엔지니어다.

문제:
[실패 증상]

증거:
[로그/route/screenshot]

대상 파일:
[...]

요구사항:
1. ...
2. ...

검증:
- focused test
- related regression
- clean build

완료 기준:
- blocker resolved
- no regression
- docs updated
```

## 기능별 우선 patch 후보

| Feature | Patch 후보 |
|---|---|
| mailbox | 상태 모순, OAuth success pending refresh, compose validation |
| webhard | public share root boundary, share dialog state |
| report/billing/auth | export gate, credit idempotency, workspace auth separation |
| photo-album | guest/auth adapter, filter URL state |
| headquarters-sites | assignment scope, CRUD modal validation |
