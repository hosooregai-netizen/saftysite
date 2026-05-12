# Release Docs Package

`_release/` documents how to apply the combined `docs/safety-features` package, verify it, and roll back if necessary.

## When to use

Use this folder when applying the combined Step 01~13 documentation package instead of applying each step overlay separately.

## Contents

```text
_release/
├─ specs/
│  ├─ combined_package.md
│  ├─ apply_order.md
│  ├─ conflict_policy.md
│  ├─ rollback.md
│  ├─ final_qa_order.md
│  ├─ package_inventory.md
│  ├─ release_notes.md
│  └─ next_steps.md
└─ prompts/
   ├─ 00_MASTER_CREATE_COMBINED_DOCS_PACKAGE.md
   ├─ 01_APPLY_COMBINED_DOCS.md
   ├─ 02_VERIFY_COMBINED_DOCS.md
   ├─ 03_RUN_FINAL_DOCS_QA.md
   ├─ 04_VALIDATE_WITH_CODEBASE.md
   └─ 05_PREPARE_NEXT_ITERATION.md
```
