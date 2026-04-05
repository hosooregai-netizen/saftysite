---
name: report-rules
description: Use for 기술지도 and 분기 보고서 output rules, document ordering, chart display, reference material rendering, and HWPX/PDF verification.
---

# Report Rules

Use this skill when the request changes how reports are edited or rendered.

## Focus

- technical guidance findings
- quarterly report section order
- chart aggregation and percentage labels
- reference law and reference material rendering
- HWPX/PDF preparation paths

## Primary entry points

- `components/session/workspace/**`
- `features/inspection-session/workspace/**`
- `app/sites/[siteKey]/quarterly/**`
- `lib/documents/inspection/**`
- `server/documents/inspection/**`

## Workflow

1. Separate stored structure from rendered format.
2. Keep quarterly bundle ordering deterministic: lower visit round first.
3. Prefer merged reference material fields over legacy split fields.
4. When rules affect exports, verify both screen rendering and server builders.

## Validation

- Required sections render in the requested order.
- Chart labels show counts and percentages as specified.
- Legacy fields still read as fallback.
- Any changed report flow is covered in smoke or targeted UI verification.
