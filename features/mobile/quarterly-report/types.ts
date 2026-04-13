import type { SafetyQuarterlySummarySeedSourceReport } from '@/types/backend';
import type { QuarterlySummaryReport } from '@/types/erpReports';

export type MobileQuarterlyStepId =
  | 'overview'
  | 'snapshot'
  | 'analysis'
  | 'implementation'
  | 'countermeasures';

export const MOBILE_QUARTERLY_STEPS: Array<{ id: MobileQuarterlyStepId; label: string }> = [
  { id: 'overview', label: '기본' },
  { id: 'snapshot', label: '사업장' },
  { id: 'analysis', label: '분석' },
  { id: 'implementation', label: '이행' },
  { id: 'countermeasures', label: '대책' },
];

export const MOBILE_QUARTERLY_SNAPSHOT_FIELDS: Array<{
  key: keyof QuarterlySummaryReport['siteSnapshot'];
  label: string;
}> = [
  { key: 'siteName', label: '현장명' },
  { key: 'customerName', label: '발주처' },
  { key: 'assigneeName', label: '담당자' },
  { key: 'constructionPeriod', label: '공사기간' },
  { key: 'constructionAmount', label: '공사금액' },
  { key: 'siteManagerName', label: '현장소장' },
  { key: 'siteManagerPhone', label: '현장 연락처' },
  { key: 'siteAddress', label: '현장 주소' },
];

export const MOBILE_QUARTERLY_SNAPSHOT_WIDE_FIELDS = new Set<
  keyof QuarterlySummaryReport['siteSnapshot']
>(['constructionPeriod', 'siteAddress']);

export interface MobileQuarterlyOpsAsset {
  body: unknown;
  id: string;
  title: string;
}

export type MobileQuarterlySourceReport = SafetyQuarterlySummarySeedSourceReport;
