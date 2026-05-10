# 기능 04 — 공사안전보건대장 이행확인 보고서 자동화

이 폴더는 A&C 기술사 ERP의 네 번째 기능인 `공사안전보건대장 이행확인 보고서 자동화` 문서팩이다.

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

공사안전보건대장 이행확인 보고서 자동화는 프로젝트 원장, 계약, 점검회차, 발주처, 체크리스트, 지적사항, 조치현황, 사진대지, 산업안전보건관리비, 공사일정 첨부자료를 조합하여 **발주처별 제출용 보고서**를 생성하는 기능이다.

샘플 문서 기준 핵심 구조:

- 문서번호: 제2026-01호
- 점검회차: 제1회
- 점검일: 2026.01.23
- 보고서 분기: 삼성문화재단 / 삼성생명공익재단
- 주요 섹션: 표지, 공사개요, 점검표, 이행여부 확인서, 위험성 감소대책, 추가 유해·위험요인, 산업안전보건관리비, 사진대지, 공사일정 첨부

핵심 연결키는 `inspectionRoundId + ownerPartyId`이다. 같은 회차라도 발주처별 보고서가 따로 생성되어야 한다.
