# AIDLC for ERP Work

Use AIDLC here as a practical method for reducing AI regression, hallucinated interfaces, and accidental feature loss.

## Core Idea

Keep the unit of reasoning small enough that an AI assistant can fully hold it in context, while keeping interfaces explicit enough that splitting files does not create made-up dependencies.

## Working Defaults

- Prefer edited files under 200 lines when practical.
- Treat files over 300 lines as candidates for responsibility splits before adding more behavior.
- Do not split purely by line count; split by ownership and interface clarity.

## Recommended Split Patterns

For client code:

- route/page wrapper
- screen/container
- hook/state
- panel/component
- provider/registry/config

For service code:

- router
- service
- model/schema

## Anti-Hallucination Bundle

When asking AI to change a feature, provide at least:

1. the target file
2. the feature contract
3. the nearest interface/helper file
4. `ARCHITECTURE.md` when layer ownership is relevant

This prevents the model from inventing hidden dependencies across small files.

## Good Use of the 200-Line Rule

Use the rule to:

- reduce attention dilution
- isolate side effects
- keep edits feature-scoped
- make smoke failures easier to localize

Do not use the rule to:

- force arbitrary file fragmentation
- hide business flow across too many micro-files
- skip documenting shared interfaces
