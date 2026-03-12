'use client';

import { useCallback, useState } from 'react';

interface HazardDemoDebugPanelProps {
  onApply: (json: string) => Promise<string | null>;
}

export default function HazardDemoDebugPanel({
  onApply,
}: HazardDemoDebugPanelProps) {
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApply = useCallback(async () => {
    setError(null);
    const nextError = await onApply(json);
    if (nextError) setError(nextError);
  }, [json, onApply]);

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
        Debug JSON
      </p>
      <textarea
        placeholder='API 응답 JSON 또는 HazardReportItem[] 형식 데이터를 붙여넣고 "적용"을 누르세요.'
        className="mb-3 min-h-[120px] w-full rounded-xl border border-amber-200 bg-white p-3 font-mono text-xs text-slate-900"
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="rounded-full border border-amber-700 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-200"
        >
          적용
        </button>
        {error && <span className="text-xs text-rose-600">{error}</span>}
      </div>
    </section>
  );
}
