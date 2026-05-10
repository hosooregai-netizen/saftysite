# Post-Release Operating Model

## 운영 역할

| 역할 | 책임 |
|---|---|
| Product Owner | release decision, 사용자 영향 판단 |
| Engineering Lead | hotfix/rollback 결정, owner 배정 |
| QA Lead | regression 결과 관리 |
| Support | 사용자 문의 triage |
| Security Owner | workspace/public share/OAuth 보안 |
| Billing Owner | Toss/ledger/reconciliation |
| Docs Owner | docs/registry/known issue 업데이트 |

## 운영 주기

| 주기 | 작업 |
|---|---|
| Daily | health check, route smoke, failed login/OAuth, billing anomalies |
| Weekly | public share audit, ledger reconciliation, docs known issue review |
| Monthly | backup/restore drill, access review, visual regression spot check |
| Release 후 24h | high-risk route and business flow 집중 점검 |

## High-risk 기능

- report export billing
- public webhard share
- Gmail OAuth token
- guest import
- workspace access guard
