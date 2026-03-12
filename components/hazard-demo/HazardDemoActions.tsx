'use client';

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
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onAddReport}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-100"
      >
        보고서 추가
      </button>
      {reportsCount > 1 && (
        <button
          type="button"
          onClick={onRemoveLastReport}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-100"
        >
          마지막 보고서 제거
        </button>
      )}
      <button
        type="button"
        onClick={onPrint}
        className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        인쇄
      </button>
    </div>
  );
}
