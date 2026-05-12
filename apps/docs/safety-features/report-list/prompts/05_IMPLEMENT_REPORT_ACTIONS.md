# 05_IMPLEMENT_REPORT_ACTIONS

```text
너는 보고서 목록의 row action과 접근성을 개선하는 시니어 프론트엔드 엔지니어다.

목표:
보고서 row 클릭, 열기 버튼, 새 보고서 작성, keyboard navigation, 향후 action menu를 안정화하라.

참조 문서:
- docs/safety-features/report-list/specs/user_flows.md
- docs/safety-features/report-list/specs/validation.md
- docs/safety-features/report-workspace/specs/user_flows.md

대상 코드:
- apps/web/components/ReportsOverview.tsx

요구사항:
1. row click으로 상세 진입.
2. Enter/Space keyboard로 상세 진입.
3. action button 클릭 시 row click과 충돌하지 않게 stopPropagation 유지.
4. `열기` button은 reportHref로 이동.
5. `새로 작성`은 `/reports/new`로 이동.
6. report가 exported이면 향후 export history action이 들어갈 수 있도록 action area를 구조화.
7. 접근성을 위해 role, tabIndex, aria-label을 점검.
8. empty state의 새 보고서 작성 CTA를 추가.

완료 기준:
- mouse/keyboard 모두로 목록을 사용할 수 있다.
- action click과 row click이 충돌하지 않는다.
```
