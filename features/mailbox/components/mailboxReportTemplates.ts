import type { SelectedReportContext } from './mailboxPanelTypes';

export interface MailReportTemplate {
  body: string;
  id: string;
  name: string;
  subject: string;
}

export const MAIL_REPORT_TEMPLATES: MailReportTemplate[] = [
  {
    id: 'default',
    name: '자동 생성',
    subject: '[보고서] {siteName} {date} {round} 보고서 발송',
    body: [
      '<p>안녕하세요.</p>',
      '<p>{siteName} 현장 보고서를 전달드립니다.</p>',
      '<p>{reportList}</p>',
      '<p>확인 부탁드립니다.</p>',
    ].join(''),
  },
  {
    id: 'quarterly',
    name: '분기 보고',
    subject: '[분기 보고서] {headquarterName} / {siteName} {date}',
    body: [
      '<p>안녕하세요.</p>',
      '<p>{headquarterName} {siteName} 현장 분기 보고서를 첨부드립니다.</p>',
      '<p>{reportList}</p>',
      '<p>검토 후 회신 부탁드립니다.</p>',
    ].join(''),
  },
  {
    id: 'guidance',
    name: '기술지도 보고',
    subject: '[기술지도 보고서] {siteName} {round}',
    body: [
      '<p>안녕하세요.</p>',
      '<p>{siteName} 현장 기술지도 보고서를 발송드립니다.</p>',
      '<p>{reportList}</p>',
      '<p>첨부 파일 확인 부탁드립니다.</p>',
    ].join(''),
  },
];

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pickSharedValue(reports: SelectedReportContext[], key: keyof SelectedReportContext) {
  const values = Array.from(
    new Set(reports.map((report) => normalizeText(report[key])).filter(Boolean)),
  );
  if (values.length === 0) return '';
  if (values.length === 1) return values[0] || '';
  return `${values[0]} 외 ${values.length - 1}건`;
}

function buildRoundLabel(reports: SelectedReportContext[]) {
  const rounds = reports
    .map((report) => {
      const value = report.visitRound;
      return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? `${value}회차`
        : '';
    })
    .filter(Boolean);
  const uniqueRounds = Array.from(new Set(rounds));
  if (uniqueRounds.length === 0) return '';
  if (uniqueRounds.length === 1) return uniqueRounds[0] || '';
  return `${uniqueRounds[0]} 외 ${uniqueRounds.length - 1}회차`;
}

function buildReportList(reports: SelectedReportContext[]) {
  if (reports.length === 0) return '';
  const rows = reports.map((report) => {
    const labels = [
      normalizeText(report.reportTitle) || normalizeText(report.reportKey),
      normalizeText(report.visitDate),
      typeof report.visitRound === 'number' && report.visitRound > 0
        ? `${report.visitRound}회차`
        : '',
    ].filter(Boolean);
    return `<li>${escapeHtml(labels.join(' / '))}</li>`;
  });
  return `<ul>${rows.join('')}</ul>`;
}

export function renderMailReportTemplate(
  template: MailReportTemplate,
  reports: SelectedReportContext[],
) {
  const first = reports[0] || null;
  const variables: Record<string, string> = {
    date: pickSharedValue(reports, 'visitDate') || new Date().toISOString().slice(0, 10),
    headquarterName: pickSharedValue(reports, 'headquarterName'),
    reportCount: reports.length ? String(reports.length) : '0',
    reportKey: normalizeText(first?.reportKey),
    reportList: buildReportList(reports),
    reportTitle: pickSharedValue(reports, 'reportTitle'),
    round: buildRoundLabel(reports),
    siteName: pickSharedValue(reports, 'siteName'),
    visitDate: pickSharedValue(reports, 'visitDate'),
  };
  const replace = (value: string) =>
    value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => variables[key] ?? '');
  return {
    body: replace(template.body),
    subject: replace(template.subject).replace(/\s+/g, ' ').trim(),
  };
}

export function getMailReportTemplate(templateId: string) {
  return (
    MAIL_REPORT_TEMPLATES.find((template) => template.id === templateId) ||
    MAIL_REPORT_TEMPLATES[0]
  );
}
