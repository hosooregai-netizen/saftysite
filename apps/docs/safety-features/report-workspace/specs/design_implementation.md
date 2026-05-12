# Design Implementation Spec: Report Workspace Design Implementation

## Layout Pattern

```text
Guided upload + review workspace
```

## Target Routes

- /reports/new
- /reports/[reportId]

## Design Goal

보고서 작성자는 준비 상태, 사진 업로드, AI 초안, 검토 queue, export gate를 한 흐름에서 이해해야 한다.

## Implementation Requirements

1. /reports/new에는 기본정보, 전경/공정 사진, 위험요인 사진 준비 checklist를 상단에 둔다.
2. AI 초안 생성 CTA는 필수 사진 조건과 명확히 연결한다.
3. /reports/[reportId]에는 review queue와 export gate 상태를 눈에 띄게 표시한다.
4. 필수 검토 항목이 있으면 PDF/HWPX 버튼은 disabled 상태와 이유를 표시한다.
5. 책임 확인 checkbox와 disclaimer는 export CTA와 가깝게 둔다.

## Non-regression

- 검토 완료 전 export 가능 UI 금지
- local/generated snapshot을 server report처럼 보이게 표시 금지
- 사진 evidence와 finding 검토 상태를 숨기지 말 것

## Target Files

- apps/web/app/reports/new/page.tsx
- apps/web/components/ReportGuidedUploadChecklist.tsx
- apps/web/components/ReportWorkspace.tsx
- apps/web/components/ReportWorkspaceScreen.tsx
- apps/web/components/ReportExportGatePanel.tsx
- apps/web/components/ReportWorkspace.module.css

## QA

- clean build
- route smoke
- visual QA
- accessibility check
- feature-specific non-regression check
