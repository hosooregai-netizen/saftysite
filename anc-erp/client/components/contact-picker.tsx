"use client";

type ContactPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function ContactPicker({ label, value, onChange, placeholder }: ContactPickerProps) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        className="fake-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? "담당자 입력"}
        type="text"
        value={value}
      />
    </label>
  );
}
