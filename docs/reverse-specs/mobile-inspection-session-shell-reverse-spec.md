# Reverse Spec - Mobile Inspection Session Shell

## Purpose

- Recover the mobile-first inspection-session writing experience that sits on top of the shared inspection-session state and document engine.
- Preserve the step-based shell, state gating, summary bar, mobile-only modals, and bridge back to the shared session screen logic.

## Source of Truth

- mobile screen entry: [features/mobile/components/MobileInspectionSessionScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/components/MobileInspectionSessionScreen.tsx)
- mobile state gate: [features/mobile/inspection-session/MobileInspectionSessionStateGate.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/inspection-session/MobileInspectionSessionStateGate.tsx)
- mobile workspace: [features/mobile/inspection-session/MobileInspectionSessionWorkspace.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/inspection-session/MobileInspectionSessionWorkspace.tsx)
- step router: [features/mobile/inspection-session/MobileInspectionSessionStepPanels.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/inspection-session/MobileInspectionSessionStepPanels.tsx)
- shared screen controller: [features/inspection-session/hooks/useInspectionSessionScreen.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/inspection-session/hooks/useInspectionSessionScreen.ts)
- shared desktop screen: [features/inspection-session/components/InspectionSessionScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/inspection-session/components/InspectionSessionScreen.tsx)
- mobile helpers: [features/mobile/inspection-session/mobileInspectionSessionHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/inspection-session/mobileInspectionSessionHelpers.ts)

## Feature Goal

Workers must be able to open one inspection session on mobile and:

- load the same underlying report/session data as desktop
- navigate document sections through a mobile step tab system
- save, export, and view progress
- open mobile-specific modals for document info, photo picking, and AI-assisted content generation
- deep link into direct-signature flow

## User Role

- primary user: field worker / inspector
- fallback user: admin may still load the shared controller, but mobile flow is designed for worker report authoring
- preconditions:
  - authenticated inspection-session context
  - valid `sessionId`

## Entry and Scope

- mobile screen receives `sessionId`
- shared screen controller comes from `useInspectionSessionScreen(sessionId)`
- query-param special case:
  - `action=direct-signature`

Out of scope:

- desktop workspace composition
- admin-only report-open bootstrap UX

## Data Contracts

### Session source

The mobile shell does not fetch its own document payload model.

It consumes the same shared controller used by desktop:

- `displaySession`
- `sectionSession`
- `derivedData`
- `displayProgress`
- `saveNow`
- `generateHwpxDocument`
- `generatePdfDocument`
- `applyDocumentUpdate`
- `withFileData`

### Step registry

`MOBILE_INSPECTION_STEPS`

Ordered steps:

- `step2` 개요
- `step3` 현장 전경
- `step4` 이전 기술지도
- `step5` 총평
- `step6` 사망 기인물
- `step7` 위험요인 지적
- `step8` 향후 진행공정
- `step9` 위험성평가 / TBM
- `step10` 계측점검
- `step11` 안전교육
- `step12` 활동 실적

### Shared route link

- mobile shell exposes a `webHref`:
  - `/sessions/${encodeURIComponent(sessionId)}`

This preserves a jump back into the desktop/shared workspace for the same session.

## State Model

### Primary local state

- `activeStep`
- `documentInfoOpen`
- photo-picker state from `useMobileInspectionPhotoPicker`
- AI state from `useMobileInspectionAiActions`
- doc2-process modal state from `useMobileInspectionDoc2Process`
- scene-plan state from `useMobileInspectionScenePlanActions`
- measurement state from `useMobileInspectionMeasurementActions`
- direct-signature state from `useMobileInspectionDirectSignature`

### Derived state

- `displaySession`
- `session` (`sectionSession`)
- `isDirectSignatureAction`
- `measurementTemplateOptions`

## Business Rules

### State gating

Before rendering the mobile shell:

- if not ready:
  - show standalone loading state
- if not authenticated:
  - show mobile login panel
- if loading session and no display session:
  - show standalone loading state
- if no display session or no progress:
  - show standalone missing-state panel with return link to mobile home

### Shared-vs-mobile rendering rule

- `displaySession` can exist before the fully hydrated `sectionSession`
- if `sectionSession` is missing:
  - mobile shell may still exist
  - workspace body must show a syncing notice instead of step panels

### Summary bar behavior

The summary bar must surface:

- save action
- HWPX export action
- PDF export action
- progress percentage
- document-info modal open
- saving/generation state

### Direct-signature rule

- if `action=direct-signature`, the screen must bias toward the signature-related path via `useMobileInspectionDirectSignature`

## UI Composition

### Mobile shell frame

- title from `getSessionTitle(displaySession)`
- back link to site reports list
- worker tab bar
- logout action

### Summary bar

- progress summary
- save button
- document export buttons
- document info button

### Step tab strip

- rendered from `MOBILE_INSPECTION_STEPS`
- exactly one active step at a time

### Step panel region

- delegates to `MobileInspectionSessionStepPanels`
- only active step panel renders

### Modal layer

- `MobileInspectionSessionModals` owns:
  - document info
  - doc2 process modal
  - photo source modal
  - photo album modal

## Interaction Flows

### Initial load

1. build shared screen controller from `sessionId`
2. pass controller through `MobileInspectionSessionStateGate`
3. if display session exists, render mobile shell
4. if full section payload is ready, render active step panel

### Step navigation

1. user taps a step tab
2. `activeStep` changes
3. only matching step component renders

### Save

1. user taps save in summary bar
2. call `screen.saveNow()`
3. rely on shared inspection-session autosave/save behavior

### Export

1. user taps HWPX or PDF action
2. call shared `generateHwpxDocument` or `generatePdfDocument`
3. reuse shared document generation/fallback rules

## Error Handling

- auth errors flow through login panel
- session loading failures fall back to standalone missing state
- document/upload/sync errors are shown as inline error notices near the bottom of the screen
- step-specific AI errors stay local to the relevant step or modal

## Non-Obvious Constraints

- mobile is not a separate data model; it is a presentation layer over the same shared inspection-session controller
- `displaySession` and `sectionSession` are intentionally different concepts and must not be collapsed
- mobile shell must remain usable even while section body hydration is still catching up

## Recovery Checklist

- [ ] mobile screen renders from shared controller
- [ ] state gate handles loading/auth/missing cases correctly
- [ ] step tab navigation works
- [ ] summary bar can save and trigger exports
- [ ] desktop `webHref` points to the matching session
- [ ] direct-signature query mode is preserved
- [ ] modal layer remains functional for photo/doc actions

## Verification

- mobile inspection smoke if available
- targeted typecheck
- one end-to-end mobile session sanity pass through save/export/step switch
