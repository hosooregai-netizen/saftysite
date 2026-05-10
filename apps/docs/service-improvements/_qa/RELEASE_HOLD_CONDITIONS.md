# Release Hold Conditions

아래 중 하나라도 발생하면 release hold다.

```text
frontend clean build 실패
backend compile 실패
메일함 상태 모순
웹하드 Drive-like layout 회귀
public share root boundary 실패
report export gate 실패
billing idempotency 실패
Workspace auth와 Gmail connect 혼동
guest import 중복
```

## Severity 기준

| Severity | 의미 | Release |
|---|---|---|
| S0 | 보안/결제/인증/데이터 노출 | Hold |
| S1 | clean build 또는 핵심 route 실패 | Hold |
| S2 | 주요 UX 실패, workaround 있음 | 조건부 |
| S3 | minor visual/copy | release 가능 |
| S4 | docs/future improvement | release 가능 |
