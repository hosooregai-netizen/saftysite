# 00_MASTER_CREATE_QUALITY_DOCS

```text
너는 Next.js + FastAPI 기반 SaaS 프로젝트의 QA 문서와 회귀 테스트 문서를 만드는 시니어 QA 아키텍트다.

목표:
`docs/safety-features/_quality/` 아래에 cross-feature QA, clean build, route smoke, security regression, visual regression, docs coverage, release gate 문서를 생성하라.

반드시 반영할 기능:
- webhard
- mailbox
- report-workspace
- report-list
- headquarters-sites
- photo-album
- account-settings
- billing-credits
- auth-workspace

요구사항:
1. clean build 기준을 명시하라.
2. source readiness watchlist를 포함하라.
3. route smoke 대상 route를 포함하라.
4. workspace access, public share, OAuth, billing security regression을 포함하라.
5. visual regression 기준을 포함하라.
6. docs coverage와 reverse map consistency를 포함하라.
7. release gate 기준을 명확히 하라.
8. 앱 코드는 수정하지 마라.

완료 기준:
- release 전 실행할 QA 기준이 문서화된다.
- 기능별 QA prompt와 공통 QA prompt가 연결된다.
- P0 기능의 release blocking 조건이 명확하다.
```
