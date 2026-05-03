'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { creationDialogFields } from '@/lib/demoData';
import {
  bootstrapDemoSession,
  fetchCreditBalance,
  listReports,
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState('');
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [dialogFields, setDialogFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(creationDialogFields.map((field) => [field.id, field.value])),
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState('loading');
      setLoadError('');

      try {
        const session = await bootstrapDemoSession();
        const [nextReports, nextCreditBalance] = await Promise.all([
          listReports(session),
          fetchCreditBalance(session),
        ]);

        if (cancelled) {
          return;
        }

        setReports(nextReports);
        setCreditBalance(nextCreditBalance);
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

  const summaryCards = useMemo(() => {
    const latestReport = reports[0];
    const pendingReports = reports.filter((report) => report.status === 'draft_ready').length;

    return [
      { label: '현장명', value: latestReport?.payload.reportMeta.siteName || '-' },
      { label: '최근 작성일', value: latestReport?.payload.reportMeta.visitDate || '-' },
      { label: '미검토 초안', value: `${pendingReports}건` },
      { label: '남은 크레딧', value: creditBalance === null ? '-' : `${creditBalance}건` },
      { label: '최근 상태', value: latestReport ? getReportStatusLabel(latestReport) : '-' },
    ];
  }, [creditBalance, reports]);

  return (
    <div className="erp-page">
      <section className="page-header-card">
        <div>
          <span className="page-kicker">Reports</span>
          <h1 className="page-title">기술지도 보고서</h1>
        </div>
        <button type="button" className="erp-button erp-button-primary" onClick={() => setIsCreateOpen(true)}>
          새 보고서 시작
        </button>
      </section>

      <section className="summary-strip" aria-label="현장 요약">
        {summaryCards.map((card) => (
          <article key={card.label} className="summary-tile">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
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

                return (
                  <article key={report.id} className="report-row">
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
                    <div className="row-actions">
                      <Link href={`/reports/${report.id}`} className="erp-button erp-button-secondary">
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

      {isCreateOpen ? (
        <div className="modal-scrim" role="presentation" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="page-kicker">Create</span>
                <h2>새 보고서 시작</h2>
              </div>
              <button type="button" className="erp-button erp-button-text" onClick={() => setIsCreateOpen(false)}>
                닫기
              </button>
            </div>

            <div className="modal-form-grid">
              {creationDialogFields.map((field) => (
                <label key={field.id} className="form-field">
                  <span>{field.label}</span>
                  <input
                    className="erp-input"
                    value={dialogFields[field.id] ?? ''}
                    onChange={(event) =>
                      setDialogFields((current) => ({
                        ...current,
                        [field.id]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="erp-button erp-button-secondary" onClick={() => setIsCreateOpen(false)}>
                취소
              </button>
              <button
                type="button"
                className="erp-button erp-button-primary"
                onClick={() => router.push('/reports/new')}
              >
                작성 시작
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
