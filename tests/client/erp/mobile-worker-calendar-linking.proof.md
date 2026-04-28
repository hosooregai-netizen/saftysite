# Mobile Worker Calendar Linking Proof

## Scope

- `features/mobile/components/MobileWorkerCalendarScreen.tsx`
- `features/mobile/components/MobileShell.tsx`

## Contract

- mobile worker calendar keeps the same contract-window date guard as desktop
- tapping an existing saved schedule card opens that schedule for edit instead of picking an arbitrary default row
- saving a mobile worker schedule creates or reuses the matching technical-guidance draft and writes the linked report key back to the schedule
- mobile shell can surface the logged-in account name in the header without changing navigation contracts

## Validation

- `npx eslint features/mobile/components/MobileWorkerCalendarScreen.tsx`
- `npx tsc --noEmit --pretty false`
- `python -m pytest tests/test_schedule_selection.py tests/test_schedule_merge.py`
