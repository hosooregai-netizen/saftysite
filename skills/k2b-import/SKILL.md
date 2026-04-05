---
name: k2b-import
description: Use for K2B Excel import work including parse, mapping, duplicate review, apply, and required completion field verification.
---

# K2B Import

Use this skill when the task touches the admin K2B wizard or upstream K2B import APIs.

## Focus

- `.xlsx` upload only
- parse preview, suggested mapping, duplicate candidates, apply results
- `required_completion_fields` propagation to sites

## Primary entry points

- `features/admin/sections/k2b/K2bSection.tsx`
- `app/api/k2b/**`
- `app/services/k2b.py` in `safety-server`
- `tests/test_k2b.py` in `safety-server`

## Workflow

1. Verify parse output before touching apply logic.
2. Keep duplicate rules stable:
   - management number
   - HQ business number + site name
   - site name + start/end dates
3. Never blank existing DB values when K2B omits them.
4. Surface missing required fields as follow-up work, not as hard failure.
5. If the task touches `scripts/`, keep each touched script file at `<= 200` lines by splitting helpers into sibling files instead of growing one long script.

## Validation

- Parse returns sheet list, mapping, preview rows.
- Apply returns create/update counts and completion requirements.
- Admin UI can complete `파일 파싱 -> DB에 반영`.
- Real-client smoke checks `보완 필요` on the resulting site row.
