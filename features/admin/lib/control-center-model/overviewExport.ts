import { getDispatchStatusLabel } from '@/lib/admin/reportMeta';
import type { AdminOverviewModel } from './types';

export function getOverviewExportSheets(model: AdminOverviewModel) {
  return [
    {
      name: 'overview',
      columns: [
        { key: 'label', label: '항목' },
        { key: 'value', label: '값' },
        { key: 'meta', label: '기준' },
      ],
      rows: model.summaryRows,
    },
    {
      name: 'site-status',
      columns: [
        { key: 'label', label: '구분' },
        { key: 'count', label: '현장 수' },
      ],
      rows: model.siteStatusSummary.entries.map((entry) => ({ count: entry.count, label: entry.label })),
    },
    {
      name: 'deadline-signal-status',
      columns: [
        { key: 'label', label: '구분' },
        { key: 'count', label: '보고서 수' },
      ],
      rows: model.deadlineSignalSummary.entries.map((entry) => ({ count: entry.count, label: entry.label })),
    },
    {
      name: 'quarterly-material-status',
      columns: [
        { key: 'label', label: '구분' },
        { key: 'count', label: '현장 수' },
      ],
      rows: model.quarterlyMaterialSummary.entries.map((entry) => ({ count: entry.count, label: entry.label })),
    },
    {
      name: 'quarterly-material-missing-sites',
      columns: [
        { key: 'siteName', label: '현장' },
        { key: 'headquarterName', label: '사업장' },
        { key: 'quarterLabel', label: '분기' },
        { key: 'educationStatus', label: '교육 현황' },
        { key: 'measurementStatus', label: '계측 현황' },
        { key: 'educationMissing', label: '교육 부족' },
        { key: 'measurementMissing', label: '계측 부족' },
        { key: 'missingTotal', label: '총 부족' },
      ],
      rows: model.quarterlyMaterialSummary.missingSiteRows.map((row) => ({
        educationStatus: `${row.education.filledCount}/${row.education.requiredCount}`,
        educationMissing: `${row.education.missingCount}건`,
        headquarterName: row.headquarterName,
        measurementStatus: `${row.measurement.filledCount}/${row.measurement.requiredCount}`,
        measurementMissing: `${row.measurement.missingCount}건`,
        missingTotal: `${row.education.missingCount + row.measurement.missingCount}건`,
        quarterLabel: row.quarterLabel,
        siteName: row.siteName,
      })),
    },
    {
      name: 'unsent-reports',
      columns: [
        { key: 'siteName', label: '현장' },
        { key: 'headquarterName', label: '사업장' },
        { key: 'reportTitle', label: '보고서' },
        { key: 'reportTypeLabel', label: '유형' },
        { key: 'assigneeName', label: '담당자' },
        { key: 'visitDate', label: '지도 실시일' },
        { key: 'unsentDays', label: '미발송 경과일' },
        { key: 'deadlineDate', label: '발송 기준일' },
        { key: 'dispatchStatus', label: '상태' },
      ],
      rows: model.unsentReportRows.map((row) => ({
        assigneeName: row.assigneeName,
        deadlineDate: row.deadlineDate,
        dispatchStatus: getDispatchStatusLabel(row.dispatchStatus),
        headquarterName: row.headquarterName,
        reportTitle: row.reportTitle,
        reportTypeLabel: row.reportTypeLabel,
        siteName: row.siteName,
        unsentDays: `D+${row.unsentDays}`,
        visitDate: row.visitDate,
      })),
    },
  ];
}
