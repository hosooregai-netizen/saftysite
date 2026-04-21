# ERP AIDLC Batch 6: Full Reference Deck By Markdown Doc

## Goal

Expand the ERP reverse-platform PPT coverage so every Markdown document under
`docs/erp-reverse-platform/` is represented in a full-reference deck.

## Scope

- `scripts/generateErpReversePlatformFullReferenceDeck.ts`
- `package.json`
- `docs/erp-reverse-platform/README.md`
- `docs/erp-reverse-platform/reverse-and-server-introduction.md`
- `docs/erp-reverse-platform/erp-reverse-platform-full-reference.pptx`

## Output

- one full-reference PPT that keeps the intro slides and then adds document-by-document slides
- automatic Markdown discovery for all docs under `docs/erp-reverse-platform`

## Validation Commands

```bash
npx tsc --noEmit --pretty false
npm run generate:erp-reverse-platform-full-reference
git diff --check
```

## Implementation Record

### Expected outputs

- the current intro deck remains as the short version
- a second deck exists for document-by-document understanding
- every Markdown doc gets at least one dedicated summary slide
- module docs also get a deeper API/server/performance slide

### Actual results

- Added a full-reference PPT generator that scans `docs/erp-reverse-platform` for Markdown files,
  classifies them by doc type, and builds document summary slides automatically.
- Kept the opening intro section, then appended document-specific reference slides in a fixed order:
  overview docs, templates, adapter/pack/composition docs, platform primitives, business modules.
- Added deep-dive slides for the long overview doc and for all module docs so API contracts, server
  touchpoints, and performance guardrails remain visible in the deck.
- Linked the new full-reference deck from the reverse-platform README and the introduction doc.

## Validation Run

- `npx tsc --noEmit --pretty false`
  - passed
- `npm run generate:erp-reverse-platform-full-reference`
  - passed and generated `docs/erp-reverse-platform/erp-reverse-platform-full-reference.pptx`
- `git diff --check`
  - passed

## Residual Debt

- The deck is generated from headings and short text extraction rules, so very custom Markdown
  layouts may need future parser refinement if the doc style changes substantially.
