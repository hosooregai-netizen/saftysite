# Worker Calendar Admin Proof

- admin-scoped helper changes stay aligned with the worker calendar PATCH-only restore
- worker schedule writes continue to invalidate admin-facing schedule/report snapshots through the existing admin path
- companion smoke proof for the worker flow lives in `tests/client/erp/worker-calendar.spec.ts`
