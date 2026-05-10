# Documentation Rules

## 1. specs와 prompts 분리

```text
specs/
→ 사람이 읽는 기능 명세, 데이터 흐름, API, UI/UX, 검증 기준

prompts/
→ Codex/AI 구현 에이전트가 실행할 작업 지시문
```

## 2. 기능별 필수 specs

```text
specs/
├─ README.md
├─ feature.md
├─ user_flows.md
├─ data_flow.md
├─ schema.md
├─ api_contract.md
├─ ui_ux.md
├─ validation.md
├─ reverse_map.md
├─ test_scenarios.md
├─ code_inventory.md
└─ known_issues.md
```

## 3. 변경 시 업데이트 규칙

| 변경 | 업데이트해야 할 문서 |
|---|---|
| Route 변경 | `_registry/route_registry.md`, 기능 `reverse_map.md` |
| API 변경 | 기능 `api_contract.md`, `_registry/api_registry.md` |
| Schema 변경 | 기능 `schema.md`, `_registry/schema_registry.md` |
| UI 변경 | 기능 `ui_ux.md`, `_design-system/specs/*` |
| 구현 프롬프트 추가 | 기능 `prompts/`, `_registry/prompt_registry.md` |
| 큰 결정/위험 | 기능 `known_issues.md`, `_registry/known_issue_registry.md` |

## 4. Do not touch

```text
apps/web/.next
apps/api/.venv
__MACOSX
```

## 5. Clean build 기준

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```
