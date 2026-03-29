import 'server-only';

import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import { sanitizeWordFileName } from '@/server/documents/sharedDocx';
import type { ChecklistRating, InspectionSession } from '@/types/inspectionSession';

export interface ReportPageDraft {
  body: string;
  cover?: boolean;
}

const ratingLabels: Record<ChecklistRating, string> = {
  good: '양호',
  average: '보통',
  poor: '미흡',
  '': '-',
};

const causativeAgentLabels = Object.fromEntries(
  CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
    section.rows.flatMap((row) => [
      [row.left.key, row.left.label],
      [row.right.key, row.right.label],
    ])
  )
);

export function escapeHtml(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function lineBreaks(value: string | null | undefined): string {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

export function valueText(value: string | null | undefined, fallback = '-'): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : fallback;
}

export function check(value: boolean): string {
  return value ? '☑' : '☐';
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1]}.${match[2]}.${match[3]}`;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(value);

  return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(
    parsed.getDate()
  ).padStart(2, '0')}`;
}

export function fileNameForSession(session: InspectionSession): string {
  const site = sanitizeWordFileName(
    session.meta.siteName || session.adminSiteSnapshot.siteName || 'inspection',
    'inspection'
  );
  return `${site || 'inspection'}-${formatDate(session.meta.reportDate).replace(/\./g, '')}-${session.reportNumber}회.docx`;
}

export function imageTag(src: string, alt: string, className = 'doc-image'): string {
  if (!src?.trim()) return `<div class="image-placeholder">${escapeHtml(alt)} 없음</div>`;
  return `<img class="${className}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`;
}

export function sectionTitle(title: string): string {
  return `<h2 class="section-title">${escapeHtml(title)}</h2>`;
}

export function infoRows(
  rows: Array<{ label: string; value: string | null | undefined }>
): string {
  return rows
    .map(
      (row) =>
        `<tr><th>${escapeHtml(row.label)}</th><td>${row.value?.trim() ? lineBreaks(row.value) : '-'}</td></tr>`
    )
    .join('');
}

export function countByLabel(values: string[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();

  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => (b.count === a.count ? a.label.localeCompare(b.label, 'ko-KR') : b.count - a.count));
}

export function checklistLabel(value: ChecklistRating): string {
  return ratingLabels[value] ?? '-';
}

export function causativeLabel(key: string): string {
  const label = (causativeAgentLabels[key] as string | undefined) ?? key;
  return label || '-';
}

export function pageHtml(page: ReportPageDraft, pageIndex: number): string {
  if (page.cover) {
    return `<section class="page cover-page">${page.body}</section>`;
  }

  return `
    <section class="page body-page">
      <div class="page-banner">함께해요 안전작업, 함께해요 안전한국 · 한국종합안전</div>
      ${page.body}
      <div class="page-number">- ${pageIndex} -</div>
    </section>
  `;
}
