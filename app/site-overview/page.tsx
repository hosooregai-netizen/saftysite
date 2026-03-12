'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import SiteOverviewChecklist from '@/components/site-overview/SiteOverviewChecklist';
import SiteOverviewUploadPanel from '@/components/site-overview/SiteOverviewUploadPanel';
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
                ← 업무 메뉴
              </Link>
              <h1 className="app-page-title">전경 점검표 작성</h1>
              <p className="app-page-description">
                현장 전경 사진을 등록하고 사망사고 다발 기인물 체크표를 검토한 뒤
                출력합니다. 체크 결과는 담당자가 직접 수정할 수 있습니다.
              </p>
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
            <aside className={styles.uploadAside}>
              <SiteOverviewUploadPanel
                onSuccess={setReport}
                onRawResponse={() => undefined}
              />
            </aside>

            <div className={styles.checklistPane}>
              <SiteOverviewChecklist
                report={report}
                onAgentToggle={handleAgentToggle}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
