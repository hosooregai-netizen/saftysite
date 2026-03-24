import 'server-only';

import type { InspectionSession } from '@/types/inspectionSession';
import { pageHtml } from './format';
import { buildOverviewPages } from './pagesOverview';
import { buildDetailPages } from './pagesDetails';

const STYLE = `
  @page { size: A4; margin: 14mm 14mm 16mm; }
  body { margin: 0; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; color: #162033; font-size: 11pt; }
  .page { box-sizing: border-box; min-height: 268mm; padding: 0; page-break-after: always; }
  .cover-page { display: flex; align-items: center; justify-content: center; }
  .cover-wrap { width: 100%; text-align: center; display: grid; gap: 16px; }
  .cover-title { font-size: 24pt; font-weight: 700; margin-top: 42mm; }
  .cover-site, .cover-date, .cover-company { font-size: 12pt; line-height: 1.7; }
  .sign-table, .info-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .sign-table th, .sign-table td, .info-table th, .info-table td { border: 1px solid #8894a3; padding: 8px; vertical-align: top; }
  .sign-table th { background: #eff3f8; }
  .sign-table td { height: 48px; }
  .page-banner { margin-bottom: 10px; color: #4b5b70; font-size: 9pt; }
  .page-number { margin-top: 12px; text-align: center; color: #5d6b7d; font-size: 9pt; }
  .section-title { margin: 0 0 10px; font-size: 15pt; font-weight: 700; }
  .subsection-title { margin: 12px 0 8px; font-size: 11pt; font-weight: 700; }
  .text-block { border: 1px solid #8894a3; padding: 10px; line-height: 1.8; white-space: normal; word-break: keep-all; }
  .compact-table th { width: 28%; background: #f6f8fb; }
  .info-table th { width: 26%; background: #f6f8fb; text-align: left; }
  .stats-grid, .image-grid, .case-grid { display: grid; gap: 12px; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 12px; }
  .image-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
  .single-image { grid-template-columns: minmax(0, 1fr); }
  .image-card, .stats-card, .case-card, .followup-block { display: grid; gap: 8px; }
  .image-card-title, .case-title { font-weight: 700; }
  .doc-image, .case-image { width: 100%; max-height: 230px; object-fit: contain; border: 1px solid #c6cfdb; background: #fff; }
  .image-caption, .image-placeholder { color: #59677a; font-size: 10pt; line-height: 1.6; }
  .image-placeholder { display: flex; align-items: center; justify-content: center; min-height: 150px; border: 1px dashed #b8c3d1; background: #f8fafc; }
  .doc4-empty-notice { margin: 0; padding: 14px 12px; border: 1px dashed #b8c3d1; border-radius: 4px; background: #f8fafc; color: #59677a; text-align: center; line-height: 1.7; }
`;

export function buildInspectionReportHtml(
  session: InspectionSession,
  siteSessions: InspectionSession[]
): string {
  const pages = [
    ...buildOverviewPages(session),
    ...buildDetailPages(session, siteSessions.length > 0 ? siteSessions : [session]),
  ];

  return `<!DOCTYPE html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <title>건설재해예방 기술지도결과보고서</title>
      <style>${STYLE}</style>
    </head>
    <body>${pages.map((page, index) => pageHtml(page, index)).join('')}</body>
  </html>`;
}
