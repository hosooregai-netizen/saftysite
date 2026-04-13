# ERP Modularity

Use a three-layer structure for ERP product families.

## 1. Platform Core

Keep these shared and reusable across industries:

- authentication and shell
- site, user, worker, assignment entities
- API clients and caching
- document engines and shared upload/download flows
- messaging, notification, and audit primitives

## 2. Industry Packs

Place industry-specific logic behind providers, registries, or config maps:

- workflow steps and allowed transitions
- report/document kinds
- terminology and copy
- content packs and templates
- integration adapters

Prefer `registry -> renderer -> screen` over `if industry === ...` branches scattered across UI files.

## 3. Tenant Config

Customer-specific differences should be config, not code forks:

- branding
- organization shape
- permissions and policy flags
- template selection
- deployment-specific toggles

## Practical Rule

When adding a new ERP behavior, ask in order:

1. Is this a shared platform capability?
2. Is this an industry-pack rule?
3. Is this tenant configuration?

If the answer is unclear, default to the highest reusable layer that still keeps behavior explicit.

## File Ownership Hint

When a screen becomes large, split it by ownership:

- keep route wrappers thin
- move fetch/state logic to hooks
- move repeated visual blocks to panels
- move industry decisions to registries/providers
- keep tenant-specific switches in config maps rather than shared UI branches
