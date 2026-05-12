# Severity to Patch Strategy

| Severity | 의미 | Release | Strategy |
|---|---|---|---|
| S0 | 보안/결제/인증/데이터 손상 | Hold | minimal patch + focused security regression |
| S1 | clean build/core flow 실패 | Hold | build/core route patch + route smoke |
| S2 | 주요 UX 실패, workaround 있음 | 조건부 가능 | short patch 또는 conditional release |
| S3 | 사소한 visual/copy | 가능 | visual polish backlog |
| S4 | docs/future improvement | 가능 | docs update |
