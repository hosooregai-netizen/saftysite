'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import RawJsonViewer from '@/components/RawJsonViewer';
import SiteOverviewChecklist from '@/components/site-overview/SiteOverviewChecklist';
import SiteOverviewUploadPanel from '@/components/site-overview/SiteOverviewUploadPanel';
import { createEmptyCausativeAgentMap } from '@/constants/siteOverview';
import type { CausativeAgentKey, CausativeAgentReport } from '@/types/siteOverview';

function createEmptyOverviewReport(): CausativeAgentReport {
  return {
    agents: createEmptyCausativeAgentMap(),
    reasoning: '',
    photoUrl: '',
  };
}

export default function SiteOverviewPage() {
  const [report, setReport] = useState<CausativeAgentReport>(
    createEmptyOverviewReport
  );
  const [rawResponse, setRawResponse] = useState<unknown>(null);

  const handleAgentToggle = useCallback(
    (key: CausativeAgentKey, checked: boolean) => {
      setReport((current) => ({
        ...current,
        agents: {
          ...current.agents,
          [key]: checked,
        },
      }));
    },
    []
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 print:hidden md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              ← 처음으로
            </Link>
            <h1 className="text-2xl font-bold text-slate-950 md:text-3xl">
              점검 사업장 전경 확인
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              전경 사진 1장을 업로드하면 12대 및 기타 사망사고 다발 기인물
              체크표를 자동으로 채웁니다. 이후 체크 상태는 직접 수정할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              인쇄
            </button>
            <button
              type="button"
              onClick={() => {
                setReport(createEmptyOverviewReport());
                setRawResponse(null);
              }}
              disabled={rawResponse == null && !report.photoUrl}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              초기화
            </button>
          </div>
        </header>

        <div className="mb-6 space-y-3 print:hidden">
          <SiteOverviewUploadPanel
            onSuccess={setReport}
            onRawResponse={setRawResponse}
          />
          {rawResponse != null && <RawJsonViewer data={rawResponse} />}
        </div>

        <SiteOverviewChecklist
          report={report}
          onAgentToggle={handleAgentToggle}
        />
      </div>
    </main>
  );
}
