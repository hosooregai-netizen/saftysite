# 03 — 점검회차/일정 관리

이 기능은 A&C 기술사 ERP의 세 번째 누적 기능이다. 프로젝트/현장 원장과 계약/견적 정보를 기준으로 점검회차를 만들고, 회차별 업무·발주처별 보고서 생성·제출 상태를 관리한다.

## 핵심 요약

```text
Project / Contract
→ InspectionSchedule
→ InspectionRound
→ InspectionTask
→ InspectionOwnerReportTask
→ ChecklistSession / SafetyReport / Submission
```

## 샘플 기준

- 프로젝트: 리움미술관 승강기 교체공사
- 점검주기: 3개월 이내 1회
- 총 점검회차: 10회
- 대표 일정: 2026년 1·4·7·10월, 2027년 1·4·7·10월, 2028년 1·2월
- 발주처별 보고서: 삼성문화재단 / 삼성생명공익재단
- 4회차: 1차기성 milestone 연결 가능
- 10회차: 준공금 milestone 연결 가능

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
