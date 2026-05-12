# Service Improvement 17 Prompt

```text
너는 app.zip의 기존 정상 작동 기술지도 보고서 AI와 apps.zip의 표준 SaaS AI pipeline을 비교해, 사진 기반 표준 보고서 자동 초안을 개선하는 시니어 풀스택 엔지니어다.

목표:
사진을 넣어도 section 4/5/6이 `확인 필요`으로 남는 문제를 개선하라.

반드시 읽을 문서:
- docs/safety-features/report-ai-standardization/README.md
- docs/safety-features/report-ai-standardization/00-current-diagnosis/current_ai_pipeline_analysis.md
- docs/safety-features/report-ai-standardization/00-current-diagnosis/app_zip_benchmark_analysis.md
- docs/safety-features/report-ai-standardization/02-photo-ai/vision_extraction_plan.md
- docs/safety-features/report-ai-standardization/03-risk-library/standard_risk_library_improvement.md
- docs/safety-features/report-ai-standardization/04-report-composer/section_composer_improvement.md
- docs/safety-features/report-ai-standardization/05-ui-ux/ai_fill_status_ui.md

대상:
- apps/api/app/services/ai_pipeline.py
- apps/api/app/services/photo_observation_cards.py
- apps/api/app/services/standard_risk_library.py
- apps/api/app/services/standard_report_composer.py
- apps/web/components/ReportWorkspace.tsx

비교 대상:
- app/api/ai/doc3-scene-title/route.ts
- app/api/ai/doc7-finding/route.ts
- app/api/ai/doc5-structured-summary/route.ts
- app/api/ai/doc11-education-content/route.ts

요구사항:
1. 현재 pipeline을 먼저 요약하라.
2. app.zip에서 가져올 prompt/normalization 패턴을 정리하라.
3. Vision extraction layer를 추가하라.
4. standard risk library를 사다리/철근/개구부 등 기본 위험 객체 중심으로 보강하라.
5. standard report composer가 section 4/5/6을 더 적극적으로 채우게 하라.
6. confidence가 낮으면 빈칸으로 두지 말고 needsReview=true로 표시하라.
7. UI에서 AI fill status와 review reason을 표시하라.
8. billing/auth/export gate는 건드리지 마라.

검증:
- 사다리 hazard 사진 → section 4 지적사항 생성
- 철근/개구부 hazard 사진 → section 4 지적사항 생성
- overview 또는 hazard context → section 5 대책 후보 생성
- hazard context → section 6 교육/지원사항 초안 생성
- build와 backend tests 통과
```
