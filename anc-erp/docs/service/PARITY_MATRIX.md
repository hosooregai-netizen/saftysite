# anc-erp Parity Matrix

`anc-erp` keeps the A&C ERP containment model, but parity-sensitive surfaces should port the workflow shape of the existing product instead of collapsing into a lighter skeleton.

| Surface | Existing baseline | anc-erp target | Label | Notes |
| --- | --- | --- | --- | --- |
| Docs source of truth | `docs/service/docs/aec-erp/...` on disk | All AGENTS/runbook references resolve to this path | `doc_gap` | Older prompts still said `docs/aec-erp/...` |
| Dashboard / project hub shell | `apps/web` dashboard and hub shells | Preserve ERP shell weight, nav density, and operational summary cards | `implementation_drift` | anc-erp had a thinner bootstrap landing |
| Webhard host | `apps/web/app/webhard` + `apps/web/features/drive/*` | Full-screen host with left nav, workspace tabs, tree/list/detail flow | `implementation_drift` | anc-erp already had routes and data, but host UX was lighter |
| Mailbox host | `apps/web/app/mailbox` + `apps/web/features/mailbox/*` | 3-pane host with folder nav, account context, thread triage, detail actions | `implementation_drift` | anc-erp kept domain linkage but underplayed the host workflow |
| Route names | Legacy `/mailbox` and share/webhard names | anc-erp may intentionally use `/mail` while keeping equivalent behavior | `intentional` | Docs explicitly allow route changes when ownership model changed |
| Domain ownership | Legacy app mixes SaaS/report flows | anc-erp enforces `Project -> InspectionRound -> DocumentInstance` | `intentional` | Do not revert containment for parity's sake |
| Webhard / mailbox linkage | Legacy app-level drive and mailbox | anc-erp keeps project/document/submission linkage visible in host UI | `intentional` | Parity is about workflow, not standalone records |
