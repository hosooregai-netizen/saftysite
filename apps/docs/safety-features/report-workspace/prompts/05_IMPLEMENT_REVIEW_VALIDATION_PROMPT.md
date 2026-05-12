# 05_IMPLEMENT_REVIEW_VALIDATION_PROMPT

```text
너는 보고서 검토/검증 UX와 export gate를 구현하는 시니어 프론트엔드/백엔드 엔지니어다.

목표:
AI 초안이 검토 없이 출력되지 않도록 review queue, responsibility confirmation, review-complete 상태를 강화하라.

참조 문서:
- docs/safety-features/report-workspace/specs/review_validation.md
- docs/safety-features/report-workspace/specs/validation.md
- apps/docs/technical-guidance-auto-report/06_step_review_validation.md

대상 코드:
- apps/web/components/ReportWorkspace.tsx
- apps/web/lib/reportApi.ts
- apps/api/app/main.py
- apps/api/app/models.py

요구사항:
1. 필수 메타데이터 누락을 review queue에 표시하라.
2. 필수 사진/위험요인/개선대책 누락을 표시하라.
3. review queue item 클릭 시 해당 섹션으로 이동하게 하라.
4. responsibilityConfirmed=false이면 review-complete를 막아라.
5. 검토 완료 후 report.status와 payload.status를 일관되게 갱신하라.
6. 검토 완료 전 PDF/HWPX export API는 409를 반환해야 한다.
7. local/generated snapshot에서도 검토 상태를 일관되게 표시하라.

완료 기준:
- 미검토 report는 export할 수 없다.
- review queue가 사용자의 수정 작업을 안내한다.
- review-complete 후 export CTA가 활성화된다.
```
