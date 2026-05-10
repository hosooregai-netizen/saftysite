# Quality & Regression

`_quality/`는 기능별 `specs/`와 `prompts/`를 실제 릴리즈 검증 기준으로 연결하는 공통 QA 문서다.

## 목적

- clean build와 source readiness 검증
- route smoke test 기준 관리
- workspace access, public share, OAuth, billing, report export 보안 회귀 검증
- webhard/mailbox/report 등 주요 화면 visual regression 검증
- docs coverage와 reverse map consistency 검증

## 구조

```text
_quality/
├─ specs/
└─ prompts/
```
