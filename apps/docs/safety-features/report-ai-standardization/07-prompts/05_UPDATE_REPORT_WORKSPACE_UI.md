# 05_UPDATE_REPORT_WORKSPACE_UI

```text
너는 보고서 작성 UI를 개선하는 프론트엔드 엔지니어다.

목표:
사진 기반 AI가 어떤 필드를 채웠고 무엇을 확인해야 하는지 사용자가 알 수 있게 ReportWorkspace UI를 개선하라.

대상 파일:
- apps/web/components/ReportWorkspace.tsx
- apps/web/components/ReportWorkspace.module.css
- 필요 시 새 component 추가

참조:
- docs/safety-features/report-ai-standardization/05-ui-ux/ai_fill_status_ui.md

요구사항:
1. AI fill status panel을 추가하라.
2. 사진별 observation drawer를 제공하라.
3. 필드별 confidence badge를 표시하라.
4. review queue item에서 해당 사진/필드로 이동할 수 있게 하라.
5. Section 4/5/6의 확인 필요 사유를 명확히 표시하라.

검증:
- 사진을 올린 뒤 어떤 필드가 AI로 채워졌는지 보인다.
- 확인 필요 항목의 이유와 증거 사진이 보인다.
- 사람이 수정한 값은 수동 수정 badge로 바뀐다.
```
