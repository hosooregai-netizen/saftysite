'use client';

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
    <main className="min-h-screen bg-white p-4 md:p-8 print:p-0">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 text-center print:mb-4">
          <h1 className="text-xl font-bold text-black md:text-2xl">
            위험요인 분석 결과
          </h1>
        </header>

        <div className="mb-6 space-y-3">
          <HazardUploadPanel
            onSuccess={handleApiSuccess}
            onRawResponse={setRawResponse}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) =>
                e.target.checked ? handleUseMock() : setUseMock(false)
              }
              className="rounded border-gray-400"
            />
            <span>Mock 데이터 사용</span>
          </label>
          {rawResponse != null && <RawJsonViewer data={rawResponse} />}
        </div>

        <div className="overflow-visible print:overflow-visible">
          <div className="min-w-full pb-4 overflow-x-auto overflow-y-visible print:overflow-visible">
            {reports.map((report, index) => (
              <HazardReportTable
                key={`report-${index}`}
                data={report}
                onChange={(data) => handleReportChange(index, data)}
                index={index}
              />
            ))}
          </div>
        </div>

        <div className="print:hidden space-y-4">
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
