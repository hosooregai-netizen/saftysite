'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import SiteOverviewChecklist from '@/components/site-overview/SiteOverviewChecklist';
import { createEmptyCausativeAgentMap } from '@/constants/siteOverview';
import type { CausativeAgentKey, CausativeAgentReport } from '@/types/siteOverview';
import styles from './page.module.css';

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
  const checkedAgents = Object.values(report.agents).filter(Boolean).length;
  const canReset = Boolean(report.photoUrl || report.reasoning || checkedAgents > 0);

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
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <header className="app-page-header">
            <div>
              <Link href="/" className="app-breadcrumb">
                메인 메뉴
              </Link>
              <h1 className="app-page-title">전경 점검 작성</h1>
            </div>

            <div className="app-toolbar">
              <button
                type="button"
                onClick={() => window.print()}
                className="app-button app-button-accent"
              >
                문서 인쇄
              </button>
              <button
                type="button"
                onClick={() => {
                  setReport(createEmptyOverviewReport());
                }}
                disabled={!canReset}
                className="app-button app-button-secondary"
              >
                화면 초기화
              </button>
            </div>
          </header>

          <div className={styles.contentGrid}>
            <div className={styles.checklistPane}>
              <SiteOverviewChecklist
                report={report}
                onAgentToggle={handleAgentToggle}
                onUploadSuccess={setReport}
                onUploadClear={() => setReport(createEmptyOverviewReport())}
                onRawResponse={() => undefined}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
