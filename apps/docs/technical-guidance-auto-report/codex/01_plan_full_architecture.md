# 01. 전체 구조 파악 Plan

```md
/plan

이 저장소에서 사진 기반 표준 기술지도 보고서 자동작성 기능을 구현하려고 한다.

먼저 구현하지 말고 계획만 세워라.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/00_index.md
- docs/technical-guidance-auto-report/01_step_site_schedule_seed.md
- docs/technical-guidance-auto-report/02_step_minimal_photo_upload.md
- docs/technical-guidance-auto-report/03_step_photo_observation_card.md
- docs/technical-guidance-auto-report/04_step_risk_library_matching.md
- docs/technical-guidance-auto-report/05_step_section_composer.md
- docs/technical-guidance-auto-report/06_step_review_validation.md
- docs/technical-guidance-auto-report/07_step_render_export_dispatch.md
- docs/technical-guidance-auto-report/reference/standard_report_structure.md

목표:
- 현장/일정 선택 + 최소 사진 2장으로 표준 기술지도 결과보고서 1~6번 섹션 초안을 생성한다.
- 기존 guided photo flow를 유지하되, 표준보고서 구조에 맞게 확장한다.
- AI는 사진 관찰값을 만들고, 사실정보는 DB가 채우고, 문장은 표준 위험 라이브러리/템플릿이 만든다.

표준보고서 구조:
- 1. 기술지도 대상사업장
- 2. 기술지도 개요
- 3. 이전 기술지도 사항 이행여부
- 4. 현재 공정 내 현존하는 위험성 제거
- 5. 향후 진행공정에 대한 유해·위험 요인 파악 및 대책
- 6. 사업장 지원 사항 등 기타 사항

확인할 기존 코드 후보:
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/services/ai_pipeline.py
- apps/web/lib/reportApi.ts
- apps/web/components/ReportWorkspace.tsx
- apps/web/lib/reportSessionMapper.ts
- apps/web/app/api/documents/inspection/hwpx/route.ts
- apps/web/app/api/documents/inspection/pdf/route.ts

확인할 기존 함수 후보:
- default_photo_step_buckets()
- build_draft_from_guided_photos()
- apply_ai_draft_to_report()
- upload_guided_step_one()
- upload_guided_step_two()
- draft_from_guided_photos()
- buildWorkspaceDraft()
- buildStandardWarnings()
- mapReportPayloadToInspectionSession()

제약:
- 기존 기능을 처음부터 갈아엎지 마라.
- 기존 ReportPayload shape를 가능한 유지해라.
- AI가 현장명, 주소, 공사기간, 공사금액, 담당자, 지도일, 회차, 총회차, 공정률을 생성하지 못하게 해라.
- AI는 먼저 구조화된 PhotoObservationCard를 생성해야 한다.
- 보고서 문장은 표준 위험 라이브러리와 템플릿으로 생성해야 한다.
- local mode가 있으면 계속 동작하게 유지해라.

이번 턴의 완료 기준:
- 코드는 수정하지 않는다.
- 백엔드, 프론트엔드, 타입/스키마, 문서 렌더링, 테스트로 나눈 구현 계획을 작성한다.
- 각 단계별 수정 파일 후보를 작성한다.
- 각 단계별 리스크와 테스트 방법을 작성한다.
```
