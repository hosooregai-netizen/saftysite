# 01_READ_AND_PLAN

```text
너는 기존 app.zip의 정상 작동 기술지도 보고서 AI 기능과 apps.zip의 표준 SaaS 보고서 AI 파이프라인을 비교해 개선 계획을 세우는 시니어 풀스택 엔지니어다.

목표:
사진을 넣었는데도 표준 보고서 항목이 `확인 필요`로 남는 원인을 분석하고, 기능별 구현 순서를 계획하라.

반드시 확인할 파일:
- apps/api/app/services/ai_pipeline.py
- apps/api/app/services/photo_observation_cards.py
- apps/api/app/services/standard_risk_library.py
- apps/api/app/services/standard_report_composer.py
- app/api/ai/doc3-scene-title/route.ts
- app/api/ai/doc7-finding/route.ts
- app/api/ai/doc5-structured-summary/route.ts
- app/api/ai/doc11-education-content/route.ts

산출물:
1. 현재 pipeline 요약
2. app.zip benchmark에서 가져올 요소
3. 현재 gap
4. implementation plan
5. risk/QA plan

제약:
- 아직 코드는 수정하지 마라.
- 먼저 계획만 세워라.
```
