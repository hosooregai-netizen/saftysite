# 01 — 프로젝트/현장 원장 관리

프로젝트/현장 원장 관리는 A&C 기술사 ERP의 첫 번째 기능이며, 모든 하위 모듈의 기준 데이터다.

이 기능에서 정확히 잡아야 하는 핵심 구조는 다음과 같다.

```text
Project
├── Organization
├── ProjectParty
└── Contact
```

## 왜 01번이 중요한가

계약서, 점검회차, 체크리스트, 공사안전보건대장 이행확인 보고서, 사진대지, 산업안전보건관리비, 웹하드, 메일 제출은 모두 프로젝트 원장 데이터를 반복해서 사용한다.

특히 A&C 문서 구조는 단순 프로젝트 1개가 아니라 다음 구조를 가진다.

```text
하나의 현장
→ 복수 발주처
→ 발주처별 공사금액/비율
→ 발주처별 보고서 제출
→ 같은 점검회차의 발주처별 DocumentInstance
```

따라서 발주처를 문자열로 저장하면 안 되고, 반드시 `Organization + ProjectParty`로 관리해야 한다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 핵심 연결

```text
Project
→ Contract
→ InspectionRound
→ ChecklistSession
→ Finding
→ PhotoLedger
→ SafetyReport
→ FileAsset
→ MailThread
→ Submission
```
