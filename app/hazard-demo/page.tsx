'use client';

import Link from 'next/link';
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
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <header className="app-page-header">
            <div>
              <Link href="/" className="app-breadcrumb">
                ← 업무 메뉴
              </Link>
              <h1 className="app-page-title">위험성평가 보고서 작성</h1>
              <p className="app-page-description">
                위험요인 사진을 등록하고 보고서 항목을 검토, 수정한 뒤 출력합니다.
                결과 표 형식은 유지하고 실무 검토 흐름을 우선합니다.
              </p>
            </div>

            <div className="app-toolbar">
              {reports.length > 0 && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="app-button app-button-accent"
                >
                  문서 인쇄
                </button>
              )}
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
                <p className={styles.contentDescription}>
                  각 보고서의 위험요인, 개선대책, 법령, 이행시기를 검토한 뒤
                  출력합니다.
                </p>
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
                    업로드된 분석 결과가 없습니다. 사진을 등록해 보고서 작성을
                    시작해 주세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
