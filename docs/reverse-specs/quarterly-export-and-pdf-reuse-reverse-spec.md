# Reverse Spec - Quarterly Export And PDF Reuse

## Recovery Slice

- Recovery Slice ID: `quarterly-export-and-pdf-reuse`
- Top-level contract: `quarterly-report`
- Reverse spec status: `done`

## Purpose

- Recover the quarterly document-export slice that persists the latest draft before generating HWPX or PDF.
- Preserve PDF fallback behavior and the “save before export” contract between editor state and document APIs.

## Source of Truth

- document actions: [features/site-reports/quarterly-report/useQuarterlyDocumentActions.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/useQuarterlyDocumentActions.ts)
- save mutation owner: [hooks/useSiteOperationalReportMutations.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/hooks/useSiteOperationalReportMutations.ts)
- quarterly document APIs: [lib/api.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/api.ts), [app/api/documents/quarterly/hwpx/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/documents/quarterly/hwpx/route.ts), [app/api/documents/quarterly/pdf/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/documents/quarterly/pdf/route.ts)

## Feature Goal

Users must be able to:

- export quarterly HWPX
- export quarterly PDF
- rely on the latest draft state being persisted before either export starts
- receive a non-blocking fallback notice when PDF conversion falls back to HWPX

## User Role

- primary user: assigned field worker
- secondary user: admin/controller on the same quarterly route

## Entry and Scope

- this slice begins when the user taps the HWPX or PDF export action from the quarterly editor toolbar
- report hydration and source recalculation are separate recovery slices

## Data Contracts

### Persist-before-export contract

- `persistDraftForDocumentExport()`
- reads auth token
- stamps a fresh `updatedAt`
- calls `onSave(nextDraft)`

### Output APIs

- HWPX:
  - `fetchQuarterlyHwpxDocument(report, currentSite, authToken)`
- PDF:
  - `fetchQuarterlyPdfDocumentWithFallback(report, currentSite, authToken)`

## Caching and Persistence

- export path updates the in-memory draft and then saves it before download
- auth token is required at export time, not only at page load time
- export slice relies on the surrounding save mutation rather than a separate document-only persistence layer

## State Model

### Primary local state

- `isGeneratingHwpx`
- `isGeneratingPdf`

### Derived state

- `isGeneratingDocument`

## Business Rules

### Persist-before-export rule

- both HWPX and PDF export must:
  1. clear document errors/notices as needed
  2. stamp a fresh `updatedAt`
  3. save the draft
  4. call the document endpoint

### Auth rule

- missing or empty auth token raises a 401-style document error and blocks export

### PDF fallback rule

- PDF export may fall back to HWPX
- when fallback happens:
  - file still downloads
  - notice text becomes `PDF 변환에 실패해 HWPX로 다운로드했습니다.`

## UI Composition

- HWPX action
- PDF action
- shared document error area
- shared notice area

## Interaction Flows

### HWPX

1. user taps HWPX export
2. draft is persisted with fresh `updatedAt`
3. HWPX endpoint returns blob + filename
4. blob is downloaded

### PDF

1. user taps PDF export
2. draft is persisted with fresh `updatedAt`
3. PDF endpoint runs
4. if PDF generation succeeds, download the PDF
5. if PDF generation falls back, download HWPX and show the fallback notice

## Error Handling

- export errors populate `documentError`
- loading flags always clear in `finally`
- PDF fallback is not treated as an error state when a usable HWPX file is returned

## Recovery Checklist

- [ ] HWPX export persists a fresh draft before download
- [ ] PDF export persists a fresh draft before download
- [ ] missing auth blocks export with a clear error
- [ ] PDF fallback still downloads a file and shows the fallback notice
