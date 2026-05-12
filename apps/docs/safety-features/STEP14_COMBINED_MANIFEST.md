# Step 14 Combined Manifest

Generated at: `2026-05-07T11:37:07Z`

This combined overlay merges Step 01 through Step 13 into a single `docs/safety-features/` documentation package and adds `_release/` guidance for applying, verifying, and rolling back the package.

## Included step overlays

| Step | Overlay |
|---:|---|
| 01 | `safety_features_step01_foundation_overlay.zip` |
| 02 | `safety_features_step02_webhard_overlay.zip` |
| 03 | `safety_features_step03_mailbox_overlay.zip` |
| 04 | `safety_features_step04_report_workspace_overlay.zip` |
| 05 | `safety_features_step05_report_list_overlay.zip` |
| 06 | `safety_features_step06_headquarters_sites_overlay.zip` |
| 07 | `safety_features_step07_photo_album_overlay.zip` |
| 08 | `safety_features_step08_account_settings_overlay.zip` |
| 09 | `safety_features_step09_billing_credits_overlay.zip` |
| 10 | `safety_features_step10_auth_workspace_overlay.zip` |
| 11 | `safety_features_step11_registry_index_overlay.zip` |
| 12 | `safety_features_step12_design_system_overlay.zip` |
| 13 | `safety_features_step13_quality_regression_overlay.zip` |

## Feature coverage summary

| Feature | Specs files | Prompt files |
|---|---:|---:|
| `webhard` | 14 | 6 |
| `mailbox` | 16 | 7 |
| `report-workspace` | 17 | 8 |
| `report-list` | 14 | 8 |
| `headquarters-sites` | 15 | 8 |
| `photo-album` | 16 | 8 |
| `account-settings` | 18 | 8 |
| `billing-credits` | 17 | 8 |
| `auth-workspace` | 18 | 8 |

## Additional Step 14 docs

```text
docs/safety-features/_release/
├─ README.md
├─ specs/
└─ prompts/
```

## Collision policy used during merge

The overlays were applied in step order. If a file existed in an earlier step and was also present in a later step, the later step version was kept.

Number of overwritten paths during merge: `12`
