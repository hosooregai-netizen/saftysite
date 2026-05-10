# 기능 05 — 현장점검 체크리스트

이 폴더는 A&C 기술사 ERP의 다섯 번째 기능인 `현장점검 체크리스트` 문서팩이다.

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

현장점검 체크리스트는 점검자가 현장에서 공통/건축·토목/건설기계 항목과 위험성 감소대책, 추가 유해·위험요인을 입력하고, 그 결과를 지적사항·조치현황·사진대지·보고서 자동화로 연결하는 기능이다.

```text
InspectionRound
→ ChecklistSession
→ ChecklistResult
→ FindingCandidate
→ Finding
→ CorrectiveAction
→ PhotoLedger
→ SafetyReport
```

## 핵심 설계 포인트

- 점검 결과는 `양호 / 주의 / 불량 / 해당없음 / 미점검`으로 표준화한다.
- `주의`와 `불량`은 지적사항 후보로 자동 전환할 수 있어야 한다.
- 체크리스트 항목은 보고서 표와 1:1 매핑되어야 한다.
- 모바일 현장 입력과 데스크톱 검토 화면을 모두 지원한다.
- 입력된 결과는 보고서의 점검표, 이행여부 확인서, 위험성 감소대책, 추가 유해·위험요인 섹션으로 전달된다.
