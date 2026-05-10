# Post-Release Operations

`_operations/`는 릴리즈 후 운영을 위한 runbook과 점검 프롬프트를 관리한다.

## 핵심 운영 대상

- 보고서 작성/출력
- 결제/크레딧
- 인증/워크스페이스
- 웹하드 권한/공유
- 메일함 OAuth/sync/send
- 사진첩/사업장/현장 기준정보
- 문서/registry 유지보수

## 구조

```text
_operations/
├─ specs/
├─ prompts/
└─ templates/
```

## 운영 원칙

1. S0/S1 incident는 즉시 release hold 또는 rollback 검토.
2. 결제/보안/인증 이슈는 workaround로 방치하지 않는다.
3. 운영 이슈는 known issue와 docs registry에 반영한다.
4. 반복 이슈는 feature hardening backlog로 전환한다.
