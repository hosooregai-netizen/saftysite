# Technical Guidance Automation Kit

## Goal

This folder documents the first-pass automation pipeline for legacy technical-guidance PDFs.

The target is not:

- training directly on raw PDFs
- storing page Markdown as the primary truth
- recreating every legacy layout variant first

The target is:

- manifesting all legacy PDFs
- extracting page and section evidence
- normalizing them into a canonical technical-guidance schema
- generating an `InspectionSession`-compatible draft that can be reviewed and exported by the existing stack

For persistent local work, prefer a repo-local artifact directory such as `./.artifacts/technical-guidance-corpus` instead of `/tmp`.

## Strict Format Rule

For business output, canonical JSON and Markdown are not the final format authority.

- the final document format must remain bound to the existing inspection renderer
- the authoritative renderer is `server/documents/inspection/hwpx.ts`
- the authoritative template is `public/templates/inspection/기술지도 수동보고서 앱 - 서식_4.annotated.v8.hwpx`
- production PDF output must flow through `/api/documents/inspection/pdf`

This means the automation pipeline may normalize and draft content, but it must not invent a new report layout.

## Photo-First Draft Path

It is possible to generate a new technical-guidance draft from new photos without copying old report payloads.

The intended chain is:

1. new photos
2. photo observations or vision captions
3. constrained JSON draft for `doc3/doc5/doc7/doc10/doc11/doc12`
4. human review
5. existing inspection HWPX template renderer

Previous reports should be used only for:
- style/tone
- recurring risk vocabulary
- common follow-up patterns

They should not be copied as factual source for the new report.

## Pipeline

1. `legacy:tg:manifest`
   - scans the PDF corpus
   - estimates report/site/date/title
   - classifies a coarse `format_family`
2. `legacy:tg:evidence`
   - extracts page text
   - runs OCR fallback for low-text pages
   - writes section Markdown and evidence bundles
3. `legacy:tg:canonical`
   - normalizes evidence into `TechnicalGuidanceCanonicalReport`
4. `legacy:tg:variant-profiles`
   - groups manifest/evidence output into reusable family profiles
5. `legacy:tg:draft`
   - converts one canonical report into an `InspectionSession`-compatible draft JSON with review hints

## Recommended Artifact Layout

- manifest:
  - `manifest.jsonl`
- evidence:
  - `reports/<legacyReportId>/evidence.json`
  - `reports/<legacyReportId>/sections/*.md`
- canonical:
  - `canonical/<legacyReportId>.json`
- variant profiles:
  - `variant-profiles.json`
- generated draft:
  - `drafts/<legacyReportId>.json`

## Recommended First Run

```bash
npm run legacy:tg:manifest -- \
  --pdf-root /Users/mac_mini/Downloads/legacy-insafed-export-2026-04-14-full/admin/reports/pdf \
  --output ./.artifacts/technical-guidance-corpus/manifest.jsonl \
  --summary-output ./.artifacts/technical-guidance-corpus/manifest-summary.json
```

```bash
npm run legacy:tg:evidence -- \
  --manifest ./.artifacts/technical-guidance-corpus/manifest.jsonl \
  --output-root ./.artifacts/technical-guidance-corpus/evidence \
  --limit 20
```

```bash
npm run legacy:tg:canonical -- \
  --manifest ./.artifacts/technical-guidance-corpus/manifest.jsonl \
  --evidence-root ./.artifacts/technical-guidance-corpus/evidence \
  --output-root ./.artifacts/technical-guidance-corpus/canonical
```

```bash
npm run legacy:tg:variant-profiles -- \
  --manifest ./.artifacts/technical-guidance-corpus/manifest.jsonl \
  --evidence-root ./.artifacts/technical-guidance-corpus/evidence \
  --output ./.artifacts/technical-guidance-corpus/variant-profiles.json
```

```bash
npm run legacy:tg:draft -- \
  --canonical ./.artifacts/technical-guidance-corpus/canonical/257477.json \
  --output ./.artifacts/technical-guidance-corpus/drafts/257477.json
```

```bash
python3 -m scripts.legacy_insafed.validate_technical_guidance_format \
  --canonical ./.artifacts/technical-guidance-corpus/canonical/257477.json \
  --draft ./.artifacts/technical-guidance-corpus/drafts/257477.json \
  --output ./.artifacts/technical-guidance-corpus/format-validation/257477.json
```

```bash
python3 -m scripts.legacy_insafed.build_image_only_pdf_sample \
  --source-pdf /Users/mac_mini/Downloads/legacy-insafed-export-2026-04-14-full/admin/reports/pdf/257477.pdf \
  --output-pdf ./.artifacts/technical-guidance-corpus/samples/257477-image-only.pdf \
  --manifest-output ./.artifacts/technical-guidance-corpus/samples/257477-image-only.json
```

```bash
python3 -m scripts.legacy_insafed.build_ordered_mixed_image_pdf \
  --source ./.artifacts/technical-guidance-corpus/evidence/reports/100364/evidence.json::./.artifacts/technical-guidance-corpus/samples/100364-image-only-pages \
  --source ./.artifacts/technical-guidance-corpus/evidence/reports/100365/evidence.json::./.artifacts/technical-guidance-corpus/samples/100365-image-only-pages \
  --output-pdf ./.artifacts/technical-guidance-corpus/samples/ordered-mix-100364-100365.pdf \
  --manifest-output ./.artifacts/technical-guidance-corpus/samples/ordered-mix-100364-100365.json \
  --include-optional
```

```bash
python3 -m scripts.legacy_insafed.build_technical_guidance_photo_request \
  --canonical ./.artifacts/technical-guidance-corpus/canonical/100364.json \
  --previous-canonical ./.artifacts/technical-guidance-corpus/canonical/100365.json \
  --photo doc3_scene::/absolute/path/to/new-scene-photo.jpg \
  --photo doc7_finding::/absolute/path/to/new-risk-photo.jpg \
  --output ./.artifacts/technical-guidance-corpus/photo-draft-request.json
```

`POST /api/ai/technical-guidance-photo-draft`
- input: photo observations + previous report summaries
- output: constrained JSON draft for `doc3/doc5/doc7/doc10/doc11/doc12`
- purpose: produce new-report section drafts from new photos while preserving the old format contract

## Notes

- OCR fallback uses `tesseract` only when the native PDF text is too sparse.
- Page image paths are optional and are only emitted when page rendering is requested or OCR fallback runs.
- The canonical report is a reconstruction artifact, not the final editable truth.
- The final editable truth remains the generated `InspectionSession` draft plus human review.
