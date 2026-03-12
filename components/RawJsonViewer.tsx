'use client';

import { useState } from 'react';

interface RawJsonViewerProps {
  data: unknown;
}

export default function RawJsonViewer({ data }: RawJsonViewerProps) {
  const [collapsed, setCollapsed] = useState(true);

  const json =
    data === undefined || data === null
      ? '(없음)'
      : JSON.stringify(data, null, 2);

  return (
    <div className="rounded border border-gray-300 bg-gray-50 print:hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        <span>Raw JSON (디버그)</span>
        <span className="text-gray-500">{collapsed ? '펼치기' : '접기'}</span>
      </button>
      {!collapsed && (
        <pre className="max-h-64 overflow-auto px-3 pb-3 text-xs text-gray-800 whitespace-pre-wrap break-all">
          {json}
        </pre>
      )}
    </div>
  );
}
