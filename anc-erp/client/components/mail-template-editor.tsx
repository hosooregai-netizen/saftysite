"use client";

import { useState } from "react";

import type { MailTemplate } from "../../packages/contracts/src";
import { updateAdminMailTemplateAction } from "../lib/admin-actions";
import { updateMailTemplateDraft } from "../lib/mail-actions";

export function MailTemplateEditor({
  template,
  mode = "mailbox",
}: {
  template: MailTemplate;
  mode?: "mailbox" | "admin";
}) {
  const [subjectTemplate, setSubjectTemplate] = useState(template.subjectTemplate);

  async function handleSave() {
    const payload = {
      subjectTemplate,
      bodyTemplate: template.bodyTemplate,
      variables: template.variables,
    };
    if (mode === "admin") {
      await updateAdminMailTemplateAction(template.id, payload);
      return;
    }
    await updateMailTemplateDraft(template.id, payload);
  }

  return (
    <section className="panel">
      <p className="card-eyebrow">MailTemplateEditor</p>
      <h3 className="panel-title">{template.name}</h3>
      <label className="field">
        <span className="field-label">제목 템플릿</span>
        <input value={subjectTemplate} onChange={(event) => setSubjectTemplate(event.target.value)} />
      </label>
      <button type="button" onClick={handleSave}>
        템플릿 저장
      </button>
    </section>
  );
}
