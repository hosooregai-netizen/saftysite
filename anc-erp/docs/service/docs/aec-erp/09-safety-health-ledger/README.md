# 기능 09 — 안전보건대장 자동화

이 폴더는 A&C 기술사 ERP의 아홉 번째 기능인 `안전보건대장 자동화` 문서팩이다.

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

## 기능 요약

안전보건대장 자동화는 프로젝트의 유해·위험요인, 위험성 감소대책, 안전관리계획서, 점검회차, 체크리스트, 지적사항, 조치이력, 산업안전보건관리비, 첨부자료를 장기 누적 대장으로 관리하는 기능이다.

이 기능은 **제출 회차별 결과보고서**가 아니라, 프로젝트 전체 기간 동안 유지되는 **기준 대장**이다.

```text
Project
→ SafetyManagementPlan
→ RiskRegister
→ SafetyHealthLedger
→ InspectionRound History
→ Finding / CorrectiveAction History
→ SafetyCostUsage History
→ Attachment / FileAsset
→ LedgerVersion / Export
```

## 기존 기능과의 관계

- 08 안전관리계획서: 공종별 위험요인과 감소대책의 초기 입력원
- 04 이행확인 보고서: 회차별 점검 결과와 제출본의 연결점
- 05 체크리스트: 실제 점검 결과 입력원
- 06 지적/조치/사진대지: 지적사항 및 조치이력 입력원
- 07 산업안전보건관리비: 비용 사용 이력 입력원

## 핵심 설계 포인트

- `SafetyHealthLedger`는 `projectId` 기준으로 생성한다.
- 필요하면 발주처별 보조 section을 둘 수 있지만, 기본은 프로젝트 단위 누적 대장이다.
- 회차별 보고서와 연결되는 항목은 `inspectionRoundId`를 유지한다.
- 같은 위험요인이 여러 회차에서 반복되면 재발/반복 항목으로 표시한다.
- 조치 완료 이력은 확인자, 확인일, 증빙사진을 포함해야 한다.
- export는 최신 저장 snapshot 기준으로 수행한다.
