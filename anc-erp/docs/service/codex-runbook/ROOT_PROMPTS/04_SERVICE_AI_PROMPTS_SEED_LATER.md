This prompt is for a later phase, after Feature 13 admin/template/prompt exists.

Task:
Implement PromptTemplate seed loading.

Read all files matching:
- docs/aec-erp/*/prompts/03_SERVICE_AI_PROMPT.md

Implement:
1. PromptTemplate model.
2. PromptVersion model.
3. Seed service AI prompts from docs.
4. Prompt list API.
5. Prompt detail API.
6. Mock provider for execution.

Rules:
- Do not call a real LLM yet.
- Service AI prompts are application runtime prompts, not Codex implementation instructions.
