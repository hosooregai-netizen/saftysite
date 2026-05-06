'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  bootstrapReportSession,
  hasGeneratedReportSnapshot,
  listReports,
  readLastGeneratedReportSession,
  type ReportRecord,
} from '@/lib/reportApi';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

function getReportStatusLabel(report: ReportRecord): string {
  if (report.status === 'exported') return '출력 완료';
  if (report.status === 'review_completed') return '검토 완료';
  if (report.payload.currentSection === 'ai-generating') return '생성중';
  if (report.status === 'draft_ready') return '검토 필요';
  return '사진 수집중';
}

function getReportStatusTone(report: ReportRecord): 'warning' | 'neutral' | 'info' | 'success' {
  if (report.status === 'exported') return 'success';
  if (report.status === 'review_completed') return 'info';
  if (report.payload.currentSection === 'ai-generating') return 'info';
  if (report.status === 'draft_ready') return 'warning';
  return 'neutral';
}

function getExportStatus(report: ReportRecord): string {
  const formats = new Set(report.exports.map((item) => item.format));
  if (formats.has('pdf') && formats.has('hwpx')) return 'PDF/HWPX 출력';
  if (formats.has('pdf')) return 'PDF 출력';
  if (formats.has('hwpx')) return 'HWPX 출력';
  return '미출력';
}

export function ReportsOverview() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState('');
  const [reports, setReports] = useState<ReportRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState('loading');
      setLoadError('');

      try {
        const session = await bootstrapReportSession({
          preferredSession: readLastGeneratedReportSession(),
        });
        const nextReports = await listReports(session);

        if (cancelled) {
          return;
        }

        setReports(nextReports);
        setLoadState('loaded');
      } catch (error) {
        if (cancelled) {
          return;
        }
        setLoadState('error');
        setLoadError(error instanceof Error ? error.message : '목록을 불러오지 못했습니다.');
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="erp-page">
      <section className="page-header-card">
        <div>
          <span className="page-kicker">보고서 보기</span>
          <h1 className="page-title">기술지도 보고서 목록</h1>
          <p className="page-meta-line">
            작성 중인 보고서와 출력 이력을 확인하고, 새 보고서 작성으로 이어갈 수 있습니다.
          </p>
        </div>
        <div className="workspace-header-actions">
          <span className="workspace-chip workspace-chip-active">보고서 관리</span>
          <Link href="/reports/new" className="erp-button erp-button-primary">
            새 보고서 작성
          </Link>
        </div>
      </section>

      <section className="erp-panel">
        <div className="erp-panel-header">
          <h2>보고서 목록</h2>
          <div className="erp-toolbar">
            <input className="erp-input erp-search" defaultValue="" placeholder="현장명, 작성자, 지도일 검색" />
            <select className="erp-select" defaultValue="recent" aria-label="정렬">
              <option value="recent">최종수정순</option>
            </select>
          </div>
        </div>

        {loadState === 'loading' ? <div className="row-meta">목록 불러오는 중</div> : null}
        {loadState === 'error' ? <div className="row-meta">{loadError}</div> : null}
        {loadState === 'loaded' ? (
          <div className="report-table">
            <div className="report-table-head">
              <span>순번/지도일</span>
              <span>보고서명</span>
              <span>진행상태</span>
              <span>최종수정</span>
              <span>출력 여부</span>
              <span>작업</span>
            </div>
            {reports.length > 0 ? (
              reports.map((report, index) => {
                const reviewPendingCount = report.payload.reviewMeta.reviewQueue.filter((item) => item.needsReview).length;
                const findingCount = report.payload.findingCandidates.length;
                const reportHref = hasGeneratedReportSnapshot(report.id)
                  ? `/reports/${report.id}?entry=generated`
                  : `/reports/${report.id}`;

                return (
                  <article
                    key={report.id}
                    className="report-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(reportHref)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(reportHref);
                      }
                    }}
                  >
                    <div className="report-row-primary">
                      <strong>{reports.length - index}차</strong>
                      <span>{report.payload.reportMeta.visitDate}</span>
                    </div>
                    <div className="report-row-title">
                      <strong>{report.payload.reportMeta.siteName}</strong>
                      <span>{report.payload.reportMeta.customerName}</span>
                    </div>
                    <div>
                      <span className={`status-badge status-${getReportStatusTone(report)}`}>
                        {getReportStatusLabel(report)}
                      </span>
                      <p className="row-meta">검토대기 {reviewPendingCount}건</p>
                    </div>
                    <div className="row-meta-block">
                      <strong>{report.updated_at.slice(0, 16).replace('T', ' ')}</strong>
                      <span>지적 {findingCount}건</span>
                    </div>
                    <div className="row-meta-block">
                      <strong>{getExportStatus(report)}</strong>
                      <span>{report.exports.length > 0 ? `${report.exports.length}회` : '미출력'}</span>
                    </div>
                    <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                      <Link href={reportHref} className="erp-button erp-button-secondary">
                        열기
                      </Link>
                      <button
                        type="button"
                        className="erp-button erp-button-text"
                        onClick={() => router.push('/reports/new')}
                      >
                        새로 작성
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="report-row">
                <div className="report-row-title">
                  <strong>저장된 보고서 없음</strong>
                  <span>새 보고서를 시작해 주세요.</span>
                </div>
              </article>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
