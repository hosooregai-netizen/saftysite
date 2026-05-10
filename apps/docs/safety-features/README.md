# Safety Features Documentation

이 문서 트리는 프로젝트의 기능 명세와 구현 프롬프트를 분리해서 관리한다.

```text
docs/safety-features/
├─ _project/
│  ├─ specs/
│  └─ prompts/
├─ _design-system/
├─ _templates/
├─ _registry/
└─ 기능명/
   ├─ specs/
   └─ prompts/
```

## 핵심 규칙

- `specs/`는 기능 명세, 사용자 흐름, 데이터 흐름, schema, API 계약, UI/UX, validation, reverse map을 담는다.
- `prompts/`는 Codex 또는 구현 에이전트에 바로 넣을 수 있는 실행 프롬프트를 담는다.
- 기능을 수정하면 해당 기능의 `specs/`, `prompts/`, `_registry/`를 함께 업데이트한다.
- 기능 간 연결은 `_registry/`와 `_project/specs/reverse_guide.md`에서 추적한다.

## 현재 단계

| Step | Feature | Docs |
|---:|---|---|
| 01 | Foundation | `_project`, `_design-system`, `_templates`, `_registry` |
| 02 | Webhard | `webhard/` |
| 03 | Mailbox | `mailbox/` |
| 04 | Report Workspace | `report-workspace/` |
| 05 | Report List | `report-list/` |
| 06 | Headquarters Sites | `headquarters-sites/` |
| 07 | Photo Album | `photo-album/` |
| 08 | Account Settings | `account-settings/` |
| 09 | Billing Credits | `billing-credits/` |
| 10 | Auth Workspace | `auth-workspace/` |
| 11 | Registry Index | `_registry`, `_project/specs` |
