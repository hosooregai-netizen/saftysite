# 기능 06 — 지적사항/조치현황/사진대지

이 문서팩은 A&C 기술사 ERP의 여섯 번째 기능인 `지적사항/조치현황/사진대지`를 기능 단위로 정리한 패키지다.

## 목적

현장점검 체크리스트의 주의·불량 항목 또는 추가 유해·위험요인을 `Finding`으로 전환하고, 시공사 조치현황과 지적 전/조치 후 사진을 매칭하여 공사안전보건대장 이행확인 보고서의 `photo_ledger` 섹션으로 반영한다.

## 핵심 데이터 흐름

```text
ChecklistResult
→ FindingCandidate
→ Finding
→ CorrectiveAction
→ EvidencePhoto
→ PhotoLedgerEntry
→ PhotoLedger
→ SafetyReport.photo_ledger
```

## 포함 파일

```text
06-finding-action-photo-ledger/
├── README.md
├── FILE_TREE.txt
├── MANIFEST.json
├── markdown/
│   ├── 01_PRODUCT_MARKDOWN.md
│   ├── 02_TECH_MARKDOWN.md
│   ├── 05_DESIGN_MARKDOWN.md
│   └── 07_REVERSE_MAP.md
└── prompts/
    ├── 03_SERVICE_AI_PROMPT.md
    ├── 04_CODEX_IMPLEMENTATION_PROMPT.md
    ├── 06_DESIGN_PROMPT.md
    └── 08_REVERSE_PROMPT.md
```

## 이번 기능의 핵심 설계 포인트

- `Finding`은 반드시 `projectId`, `inspectionRoundId`를 가진다.
- 발주처별 사진대지가 다를 수 있으므로 `ownerPartyId`를 지원한다.
- 지적사진과 조치사진은 매칭되어야 하며 대표사진을 지정할 수 있어야 한다.
- 조치 완료는 시공사 제출만으로 끝나지 않고 기술사 또는 담당자 확인이 필요하다.
- 원본 사진은 수정하지 않고 `markupInfo` overlay metadata로 노란 점선 타원형 등 마크업을 저장한다.
- 사진대지 export 전 지적사진 누락, 조치사진 누락, 캡션 누락, 미확인 조치, 발주처 불일치를 검증한다.
