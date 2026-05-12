# Release & Hotfix Handoff

## RC 실행 순서

```text
1. _release-candidate/prompts/01_PREPARE_RC_ENVIRONMENT.md
2. _release-candidate/prompts/02_RUN_CLEAN_BUILD_AND_SOURCE_READINESS.md
3. _release-candidate/prompts/03_RUN_ROUTE_SMOKE_MATRIX.md
4. _release-candidate/prompts/04_RUN_SECURITY_GATES.md
5. _release-candidate/prompts/05_RUN_BUSINESS_WORKFLOWS.md
6. _release-candidate/prompts/06_RUN_VISUAL_ACCESSIBILITY_GATES.md
7. _release-candidate/prompts/07_RUN_DOCS_COVERAGE_GATE.md
8. _release-candidate/prompts/08_WRITE_RELEASE_DECISION.md
```

## Hold 발생 시

```text
_blocker-patches/specs/blocker_intake_template.md
_blocker-patches/specs/severity_to_patch_strategy.md
_blocker-patches/prompts/[feature]_BLOCKER_PATCH.md
_blocker-patches/prompts/10_WRITE_BLOCKER_RESOLUTION_REPORT.md
```

## Release 금지 조건

- clean build 실패
- S0/S1 blocker 존재
- workspace/public share security 실패
- billing idempotency 실패
- report export gate 실패
- mailbox state contradiction
- webhard Drive-like visual regression
