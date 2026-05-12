import type { SelectedReportContext } from './mailboxPanelTypes';

export interface MailReportTemplate {
  body: string;
  id: string;
  name: string;
  subject: string;
}

const GUIDANCE_REPORT_BODY = [
  '안녕하세요, 한국종합안전(주) {agentName} 입니다.',
  '<br /><br />',
  '기술지도 결과보고서를 보내 드리오니 확인 부탁드립니다.',
  '<br /><br />',
  '① 현장명 : {siteName}',
  '<br />',
  '② 회차 : 지도회차 {guidanceRound} / 계약회차 {contractRound}',
  '<br />',
  '③ 지도일자 : {visitDateDot}',
  '<br /><br />',
  '감사합니다.',
  '<br /><br />',
  '한국종합안전(주)',
  '<br />',
  'T. 02-454-4541',
  '<br />',
  'F. 02-2299-0905',
  '<br />',
  'E. hts27@safetysite.co.kr',
  '<br />',
  '서울특별시 광진구 구의강변로 45, 6층 603호(구의동, 성진프라자)',
].join('');

const GUIDANCE_REPORT_SUBJECT =
  '한국종합안전({agentName}){siteName} - 기술지도 결과보고서({roundNo}회차)';

export const MAIL_REPORT_TEMPLATES: MailReportTemplate[] = [
  {
    id: 'default',
    name: '기술지도 결과보고서',
    subject: GUIDANCE_REPORT_SUBJECT,
    body: GUIDANCE_REPORT_BODY,
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

function normalizeAgentName(value: string) {
  const normalized = normalizeText(value);
  return normalized && !/^한국종합안전(?:\(주\))?$/u.test(normalized)
    ? normalized
    : '요원명';
}

function formatRoundNo(value: unknown, { pad = false } = {}) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? pad
      ? String(Math.trunc(value)).padStart(2, '0')
      : String(Math.trunc(value))
    : '';
}

function buildRoundValue(
  reports: SelectedReportContext[],
  key: 'totalRound' | 'visitRound',
  { pad = false } = {},
) {
  const rounds = reports
    .map((report) => formatRoundNo(report[key], { pad }))
    .filter(Boolean);
  const uniqueRounds = Array.from(new Set(rounds));
  if (uniqueRounds.length === 0) return '';
  if (uniqueRounds.length === 1) return uniqueRounds[0] || '';
  return `${uniqueRounds[0]} 외 ${uniqueRounds.length - 1}건`;
}

function buildRoundLabel(reports: SelectedReportContext[]) {
  const round = buildRoundValue(reports, 'visitRound');
  return round ? `${round}회차` : '';
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

function formatVisitDateDot(value: string) {
  const normalized = normalizeText(value);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return normalized;
  return `${match[1]}.  ${match[2]}.  ${match[3]}.`;
}

export function renderMailReportTemplate(
  template: MailReportTemplate,
  reports: SelectedReportContext[],
) {
  const first = reports[0] || null;
  const visitDate = pickSharedValue(reports, 'visitDate');
  const variables: Record<string, string> = {
    agentName: normalizeAgentName(pickSharedValue(reports, 'assigneeName')),
    contractRound: buildRoundValue(reports, 'totalRound'),
    date: visitDate || new Date().toISOString().slice(0, 10),
    guidanceRound: buildRoundValue(reports, 'visitRound'),
    headquarterName: pickSharedValue(reports, 'headquarterName'),
    reportCount: reports.length ? String(reports.length) : '0',
    reportKey: normalizeText(first?.reportKey),
    reportList: buildReportList(reports),
    reportTitle: pickSharedValue(reports, 'reportTitle'),
    round: buildRoundLabel(reports),
    roundNo: buildRoundValue(reports, 'visitRound', { pad: true }) || '00',
    siteName: pickSharedValue(reports, 'siteName') || '현장명',
    visitDate,
    visitDateDot: formatVisitDateDot(visitDate),
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
