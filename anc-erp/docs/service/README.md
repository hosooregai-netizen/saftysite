# A&C ERP Project-ready Docs Pack

이 폴더는 프로젝트 루트에 그대로 복사해서 쓸 수 있는 A&C 기술사 ERP 문서/프롬프트 패키지다.

## 넣는 위치

```text
repo-root/
├── AGENTS.md
├── Agent.md
├── CODEX_START_HERE.md
├── codex-runbook/
└── docs/
    └── aec-erp/
```

## 시작 순서

1. `AGENTS.md`를 루트에 둔다.
2. `CODEX_START_HERE.md`를 열어 순서를 확인한다.
3. `codex-runbook/COPY_PASTE_SEQUENCE.md`의 순서대로 Codex에 프롬프트를 넣는다.
4. 각 기능은 `PLAN → CONTAINMENT CHECK → IMPLEMENT → DESIGN → REVERSE AUDIT → PATCH` 순서로 진행한다.

## 중요한 구조

기능 폴더는 구현 단위일 뿐, 실제 ERP는 다음 포함 구조를 따른다.

```text
Project → InspectionRound → DocumentInstance
```

계약/견적은 Project 안에 포함되고, 지적사항/조치/사진대지는 InspectionRound와 Document section 안에 포함되며, 결재/서명/제출은 DocumentInstance 안에 포함된다.
