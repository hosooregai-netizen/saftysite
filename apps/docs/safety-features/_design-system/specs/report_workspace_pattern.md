# Report Workspace Pattern

## 사용 기능

- report-workspace

## 구조

```text
Page Header
├─ report status
├─ save status
├─ review/export actions

Progress / Section Navigation
├─ meta
├─ photos
├─ AI draft
├─ review
└─ export

Main Editor
├─ section form
├─ finding candidates
├─ photo evidence
└─ generated text

Review Panel
├─ review queue
├─ validation warnings
└─ responsibility confirmation
```

## 상태

- photo collection
- photo review
- AI generating
- draft ready
- review completed
- exported

## 원칙

- AI 생성 문구는 항상 검토 대상임을 표시한다.
- 검토 완료 전 export CTA는 비활성 또는 차단 사유 표시.
- 저장 상태는 상단에 명확히 표시.
- review queue item은 해당 섹션으로 이동 가능해야 한다.
