import type { MailTemplate } from "../../packages/contracts/src";

type MailTemplateSelectorProps = {
  templates: MailTemplate[];
  value?: string | null;
  onChange: (value: string) => void;
};

export function MailTemplateSelector({ templates, value, onChange }: MailTemplateSelectorProps) {
  return (
    <label className="field">
      <span className="field-label">메일 템플릿</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">직접 작성</option>
        {templates.map((template) => (
          <option value={template.id} key={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </label>
  );
}
