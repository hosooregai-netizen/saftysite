'use client';

import Link from 'next/link';
import RequireSafetyLogin from '@/components/auth/RequireSafetyLogin';
import HazardReportTable from '@/components/HazardReportTable';
import HazardUploadPanel from '@/components/HazardUploadPanel';
import { HazardDemoActions } from '@/components/hazard-demo';
import { useHazardReports } from '@/hooks/useHazardReports';
import styles from './page.module.css';

export default function HazardDemoPage() {
  const {
    reports,
    setRawResponse,
    handleReportChange,
    handleApiSuccess,
    handleAddReport,
    handleRemoveReport,
  } = useHazardReports();

  return (
    <RequireSafetyLogin
      title="위험성평가 보고서"
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
                <h1 className="app-page-title">위험성평가 보고서 작성</h1>
              </div>

              <div className="app-toolbar">
                {reports.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="app-button app-button-accent"
                  >
                    문서 인쇄
                  </button>
                ) : null}
              </div>
            </header>

            <div className={styles.uploadSection}>
              <HazardUploadPanel
                onSuccess={handleApiSuccess}
                onRawResponse={setRawResponse}
              />
            </div>

            <div className={styles.contentSection}>
              <div className={styles.contentHeader}>
                <div className={styles.contentTitleBlock}>
                  <h2 className={styles.contentTitle}>보고서 검토 및 수정</h2>
                </div>

                <HazardDemoActions
                  reportsCount={reports.length}
                  onAddReport={handleAddReport}
                  onRemoveLastReport={() => handleRemoveReport(reports.length - 1)}
                  onPrint={() => window.print()}
                />
              </div>

              <div className={styles.reportViewport}>
                <div className={styles.reportViewportInner}>
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
                    <div className="app-empty-state print:hidden">
                      업로드한 분석 결과가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </RequireSafetyLogin>
  );
}
