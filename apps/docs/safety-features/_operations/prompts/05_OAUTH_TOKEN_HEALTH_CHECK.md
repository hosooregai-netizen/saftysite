# 05_OAUTH_TOKEN_HEALTH_CHECK

```text
너는 post-release 운영을 담당하는 SRE/QA lead다.

목표:
Workspace auth와 Gmail connect token 상태를 분리해서 점검하라.

참조 문서:
- docs/safety-features/_operations/specs/*
- docs/safety-features/_quality/specs/post_release_operational_gate.md
- docs/safety-features/_registry/operations_registry.md

절대 수정하지 말 것:
- 앱 소스 코드
- .next
- .venv
- __MACOSX

산출물:
1. 점검 결과
2. 이상 징후
3. severity
4. owner
5. follow-up action
6. docs update 필요 여부

완료 기준:
운영자가 다음 action을 바로 수행할 수 있을 정도로 결과가 명확하다.
```
