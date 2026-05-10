"use client";

type ExportFormatSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ExportFormatSelector({ value, onChange }: ExportFormatSelectorProps) {
  return (
    <label className="form-field">
      <span>export 형식</span>
      <select className="select-field" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="pdf">PDF</option>
        <option value="hwpx">HWPX draft</option>
      </select>
    </label>
  );
}
