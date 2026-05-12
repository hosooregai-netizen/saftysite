# Design System

대한안전산업연구원 업무지원 시스템의 디자인 시스템 문서다.

이 프로젝트는 일반 ERP 화면, 웹하드 Drive-like workspace, 메일함 three-pane workspace, 보고서 작성 workspace, 결제/설정 flow가 공존한다. 따라서 디자인 시스템은 단순 색상표가 아니라 **layout pattern, state pattern, component rule, visual QA**까지 포함한다.

## 구조

```text
_design-system/
├─ specs/
└─ prompts/
```

- `specs/`: 사람이 읽는 디자인 명세
- `prompts/`: Codex/구현 에이전트 실행 프롬프트
