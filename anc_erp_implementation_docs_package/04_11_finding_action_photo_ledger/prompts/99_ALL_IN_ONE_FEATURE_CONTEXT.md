# 99 ALL IN ONE FEATURE CONTEXT — 지적사항/조치현황 사진대지

Implement `지적사항/조치현황 사진대지`.

## Trace

- Route: `/photo-ledger-forms/[formId]/edit`
- Component: `PhotoLedgerEntryCard`
- API: `GET /api/v1/photo-ledger-forms/{formId}`
- Models: `PhotoLedgerForm, PhotoLedgerEntry, EvidencePhoto`
- Prompt: `photo-ledger-summary`
- Tests: `photo_ledger_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
