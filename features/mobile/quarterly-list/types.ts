export interface CreateQuarterlyReportForm {
  title: string;
  periodStartDate: string;
  periodEndDate: string;
}

export type MobileQuarterlyListSortMode = 'recent' | 'name' | 'period';

export interface MobileQuarterlyListRow {
  href: string;
  quarterLabel: string;
  periodEndDate: string;
  periodLabel: string;
  periodStartDate: string;
  reportId: string;
  reportTitle: string;
  updatedAt: string;
}

export const EMPTY_CREATE_FORM: CreateQuarterlyReportForm = {
  title: '',
  periodStartDate: '',
  periodEndDate: '',
};
