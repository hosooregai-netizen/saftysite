# Blocker Patch Workflow

```text
RC QA failure
→ blocker intake
→ severity classification
→ owner assignment
→ patch prompt generation
→ implementation
→ focused QA
→ related regression
→ docs update
→ release decision update
```

## Patch 원칙

- 문제와 직접 관련된 feature files만 수정한다.
- `.next`, `.venv`, `__MACOSX`는 수정하지 않는다.
- S0/S1은 workaround로 release하지 않는다.
- patch 후 clean build와 related regression을 실행한다.
