import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath: string) {
  return readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

function includesAll(content: string, patterns: string[]) {
  for (const pattern of patterns) {
    assert.ok(content.includes(pattern), `Expected content to include "${pattern}"`);
  }
}

function run() {
  const agents = read("docs/service/AGENTS.md");
  includesAll(agents, [
    "docs/service/docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md",
    "If any runbook prompt still references `docs/aec-erp/...`, resolve it to `docs/service/docs/aec-erp/...`.",
    "apps/web/app/webhard",
    "apps/web/app/mailbox",
  ]);

  const feature00 = read("docs/service/codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/03_REVERSE_AUDIT.md");
  includesAll(feature00, [
    "docs/service/docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md",
    "parityGaps",
    "apps/web",
  ]);

  const feature10 = read("docs/service/codex-runbook/FEATURE_PROMPTS/10-webhard/01_IMPLEMENT_FEATURE.md");
  includesAll(feature10, [
    "docs/service/docs/aec-erp/10-webhard/README.md",
    "apps/web/app/webhard",
    "Port the existing `apps/web` full-screen file-manager information architecture",
  ]);

  const feature11 = read("docs/service/codex-runbook/FEATURE_PROMPTS/11-mailbox/01_IMPLEMENT_FEATURE.md");
  includesAll(feature11, [
    "docs/service/docs/aec-erp/11-mailbox/README.md",
    "apps/web/app/mailbox",
    "Port the existing `apps/web` 3-pane mailbox structure",
  ]);

  const parityMatrix = read("docs/service/PARITY_MATRIX.md");
  includesAll(parityMatrix, ["doc_gap", "implementation_drift", "intentional"]);

  console.log("runbook parity checks passed");
}

run();
