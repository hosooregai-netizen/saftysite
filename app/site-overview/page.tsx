'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import RequireSafetyLogin from '@/components/auth/RequireSafetyLogin';
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
    createEmptyOverviewReport,
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
    [],
  );

  return (
    <RequireSafetyLogin
      title="현장 개요 체크리스트"
      description="AI 사진 분석을 사용하려면 로그인해 주세요."
    >
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <header className="app-page-header">
              <div>
                <Link href="/" className="app-breadcrumb">
                  메인 메뉴
                </Link>
                <h1 className="app-page-title">현장 개요 작성</h1>
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
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </RequireSafetyLogin>
  );
}
