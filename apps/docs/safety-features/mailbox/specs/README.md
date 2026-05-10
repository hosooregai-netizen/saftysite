# Mailbox Specs

이 폴더는 메일함 기능의 제품/기술/UX 명세를 담는다.

## Files

```text
README.md
feature.md
user_flows.md
data_flow.md
schema.md
api_contract.md
oauth.md
gmail_sync.md
compose.md
provider_extension.md
ui_ux.md
validation.md
reverse_map.md
test_scenarios.md
code_inventory.md
known_issues.md
```

## Writing Rules

1. 기능 구현 변경 시 `feature.md`, `data_flow.md`, `schema.md`, `api_contract.md`, `reverse_map.md`, `test_scenarios.md`를 함께 갱신한다.
2. UI 변경 시 `ui_ux.md`, `validation.md`, `reverse_map.md`를 함께 갱신한다.
3. Google OAuth 또는 Gmail API 관련 변경 시 `oauth.md`, `gmail_sync.md`, `api_contract.md`, `validation.md`를 함께 갱신한다.
4. source file 누락 또는 import 변경은 `code_inventory.md`, `known_issues.md`, `reverse_map.md`에 반영한다.
5. 구현 프롬프트는 `../prompts/`에 저장한다.
