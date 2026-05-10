# Feature Blocker Patch Prompt Template

```text
너는 [FEATURE] blocker를 수정하는 시니어 엔지니어다.

Blocker:
- ID:
- Severity:
- Release impact:
- Failing gate:
- Evidence:

목표:
[무엇을 고칠지 한 문장]

대상 파일:
- ...

절대 수정하지 말 것:
- .next
- .venv
- __MACOSX
- 관련 없는 기능

요구사항:
1. ...
2. ...
3. ...

검증:
- focused QA:
- related regression:
- clean build:

완료 기준:
- blocker resolved
- no regression
- docs updated
```
