# 02_IMPLEMENT_VISION_PHOTO_EXTRACTOR

```text
너는 건설현장 사진 기반 기술지도 보고서 AI를 구현하는 백엔드 엔지니어다.

목표:
apps.zip의 표준 AI pipeline에 Vision extraction layer를 추가하라.

대상 파일:
- apps/api/app/services/vision_photo_extractor.py
- apps/api/app/services/photo_observation_cards.py
- apps/api/app/services/ai_pipeline.py

참조:
- docs/safety-features/report-ai-standardization/02-photo-ai/vision_extraction_plan.md
- app/api/ai/doc3-scene-title/route.ts
- app/api/ai/doc7-finding/route.ts

요구사항:
1. 사진을 vision model로 분석해 PhotoObservationCard를 생성하라.
2. visualObjects, workContext, riskContext, aiText를 반환하라.
3. JSON-only response를 강제하라.
4. OpenAI API key가 없으면 기존 keyword fallback을 사용하라.
5. fallback 결과는 needsHumanReview=true로 둬라.
6. 사다리/철근/개구부/고소작업대/전선/작업발판 등 기본 현장 객체를 추출하라.

검증:
- 사다리 사진 → 이동식 사다리/떨어짐/추락 위험 후보
- 철근 사진 → 철근/찔림 또는 개구부/추락 후보
- API key 없음 → fallback + review queue
```
