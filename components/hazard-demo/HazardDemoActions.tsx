'use client';

import { useCallback } from 'react';

interface HazardDemoActionsProps {
  reportsCount: number;
  onAddReport: () => void;
  onRemoveLastReport: () => void;
  onPrint: () => void;
}

export default function HazardDemoActions({
  reportsCount,
  onAddReport,
  onRemoveLastReport,
  onPrint,
}: HazardDemoActionsProps) {
  const handlePrint = useCallback(() => window.print(), []);

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onAddReport}
        className="rounded border border-black bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
      >
        보고서 추가
      </button>
      {reportsCount > 1 && (
        <button
          type="button"
          onClick={onRemoveLastReport}
          className="rounded border border-black bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
        >
          마지막 보고서 삭제
        </button>
      )}
      <button
        type="button"
        onClick={handlePrint}
        className="rounded border border-black bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        인쇄
      </button>
    </div>
  );
}
