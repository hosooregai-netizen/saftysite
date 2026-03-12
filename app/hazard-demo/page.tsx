'use client';

import Link from 'next/link';
import HazardReportTable from '@/components/HazardReportTable';
import HazardUploadPanel from '@/components/HazardUploadPanel';
import RawJsonViewer from '@/components/RawJsonViewer';
import { HazardDemoActions, HazardDemoDebugPanel } from '@/components/hazard-demo';
import { useHazardReports } from '@/hooks/useHazardReports';

export default function HazardDemoPage() {
  const {
    reports,
    rawResponse,
    useMock,
    setUseMock,
    setRawResponse,
    handleReportChange,
    handleApiSuccess,
    handleUseMock,
    handleAddReport,
    handleRemoveReport,
    handleApplyDebugJson,
  } = useHazardReports();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 print:hidden md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              ← 처음으로
            </Link>
            <h1 className="text-2xl font-bold text-slate-950 md:text-3xl">
              위험요인분석 결과
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              위험 사진을 업로드하면 분석 결과를 보고서 표 형식으로 정리합니다.
            </p>
          </div>
        </header>

        <div className="mb-6 space-y-3 print:hidden">
          <HazardUploadPanel
            onSuccess={handleApiSuccess}
            onRawResponse={setRawResponse}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) =>
                e.target.checked ? handleUseMock() : setUseMock(false)
              }
              className="rounded border-slate-400"
            />
            <span>Mock 데이터 사용</span>
          </label>
          {rawResponse != null && <RawJsonViewer data={rawResponse} />}
        </div>

        <div className="overflow-visible print:overflow-visible">
          <div className="min-w-full overflow-x-auto overflow-y-visible pb-4 print:overflow-visible">
            {reports.length > 0 ? (
              reports.map((report, index) => (
                <HazardReportTable
                  key={`report-${index}`}
                  data={report}
                  onChange={(data) => handleReportChange(index, data)}
                  index={index}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 print:hidden">
                업로드된 분석 결과가 없습니다. 사진을 올리거나 Mock 데이터를 사용해
                주세요.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 print:hidden">
          <HazardDemoActions
            reportsCount={reports.length}
            onAddReport={handleAddReport}
            onRemoveLastReport={() => handleRemoveReport(reports.length - 1)}
            onPrint={() => window.print()}
          />
          <HazardDemoDebugPanel onApply={handleApplyDebugJson} />
        </div>
      </div>
    </main>
  );
}
