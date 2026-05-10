# Safety Features Structure Note

이 폴더는 기존 마크다운 구조입니다. 기능별로 `specs/`와 `prompts/`를 분리합니다.

## 기본 구조

```text
feature-name/
├─ specs/
│  ├─ feature.md
│  ├─ user_flows.md
│  ├─ data_flow.md
│  ├─ schema.md
│  ├─ api_contract.md
│  ├─ ui_ux.md
│  ├─ validation.md
│  ├─ reverse_map.md
│  └─ test_scenarios.md
└─ prompts/
   ├─ 01_READ_AND_PLAN.md
   ├─ 02_SCHEMA_AND_API_PROMPT.md
   └─ ...
```

## 실제 개선 패키지와 연결

실제 적용 순서는 `docs/service-improvements/`에 있습니다.  
예: `mailbox/specs/*`는 메일함 명세이고, `service-improvements/02~05`는 메일함 실제 개선 단계입니다.
