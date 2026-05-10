"use client";

type EmergencyProcedureEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function EmergencyProcedureEditor({ value, onChange }: EmergencyProcedureEditorProps) {
  return (
    <label className="form-field span-2">
      <span>비상 대응 메모</span>
      <textarea
        className="fake-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder="연락 절차, 현장 대응 메모를 입력합니다."
        rows={3}
        value={value}
      />
    </label>
  );
}
