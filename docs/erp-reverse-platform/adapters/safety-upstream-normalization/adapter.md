# Adapter: Safety Upstream Normalization

Adapter ID: `safety-upstream-normalization`

## Purpose

Normalize current safety-service payloads into platform entities that the reverse module catalog can
reuse without inheriting route- or payload-specific coupling.

## Input Contracts

- admin dashboard overview and analytics payloads
- site report list payloads
- quarterly report source and document output payloads
- photo asset payloads

## Output Entities

- `DashboardSnapshot`
- `WorkItemRow`
- `PeriodicReportSourceRecord`
- `RenderedArtifact`
- `AssetRecord`

## Mapping Rules

- map payload-specific naming into stable platform entity names
- provide explicit fallback defaults for partial admin dashboard payloads
- preserve upstream identifiers needed for route handoff and output reuse
- isolate lossy vocabulary conversion inside the adapter

## Failure Modes

- malformed payload segment: emit a scoped entity-level failure instead of poisoning all entities
- missing identifier: keep source record unavailable and mark the module path as non-reusable
- payload drift: fail validation at the adapter boundary instead of silently reshaping business modules

