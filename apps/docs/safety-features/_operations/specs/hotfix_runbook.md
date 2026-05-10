# Hotfix Runbook

## Hotfix 대상

- P0/P1 incident
- release blocker discovered post-release
- data/security/billing issue

## Hotfix flow

```text
Issue intake
→ severity classification
→ minimal patch scope
→ focused QA
→ related regression
→ deploy hotfix
→ monitor
→ docs update
```

## Hotfix prompt source

Use:

```text
docs/safety-features/_blocker-patches/prompts/*
```

## Hotfix verification

- clean build
- affected route smoke
- affected security gate
- related regression
- incident resolution report
