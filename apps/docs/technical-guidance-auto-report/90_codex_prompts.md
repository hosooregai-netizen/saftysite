# Codex 적용 프롬프트 모음

이 문서는 현재 프로젝트에 “사진 기반 표준 기술지도 보고서 자동작성”을 적용하기 위한 Codex 프롬프트다.

## Codex에 줄 때의 기본 규칙

각 프롬프트는 다음 4가지를 반드시 포함한다.

1. Goal: 무엇을 만들지
2. Context: 어떤 파일/구조를 봐야 하는지
3. Constraints: 지켜야 할 설계 원칙
4. Done when: 완료 조건과 검증 방법

---

# 0. 먼저 계획만 세우게 하는 프롬프트

```md
이 저장소에서 사진 기반 표준 기술지도 보고서 자동작성 기능을 구현하려고 한다.

Goal:
- 현장/일정 선택 + 최소 사진 2장으로 표준 기술지도 결과보고서 1~6번 섹션 초안을 생성한다.
- 기존 guided photo flow를 유지하되, AI 결과를 표준보고서 구조에 맞게 개선한다.

Context:
- Backend: apps/api/app/main.py
- Backend models: apps/api/app/models.py
- AI pipeline: apps/api/app/services/ai_pipeline.py
- Frontend API: apps/web/lib/reportApi.ts
- Workspace UI: apps/web/components/ReportWorkspace.tsx
- Document mapping: apps/web/lib/reportSessionMapper.ts
- Existing document routes: apps/web/app/api/documents/inspection/hwpx/route.ts, apps/web/app/api/documents/inspection/pdf/route.ts

Current behavior to inspect:
- default_photo_step_buckets()
- build_draft_from_guided_photos()
- apply_ai_draft_to_report()
- upload_guided_step_one()
- upload_guided_step_two()
- draft_from_guided_photos()
- buildWorkspaceDraft()
- buildStandardWarnings()
- mapReportPayloadToInspectionSession()

Constraints:
- Do not rewrite the app from scratch.
- Preserve the existing ReportPayload shape where possible.
- Do not let AI generate factual fields such as site name, address, construction period, construction amount, manager, visit date, visit count, total visit count.
- AI should first create structured photo observation cards; standard report sentences should come from rules/templates.
- Minimum required photos should become 1 overview/process photo + 1 hazard photo.
- Add optional buckets for previous guidance check and education/support only if it does not break current UI.
- Keep local mode working.

Task:
- Read the relevant files.
- Produce an implementation plan with concrete file changes.
- Identify any missing contract/type package or schema file that must be updated.
- Do not edit files yet. Plan only.

Done when:
- You return a step-by-step plan grouped by backend, frontend, schema, tests, and migration risks.
```

---

# 1. 현장/일정 Seed와 필드 출처 추가 프롬프트

```md
Implement Step 1: site/schedule seed and field provenance for the standard technical guidance report.

Goal:
- Keep using the existing create report flow, but add field provenance so every auto-filled field knows whether it came from DATA, USER_INPUT, AI_PHOTO, RISK_LIBRARY, or RULE.
- Factual fields must be filled only from DB/user input, never from AI.

Context files:
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/services/ai_pipeline.py
- apps/web/lib/reportApi.ts
- apps/web/components/ReportWorkspace.tsx
- Search the repo for reportPayloadSchema and ReportPayload definitions, because the contract package may be outside apps/web.

Required backend changes:
1. Add a provenance structure to report payload:
   - fieldPath
   - source: DATA | USER_INPUT | AI_PHOTO | RISK_LIBRARY | RULE
   - sourceId optional
   - confidence optional
   - needsReview boolean
   - note optional
2. In create_report(), when build_report_meta_seed() fills reportMeta, also create provenance entries for those fields.
3. Add missing factual fields to reviewMeta.reviewQueue when empty.
4. Preserve existing API responses.

Required frontend changes:
1. If ReportPayload schema must be extended, update it safely with defaults.
2. In ReportWorkspace, optionally show small source labels later, but do not redesign the UI in this task.
3. Keep autosave and local mode working.

Constraints:
- Do not invent project facts.
- Do not remove existing fields.
- Do not break export/HWPX/PDF mapping.

Done when:
- Creating a report still works.
- report.payload.fieldProvenance or report.payload.aiMeta.fieldProvenance exists with DATA provenance for reportMeta fields.
- Missing required fields are listed in reviewQueue.
- Type checks/tests pass or you document why a check cannot run.
```

---

# 2. 최소 사진 Bucket 구조 변경 프롬프트

```md
Implement Step 2: minimal guided photo upload buckets.

Goal:
- Change the guided photo flow so a report draft can be generated from minimum 2 photos:
  1) one overview/process photo
  2) one current hazard photo
- Add optional buckets for previous guidance check and education/support when feasible.

Context files:
- apps/api/app/main.py
- apps/api/app/models.py
- apps/web/lib/reportApi.ts
- apps/web/components/GuidedImageDropzone.tsx
- apps/web/components/GuidedImageSlot.tsx
- apps/web/components/ReportWorkspace.tsx
- Search for photoStepBuckets, photoChecklistStatus, step1_overview, step2_hazard.

Backend requirements:
1. Update default_photo_step_buckets():
   - step1_overview minRequired 1, recommendedCount 1
   - step2_hazard minRequired 1, recommendedCount 1
   - add step3_followup minRequired 0, recommendedCount 0 or 1
   - add step4_support minRequired 0, recommendedCount 0 or 1
2. Update sync_guided_photo_state() so minimumSatisfied = step1_overview complete AND step2_hazard complete.
3. Keep existing step-1 and step-2 upload endpoints working.
4. Add endpoints for optional step-3 and step-4 only if it is simple and consistent:
   - POST /api/v1/reports/{report_id}/photo-steps/step-3
   - POST /api/v1/reports/{report_id}/photo-steps/step-4
   Otherwise leave a clear TODO and make the existing flow not depend on them.

Frontend requirements:
1. Ensure local mode uses the same minRequired logic.
2. Update any copy that says many photos are required.
3. The generate draft button should be enabled when step1 and step2 each have at least 1 photo.

Constraints:
- Do not require optional photos.
- Do not break existing reports that only have step1/step2 buckets.
- Add backward-compatible defaults for old payloads.

Done when:
- A new report can proceed to AI draft generation with 1 step1 photo and 1 step2 photo.
- Existing reports with old bucket structure still parse.
- Local and authenticated sessions behave consistently.
```

---

# 3. Photo Observation Card 도입 프롬프트

```md
Implement Step 3: Photo Observation Cards in the AI pipeline.

Goal:
- Refactor the AI pipeline so photos first become structured observation cards.
- Do not generate final report sentences directly from image analysis.

Context files:
- apps/api/app/services/ai_pipeline.py
- apps/api/app/models.py
- apps/api/app/main.py
- apps/web/lib/reportApi.ts
- Existing response fields: photoEvidence, findingCandidates, sectionDrafts, validationResult.

Required backend changes:
1. Create a new module:
   apps/api/app/services/photo_observation.py
2. Add functions:
   - build_photo_observation_cards(report_id, overview_photos, hazard_photos, followup_photos=None, support_photos=None) -> list[dict]
   - convert_observations_to_photo_evidence(observations, source_photos) -> list[dict]
3. Observation card fields:
   - id
   - reportId
   - photoAssetId
   - photoRole
   - observedProcess
   - observedRisk
   - previousGuidanceCheck
   - supportObservation
   - rawAiNotes
   - needsHumanReview
   - createdAt
4. For now, if there is no real vision model integration, implement a deterministic fallback based on sourceStep/category/location_hint/filename and keep the interface ready for a real model.
5. Update build_draft_from_guided_photos() to call this module before creating findingCandidates.

Constraints:
- AI/vision should not create siteName, address, construction period, construction amount, manager, visit date, visit count, total visit count, or progressRate.
- Uncertain values must become '확인 필요' and needsHumanReview true.
- Preserve existing return shape so frontend does not break.

Done when:
- build_draft_from_guided_photos() returns photoEvidence derived from observation cards.
- ai_run.payload contains photoObservations for debugging/provenance.
- Existing draft generation endpoint still works.
- Tests or at least a simple script/manual call verifies two-photo input produces a draft.
```

---

# 4. 표준 위험 라이브러리 추가 프롬프트

```md
Implement Step 4: standard risk library matching.

Goal:
- Add a standard risk library so AI photo observations are converted into consistent technical guidance report text.
- findingCandidates and future process plans should use library text where possible.

Context files:
- apps/api/app/services/ai_pipeline.py
- apps/api/app/services/photo_observation.py if already created
- apps/api/app/models.py
- apps/web/components/ReportWorkspace.tsx fields for findingCandidates and doc8.

Required backend changes:
1. Create:
   apps/api/app/services/standard_risk_library.py
2. Define an in-code initial risk library with at least these rules:
   - OPENING_FALL_COVER: 개구부/단부 추락
   - STAIR_GUARDRAIL_FALL: 계단/계단참 안전난간 미설치
   - SCAFFOLD_GUARDRAIL_FALL: 비계/작업발판 추락
   - EXCAVATOR_COLLISION_PREVENTION: 굴착기 충돌
   - CRANE_LIFTING_DROP: 인양작업 낙하/충돌
   - ELECTRIC_SHOCK_TEMP_WIRING: 임시전기 감전
   - FIRE_HOT_WORK: 용접/용단 화재
   - TRENCH_COLLAPSE: 굴착부/사면 붕괴
3. Add functions:
   - match_observation_to_risk_rule(observation) -> dict
   - match_observations_to_risk_library(observations) -> list[dict]
4. Match by process, accidentType, causativeAgent, and keywords in hazardSummary/locationText.
5. If no rule score is good enough, return a review-required fallback.

Constraints:
- Do not use freeform final guidance text when a matching rule exists.
- Keep riskLevel in 상/중/하 only.
- Keep accidentType in a controlled Korean list.
- Keep output compatible with existing findingCandidates/doc8.

Done when:
- A hazard observation for 굴착기 maps to EXCAVATOR_COLLISION_PREVENTION.
- A hazard observation for 계단/난간 maps to STAIR_GUARDRAIL_FALL.
- build_draft_from_guided_photos() uses standardGuidanceText for improvementPlan.
- Future process plans use standardCountermeasureText.
```

---

# 5. 표준보고서 Section Composer 구현 프롬프트

```md
Implement Step 5: standard report section composer.

Goal:
- Compose the standard technical guidance report sections from reportMeta, photoObservations, riskMatches, and optional previous/support photos.
- Preserve the existing ReportPayload structure used by ReportWorkspace and reportSessionMapper.

Context files:
- apps/api/app/services/ai_pipeline.py
- apps/api/app/services/photo_observation.py
- apps/api/app/services/standard_risk_library.py
- apps/api/app/main.py
- apps/web/lib/reportSessionMapper.ts
- apps/web/components/ReportWorkspace.tsx

Required backend changes:
1. Create:
   apps/api/app/services/standard_report_composer.py
2. Add function:
   compose_standard_report_draft(report_id, report_meta, observations, risk_matches, previous_findings=None) -> dict
3. Return the same top-level keys currently returned by build_draft_from_guided_photos():
   - photoEvidence
   - findingCandidates
   - sectionDrafts
   - validationResult
4. Also include optional/internal keys if useful:
   - photoObservations
   - riskLibraryMatches
   - fieldProvenance
5. Compose sections:
   - doc5 summary from current process/risk trend
   - findingCandidates for standard report section 4
   - doc8 for standard report section 5
   - doc11/doc12/doc14 for standard report section 6
   - documentsCompat.document4FollowUps for standard report section 3 if data exists
6. Update ai_pipeline.py to delegate to this composer.

Constraints:
- Do not overwrite reportMeta factual data with AI-generated data.
- At least one findingCandidate should be generated from the hazard photo when possible.
- If no good observation exists, create a review-required placeholder instead of hallucinating.
- Keep the frontend working without UI changes.

Done when:
- draft-from-guided-photos returns sectionDrafts that populate section 4, 5, 6 in ReportWorkspace.
- findingCandidates link to evidence photo IDs.
- reportSessionMapper can still map the payload to HWPX/PDF session.
- Validation warnings make sense.
```

---

# 6. Review Queue와 검증 엔진 구현 프롬프트

```md
Implement Step 6: review queue and validation engine.

Goal:
- Build a dynamic review queue so users only confirm missing or uncertain fields.
- Validation should separate blocking issues from warnings.

Context files:
- apps/api/app/main.py
- apps/api/app/services/standard_report_composer.py
- apps/web/components/ReportWorkspace.tsx
- apps/web/lib/reportApi.ts

Required backend changes:
1. Create or add functions:
   - build_review_queue(report_meta, draft) -> list[dict]
   - validate_standard_report_draft(report_meta, draft) -> dict
2. Required checks:
   - reportMeta.siteName
   - reportMeta.visitDate
   - reportMeta.drafterName
   - reportMeta.progressRate
   - reportMeta.visitCount
   - reportMeta.totalVisitCount
   - reportMeta.siteAddress
   - reportMeta.siteContact
   - findingCandidates[0].location
   - findingCandidates[0].hazardDescription
   - findingCandidates[0].improvementPlan
3. AI confidence checks:
   - confidence < 0.75 => needsReview true
   - no linkedPhotoIds => warning
   - ruleKey missing => warning
4. Update apply_ai_draft_to_report() to use the dynamic reviewQueue and validationResult from the draft instead of hardcoded examples.

Frontend requirements:
1. If ReportWorkspace already displays warnings, wire the dynamic warnings into the existing view.
2. Do not redesign the whole UI unless necessary.
3. Ensure review-complete is still available after warnings are acknowledged.

Constraints:
- Exports should still require review completion.
- Do not silently mark AI fields as confirmed.
- User-edited fields should not be overwritten by later AI runs unless the user explicitly regenerates.

Done when:
- reviewMeta.reviewQueue contains actual missing/uncertain fields.
- validationResult.blockingIssues and warnings are populated correctly.
- apply_ai_draft_to_report() no longer uses fixed dummy reviewQueue items.
```

---

# 7. 기존 HWPX/PDF 매핑 확인 및 보강 프롬프트

```md
Implement Step 7: verify and strengthen HWPX/PDF mapping for the standard report.

Goal:
- Ensure the new draft fields map cleanly to the existing inspection session and HWPX/PDF output.

Context files:
- apps/web/lib/reportSessionMapper.ts
- apps/web/components/ReportWorkspace.tsx
- apps/web/app/api/documents/inspection/hwpx/route.ts
- apps/web/app/api/documents/inspection/pdf/route.ts
- Search for createCurrentHazardFinding, createFutureProcessRiskPlan, createPreviousGuidanceFollowUpItem, createSafetyEducationRecord.

Required changes:
1. Verify mapping:
   - reportMeta -> adminSiteSnapshot/document2Overview
   - documentsCompat.document4FollowUps -> document4FollowUps
   - findingCandidates -> document7Findings
   - sectionDrafts.doc8 -> document8Plans
   - sectionDrafts.doc11 -> document11EducationRecords
   - sectionDrafts.doc12 -> document12Activities
   - sectionDrafts.doc14 -> document14SafetyInfos
2. If documentsCompat.document4FollowUps is missing from the schema, add it safely with default {}.
3. Ensure linked photo URLs are carried into document7Findings.
4. Generate a sample report payload and verify the mapper does not throw.
5. Do not change document rendering internals unless mapping fails.

Constraints:
- Preserve current download flow and export disclaimer behavior.
- Do not bypass review-complete.
- Do not remove existing doc5/doc7/doc8 compatibility behavior.

Done when:
- HWPX and PDF download still work from ReportWorkspace.
- A generated two-photo draft appears in standard report sections 1~6.
- Mapper tests or a manual TypeScript compile/check confirms no schema mismatch.
```

---

# 8. 발송/이력 확장 프롬프트

```md
Implement optional dispatch history for generated reports.

Goal:
- After review/export, allow a report to be marked as sent or dispatched by email later.
- This is optional and should not block the MVP if mail APIs are not ready.

Context files:
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/apps_stack.py
- apps/web/lib/mailboxApi.ts
- apps/web/components/MailboxHubScreen.tsx
- Search for existing mail draft/send APIs.

Backend requirements:
1. Add ReportDispatchHistory model/store if appropriate.
2. Add endpoints:
   - POST /api/v1/reports/{report_id}/dispatch/email
   - GET /api/v1/reports/{report_id}/dispatch-history
3. When dispatch succeeds, update report status to sent if the ReportRecord status enum/schema supports it.
4. If status enum currently does not support sent, add it backward-compatibly.

Frontend requirements:
1. Add a simple action after PDF/HWPX export: '메일 발송 준비' or '발송 완료 처리'.
2. Do not redesign mailbox in this task.

Constraints:
- Do not send actual email unless existing mail connection is authenticated and already supports it.
- If real email cannot be sent, implement a dispatch-history placeholder and clearly label it.

Done when:
- Report can record dispatch history.
- Admin/report list can distinguish exported vs sent if supported.
- Existing export flow remains unchanged.
```

---

# 9. 한 번에 적용시키는 통합 프롬프트

```md
이 저장소에 “사진 기반 표준 기술지도 보고서 자동작성 MVP”를 구현해줘.

Goal:
- 현장/일정 선택 + 최소 사진 2장으로 표준 기술지도 결과보고서 초안을 생성한다.
- 기존 guided_photo_flow를 유지하면서 다음 구조를 추가한다:
  1. Field provenance
  2. Minimal photo buckets
  3. Photo Observation Cards
  4. Standard Risk Library
  5. Standard Report Composer
  6. Dynamic Review Queue / Validation
  7. Existing HWPX/PDF mapping compatibility

Context:
- Backend API: apps/api/app/main.py
- Backend models: apps/api/app/models.py
- Current AI pipeline: apps/api/app/services/ai_pipeline.py
- Frontend report API: apps/web/lib/reportApi.ts
- Workspace editor: apps/web/components/ReportWorkspace.tsx
- Document mapper: apps/web/lib/reportSessionMapper.ts
- Document routes: apps/web/app/api/documents/inspection/hwpx/route.ts, apps/web/app/api/documents/inspection/pdf/route.ts
- Search the repo for ReportPayload/reportPayloadSchema and update schemas safely if they exist outside these files.

Implementation requirements:
- Update photo buckets so minimum draft generation requires only:
  - step1_overview: 1 photo
  - step2_hazard: 1 photo
- Add optional buckets:
  - step3_followup
  - step4_support
- Add modules:
  - apps/api/app/services/photo_observation.py
  - apps/api/app/services/standard_risk_library.py
  - apps/api/app/services/standard_report_composer.py
- Refactor build_draft_from_guided_photos() to:
  1. build observation cards
  2. match risk rules
  3. compose section drafts
  4. return validation result and review queue
- Keep the existing response shape:
  - photoEvidence
  - findingCandidates
  - sectionDrafts
  - validationResult
- Also include optional debug/provenance keys:
  - photoObservations
  - riskLibraryMatches
  - fieldProvenance
- Update apply_ai_draft_to_report() to use dynamic validation/review queue.
- Do not let AI create factual fields.
- Keep local mode working.
- Keep HWPX/PDF download working.

Risk library minimum rules:
- OPENING_FALL_COVER
- STAIR_GUARDRAIL_FALL
- SCAFFOLD_GUARDRAIL_FALL
- EXCAVATOR_COLLISION_PREVENTION
- CRANE_LIFTING_DROP
- ELECTRIC_SHOCK_TEMP_WIRING
- FIRE_HOT_WORK
- TRENCH_COLLAPSE

Constraints:
- Do not rewrite the app from scratch.
- Do not remove existing fields or endpoints.
- Maintain backward compatibility with existing reports.
- If a schema/type package is missing from the provided source, first identify the import and make the smallest safe change in the available files; document what still needs schema package update.
- If you cannot run a full build because dependencies are missing, run the narrowest possible checks and explain what could not be verified.

Done when:
- A new report can generate a draft with 1 overview photo + 1 hazard photo.
- Generated draft populates:
  - 4번 현재 위험성 제거 through findingCandidates
  - 5번 향후 진행공정 through sectionDrafts.doc8
  - 6번 교육/지원 through sectionDrafts.doc11/doc12/doc14
- Dynamic reviewQueue includes missing factual fields and low-confidence AI fields.
- HWPX/PDF mapping does not break.
- Provide a concise summary of changed files, behavior, and remaining TODOs.
```
