# Conflict Policy

## 기본 원칙

1. 앱 소스 코드는 수정하지 않는다.
2. docs 외 파일은 건드리지 않는다.
3. 기존 자동작성 문서 `apps/docs/technical-guidance-auto-report/`는 보존한다.
4. 동일 경로 문서가 충돌하면 최신 step의 파일을 우선한다.
5. 기능별 문서가 registry와 충돌하면 registry를 최신 route/API 기준으로 갱신한다.

## 충돌 가능 파일

```text
docs/safety-features/README.md
docs/safety-features/INDEX.md
docs/safety-features/DOCUMENTATION_RULES.md
```

위 파일들은 Step 11 이후 버전을 기준으로 유지한다.

## 기능별 충돌 원칙

- `webhard/`는 Step 02 기준 + registry/quality 연결.
- `mailbox/`는 Step 03 기준 + registry/quality 연결.
- `_design-system/`은 Step 12 기준.
- `_quality/`는 Step 13 기준.
- `_release/`는 Step 14 기준.
