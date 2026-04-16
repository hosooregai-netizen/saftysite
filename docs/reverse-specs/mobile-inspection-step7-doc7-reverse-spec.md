# Reverse Spec - Mobile Inspection Step 7 / Doc7 Hazard Findings

## Purpose

- Recover the mobile editing experience for document 7, the current hazard finding section.
- Preserve repeated finding cards, photo capture/selection, AI autofill/refill, manual field editing, and reference-material matching behavior.

## Source of Truth

- step container: [features/mobile/inspection-session/MobileInspectionSessionStep7.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/inspection-session/MobileInspectionSessionStep7.tsx)
- finding card: [features/mobile/inspection-session/MobileInspectionSessionStep7FindingCard.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/inspection-session/MobileInspectionSessionStep7FindingCard.tsx)
- mobile AI actions: [features/mobile/inspection-session/useMobileInspectionAiActions.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/inspection-session/useMobileInspectionAiActions.ts)
- shared AI helper: [components/session/workspace/doc7Ai.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/components/session/workspace/doc7Ai.ts)
- doc7 catalog: [constants/inspectionSession/doc7Catalog.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/constants/inspectionSession/doc7Catalog.ts)
- desktop/shared field layout: [features/inspection-session/workspace/sections/doc7/Doc7FindingFields.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/inspection-session/workspace/sections/doc7/Doc7FindingFields.tsx)
- desktop/shared photo panel: [features/inspection-session/workspace/sections/doc7/Doc7FindingPhotoPanel.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/inspection-session/workspace/sections/doc7/Doc7FindingPhotoPanel.tsx)

## Feature Goal

Workers must be able to:

- review a list of current hazard findings
- add and delete findings
- attach one or two field photos per finding
- refill a finding using AI based on photo 1
- manually edit accident type, risk, causative agent, hazard description, improvement request, emphasis, and legal reference

## User Role

- primary user: field worker / inspector
- precondition:
  - hydrated inspection session with editable `document7Findings`

## Data Contracts

### Main entity

`CurrentHazardFinding`

Fields actively used in mobile step 7:

- `id`
- `photoUrl`
- `photoUrl2`
- `location`
- `accidentType`
- `riskLevel`
- `causativeAgentKey`
- `hazardDescription`
- `improvementPlan`
- `improvementRequest`
- `emphasis`
- `legalReferenceId`
- `legalReferenceTitle`
- `referenceLawTitles`

### AI autofill API

- endpoint: `POST /api/ai/doc7-finding`
- request:
  - multipart form with `file`
- response payload fields used:
  - `location`
  - `accidentType`
  - `riskLevel`
  - `causativeAgentKey`
  - `hazardDescription`
  - `improvementRequest`

### AI patch application

Returned AI patch is normalized and applied via:

- `buildHazardFindingAutoFill(file)`
- `applyDoc7ReferenceMaterialMatch(...)`

This means AI refill not only fills text but also tries to align the finding to local reference materials.

## State Model

### Step-level state

- `doc7AiLoadingId`
- `doc7AiErrors`

### Finding-level derived behavior

- a card is “AI refill capable” only when `photoUrl` exists
- the currently refilling card is identified by `doc7AiLoadingId === finding.id`

## Business Rules

### Step rendering

- render all findings in order
- render `+ 지적 사항 추가` button at the bottom
- adding a finding appends `createCurrentHazardFinding({ inspector: current.meta.drafter })`

### Delete rule

- delete button removes one finding from `document7Findings`

### Photo rules

- each finding supports two photo slots:
  - `photoUrl`
  - `photoUrl2`
- photo source can be:
  - photo album selection
  - direct file/camera/gallery selection
- file selection uses `screen.withFileData(file, callback)` to persist as session-compatible data URL/blob value

### AI refill rules

- refill uses only `photoUrl`
- refill button disabled when:
  - `photoUrl` is empty
  - current finding is already loading
- on success:
  - merge AI patch into the target finding
  - apply reference-material matching
- on failure:
  - store card-local error in `doc7AiErrors[finding.id]`

### Field update rules

All edits are persisted through:

- `screen.applyDocumentUpdate('doc7', 'manual', updater)`

Each card updates only the matching `finding.id`.

### Improvement-request sync rule

When user edits “개선요청사항”:

- update both:
  - `improvementPlan`
  - `improvementRequest`

### Legal-reference rule

When editing “관련 법령” text:

- clear `legalReferenceId`
- set `legalReferenceTitle`
- derive `referenceLawTitles` by splitting on commas/newlines and trimming

### Catalog compatibility rules

- accident types and causative agents are selected from normalized catalog options
- legacy causative-agent keys must still map into current catalog compatibility sets

## UI Composition

### Step header

- title: `현존 유해·위험요인 세부 지적`

### Per-finding card

Each card contains:

- finding index label
- `AI 다시 채우기` button
- delete button
- photo slot 1
- photo slot 2
- AI error notice if present
- location input
- accident type select
- risk level select
- causative agent select
- hazard description textarea
- improvement request textarea
- emphasis textarea
- legal reference input

### Add action

- full-width secondary button:
  - `+ 지적 사항 추가`

## Interaction Flows

### Add finding

1. user taps add button
2. create default finding with inspector metadata
3. append to session doc7 array

### Attach photo

1. user taps a photo slot
2. open photo source picker
3. choose album or file source
4. resolve selected asset into `photoUrl` or `photoUrl2`
5. re-render card with preview

### AI refill

1. user taps `AI 다시 채우기`
2. convert current `photoUrl` asset back into `File`
3. upload file to `/api/ai/doc7-finding`
4. normalize result
5. merge AI patch into the target finding
6. run local reference-material matching

### Manual edit

1. user edits any field in the card
2. update only that finding via `applyDocumentUpdate`
3. preserve all other findings

## Error Handling

- AI refill errors are stored per finding and shown inline
- missing/failed photo refetch for AI refill throws `사진 파일을 다시 불러오는 중 오류가 발생했습니다.`
- generic AI autofill failure maps to `문서7 AI 자동 채우기에 실패했습니다.`

## Non-Obvious Constraints

- mobile step 7 does not own persistence directly; it relies entirely on shared session mutation helpers
- AI refill is intentionally idempotent at the finding level and does not regenerate the whole section
- reference-material matching is part of successful AI application, not a separate later pass
- desktop and mobile share the same conceptual fields, so schema drift between `Doc7FindingFields` and `MobileInspectionSessionStep7FindingCard` is a regression risk

## Recovery Checklist

- [ ] existing findings render in order
- [ ] add/delete finding works
- [ ] both photo slots accept mobile source selection
- [ ] AI refill updates only the target finding
- [ ] AI errors stay local to a finding
- [ ] improvement request syncs to both request/plan fields
- [ ] legal reference text rebuilds `referenceLawTitles`
- [ ] catalog options and legacy compatibility are preserved

## Verification

- targeted typecheck
- one manual step-7 mobile pass:
  - add finding
  - attach photo
  - AI refill
  - save manual edits
