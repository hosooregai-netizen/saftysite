# Docs Maintenance After Release

## 업데이트 대상

- `_registry/doc_status_registry.md`
- `_registry/known_issue_registry.md`
- `_release/specs/release_notes.md`
- `_quality/specs/release_decision_gate.md`
- 기능별 `known_issues.md`
- 기능별 `test_scenarios.md`
- 기능별 `reverse_map.md`

## 운영 중 문서 업데이트 조건

| 이벤트 | 업데이트 |
|---|---|
| hotfix | release notes, blocker resolution |
| incident | incident report, known issue |
| API 변경 | api_contract, api_registry |
| route 변경 | route_registry, reverse_map |
| schema 변경 | schema.md, schema_registry |
| UI pattern 변경 | design-system, visual QA |
