'use client';

import { useState, useCallback } from 'react';

interface HazardDemoDebugPanelProps {
  onApply: (json: string) => Promise<string | null>;
}

export default function HazardDemoDebugPanel({ onApply }: HazardDemoDebugPanelProps) {
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApply = useCallback(async () => {
    setError(null);
    const err = await onApply(json);
    if (err) setError(err);
  }, [json, onApply]);

  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-3">
      <p className="mb-2 text-xs font-medium text-amber-800">디버그: JSON 붙여넣기</p>
      <textarea
        placeholder='API 응답 JSON 또는 HazardReportItem[] 형식을 붙여넣고 "적용" 클릭'
        className="mb-2 w-full min-h-[100px] rounded border border-amber-200 bg-white p-2 font-mono text-xs"
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleApply}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1 text-sm text-amber-900 hover:bg-amber-200"
        >
          적용
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
