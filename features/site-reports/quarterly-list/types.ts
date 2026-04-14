export type QuarterlyListSortMode = 'number' | 'recent' | 'name' | 'period';
export type QuarterlyListDispatchFilter = 'all' | 'pending' | 'completed';

export interface QuarterlyListRow {
  dispatchCompleted: boolean;
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
