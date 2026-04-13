export type QuarterlyListSortMode = 'number' | 'recent' | 'name' | 'period';

export interface QuarterlyListRow {
  sequenceNumber: number;
  href: string;
  reportId: string;
  reportTitle: string;
  quarterLabel: string;
  selectedCount: number;
  updatedAt: string;
  periodStartDate: string;
  periodEndDate: string;
  periodLabel: string;
}

export interface CreateQuarterlyReportForm {
  title: string;
  periodStartDate: string;
  periodEndDate: string;
}

export const EMPTY_CREATE_FORM: CreateQuarterlyReportForm = {
  title: '',
  periodStartDate: '',
  periodEndDate: '',
};
