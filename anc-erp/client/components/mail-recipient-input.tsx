type MailRecipientInputProps = {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
};

export function MailRecipientInput({ label, value, onChange }: MailRecipientInputProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        value={value.join(", ")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
        placeholder="name@example.com, other@example.com"
      />
    </label>
  );
}
