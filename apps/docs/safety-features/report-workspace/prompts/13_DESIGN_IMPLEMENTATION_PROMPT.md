# 13_DESIGN_IMPLEMENTATION_PROMPT: Report Workspace Design Implementation

```text
너는 Guided upload + review workspace 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
보고서 작성자는 준비 상태, 사진 업로드, AI 초안, 검토 queue, export gate를 한 흐름에서 이해해야 한다.

대상 route:
- /reports/new
- /reports/[reportId]

대상 파일:
- apps/web/app/reports/new/page.tsx
- apps/web/components/ReportGuidedUploadChecklist.tsx
- apps/web/components/ReportWorkspace.tsx
- apps/web/components/ReportWorkspaceScreen.tsx
- apps/web/components/ReportExportGatePanel.tsx
- apps/web/components/ReportWorkspace.module.css

반드시 먼저 읽을 문서:
- docs/safety-features/_design-system/specs/README.md
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/report-workspace/specs/ui_ux.md
- docs/safety-features/report-workspace/specs/validation.md
- docs/safety-features/report-workspace/specs/known_issues.md

구현 요구사항:
1. /reports/new에는 기본정보, 전경/공정 사진, 위험요인 사진 준비 checklist를 상단에 둔다.
2. AI 초안 생성 CTA는 필수 사진 조건과 명확히 연결한다.
3. /reports/[reportId]에는 review queue와 export gate 상태를 눈에 띄게 표시한다.
4. 필수 검토 항목이 있으면 PDF/HWPX 버튼은 disabled 상태와 이유를 표시한다.
5. 책임 확인 checkbox와 disclaimer는 export CTA와 가깝게 둔다.

Non-regression:
- 검토 완료 전 export 가능 UI 금지
- local/generated snapshot을 server report처럼 보이게 표시 금지
- 사진 evidence와 finding 검토 상태를 숨기지 말 것

공통 디자인 기준:
1. loading / empty / error / auth-required / permission-denied 상태를 분리하라.
2. primary CTA와 secondary CTA의 위계를 명확히 하라.
3. disabled 상태에는 이유를 보여라.
4. icon-only button에는 aria-label을 추가하라.
5. table/list row는 keyboard focus가 가능해야 한다.
6. modal/dialog는 Escape 닫기 또는 명확한 닫기 버튼을 제공해야 한다.
7. mobile에서는 주요 작업이 사라지지 않게 stack/drawer 구조를 제공하라.
8. 기존 feature의 data flow와 API contract를 변경하지 말고, 필요한 경우 별도 구현 프롬프트로 분리하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Visual QA:
- 대상 route가 지정된 layout pattern으로 보이는지 확인한다.
- empty/error/loading 상태를 각각 확인한다.
- mobile width에서 주요 CTA가 보이는지 확인한다.
- 기능별 non-regression 항목을 확인한다.

완료 기준:
- 대상 route visual QA 통과
- 기능별 non-regression 통과
- build 통과
- 변경된 UI 기준을 specs/ui_ux.md 또는 design_implementation.md에 반영
```
