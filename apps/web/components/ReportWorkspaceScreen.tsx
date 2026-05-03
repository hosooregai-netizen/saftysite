'use client';

import { useEffect, useState } from 'react';
import { getReportRecord, bootstrapDemoSession, type ReportRecord } from '@/lib/reportApi';
import ReportWorkspace from './ReportWorkspace';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export function ReportWorkspaceScreen({ reportId }: { reportId: string }) {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState('');
  const [record, setRecord] = useState<ReportRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState('loading');
      setLoadError('');

      try {
        const session = await bootstrapDemoSession();
        const nextRecord = await getReportRecord(session, reportId);
        if (cancelled) {
          return;
        }
        setRecord(nextRecord);
        setLoadState('loaded');
      } catch (error) {
        if (cancelled) {
          return;
        }
        setLoadState('error');
        setLoadError(error instanceof Error ? error.message : '보고서를 불러오지 못했습니다.');
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <div className="erp-page">
        <section className="erp-panel">
          <h1 className="page-title">보고서 불러오는 중</h1>
        </section>
      </div>
    );
  }

  if (loadState === 'error' || !record) {
    return (
      <div className="erp-page">
        <section className="erp-panel">
          <h1 className="page-title">보고서 조회 실패</h1>
          <p className="page-meta-line">{loadError}</p>
        </section>
      </div>
    );
  }

  return <ReportWorkspace reportId={record.id} report={record.payload} record={record} />;
}
