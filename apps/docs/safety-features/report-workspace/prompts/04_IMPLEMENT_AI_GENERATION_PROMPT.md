# 04_IMPLEMENT_AI_GENERATION_PROMPT

```text
너는 기술지도 보고서 AI 초안 생성 pipeline을 구현/검증하는 시니어 백엔드 엔지니어다.

목표:
guided photos와 report meta를 기반으로 report draft를 생성하는 pipeline을 현재 문서 기준으로 점검하고 보강하라.

참조 문서:
- docs/safety-features/report-workspace/specs/ai_generation.md
- apps/docs/technical-guidance-auto-report/03_step_photo_observation_card.md
- apps/docs/technical-guidance-auto-report/04_step_risk_library_matching.md
- apps/docs/technical-guidance-auto-report/05_step_section_composer.md
- apps/docs/technical-guidance-auto-report/reference/standard_report_structure.md

대상 코드:
- apps/api/app/services/ai_pipeline.py
- apps/api/app/services/photo_observation_cards.py
- apps/api/app/services/standard_risk_library.py
- apps/api/app/services/standard_report_composer.py
- apps/api/app/main.py
- apps/api/app/models.py
- apps/web/lib/reportApi.ts

요구사항:
1. doc3/doc7 사진 입력을 검증하라.
2. 사진 관찰 카드 생성 결과를 findingCandidates와 photoEvidence로 연결하라.
3. 위험 라이브러리 매칭 결과를 후보로 저장하라.
4. 신뢰도 낮은 항목은 needsReview=true로 표시하라.
5. AI 생성 실패 시 기존 report payload를 손상시키지 마라.
6. AiRun status/error/output을 저장하라.
7. 생성 결과는 reportPayloadSchema를 통과해야 한다.

완료 기준:
- draft-from-guided-photos 호출 시 AiRun과 ReportRecord가 함께 반환된다.
- draft_ready 상태에서 ReportWorkspace가 편집 가능한 초안을 표시한다.
- AI 실패 시 오류 메시지와 기존 데이터 유지가 보장된다.
```
