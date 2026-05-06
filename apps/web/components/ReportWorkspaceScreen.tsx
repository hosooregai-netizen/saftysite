'use client';

import { useEffect, useState } from 'react';
import {
  getReportRecord,
  bootstrapDemoSession,
  readGeneratedReportSnapshot,
  type DemoSession,
  type ReportRecord,
} from '@/lib/reportApi';
import ReportWorkspace from './ReportWorkspace';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export function ReportWorkspaceScreen({
  reportId,
  initialEntry = null,
}: {
  reportId: string;
  initialEntry?: string | null;
}) {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState('');
  const [record, setRecord] = useState<ReportRecord | null>(null);
  const [reportSession, setReportSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const generatedSnapshot =
        initialEntry === 'generated' ? readGeneratedReportSnapshot(reportId) : null;
      if (generatedSnapshot) {
        setRecord(generatedSnapshot.record);
        setReportSession(generatedSnapshot.session);
        setLoadState('loaded');
      } else {
        setLoadState('loading');
      }
      setLoadError('');

      try {
        if (generatedSnapshot) {
          const nextRecord = await getReportRecord(generatedSnapshot.session, reportId);
          if (cancelled) {
            return;
          }
          setRecord(nextRecord);
          setReportSession(generatedSnapshot.session);
          setLoadState('loaded');
          return;
        }

        const session = await bootstrapDemoSession();
        const nextRecord = await getReportRecord(session, reportId);
        if (cancelled) {
          return;
        }
        setRecord(nextRecord);
        setReportSession(session);
        setLoadState('loaded');
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (generatedSnapshot) {
          setRecord((current) => current ?? generatedSnapshot.record);
          setReportSession(generatedSnapshot.session);
          setLoadState('loaded');
          setLoadError(error instanceof Error ? error.message : '보고서를 불러오지 못했습니다.');
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
  }, [initialEntry, reportId]);

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

  return (
    <ReportWorkspace
      reportId={record.id}
      report={record.payload}
      record={record}
      initialEntry={initialEntry}
      initialSession={reportSession}
    />
  );
}
