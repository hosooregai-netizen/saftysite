# ERP Proof: DOC8 Future Process Recommendation UX

## Covered Behavior

- desktop DOC8 future-process inputs no longer open a default six-item suggestion list on empty focus
- mobile DOC8 future-process inputs follow the same type-to-search behavior
- process, hazard, and countermeasure fields keep manual entry available while showing up to 12 matched catalog recommendations after the user starts typing
- desktop and mobile process-name fields use the same textarea-style editing surface as hazard and countermeasure fields

## Verification

- `npx eslint components/session/workspace/sections/Doc8Section.tsx features/mobile/inspection-session/MobileInspectionSessionStep8.tsx components/session/InspectionSessionWorkspace.module.css`
- `npx tsc --noEmit`
