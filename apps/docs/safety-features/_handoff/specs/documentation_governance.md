# Documentation Governance

## 문서 owner

| Area | Owner |
|---|---|
| 기능 specs | Feature owner |
| 기능 prompts | Feature owner + AI agent owner |
| registry | Architecture owner |
| design-system | Design owner |
| quality | QA owner |
| release-candidate | QA lead |
| operations | Operations owner |
| blocker patches | QA lead + feature owner |

## 변경 규칙

| 변경 | 문서 업데이트 |
|---|---|
| route 변경 | route registry, feature reverse map |
| API 변경 | api registry, api_contract |
| schema 변경 | schema registry, feature schema |
| UI 변경 | ui_ux, design-system, visual QA |
| security 변경 | quality security regression, known issues |
| prompt 변경 | prompt registry, feature prompts |
