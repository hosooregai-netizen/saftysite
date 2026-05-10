import type { MailDraft, MailTemplate } from "../../packages/contracts/src";
import { ComposePanel } from "./compose-panel";

export function ContractEstimateMailComposer({ draft, templates }: { draft: MailDraft; templates: MailTemplate[] }) {
  return <ComposePanel draft={draft} templates={templates} />;
}
