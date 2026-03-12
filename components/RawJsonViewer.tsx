'use client';

import { useState } from 'react';

interface RawJsonViewerProps {
  data: unknown;
}

export default function RawJsonViewer({ data }: RawJsonViewerProps) {
  const [collapsed, setCollapsed] = useState(true);

  const json =
    data === undefined || data === null ? '(없음)' : JSON.stringify(data, null, 2);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 print:hidden">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        <span>Raw JSON 보기</span>
        <span className="text-slate-500">{collapsed ? '펼치기' : '접기'}</span>
      </button>
      {!collapsed && (
        <pre className="max-h-72 overflow-auto px-4 pb-4 text-xs text-slate-800 whitespace-pre-wrap break-all">
          {json}
        </pre>
      )}
    </section>
  );
}
