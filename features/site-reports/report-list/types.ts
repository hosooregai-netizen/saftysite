export type SiteReportSortMode = 'round' | 'name' | 'progress';
export type SiteReportDispatchFilter = 'all' | 'pending' | 'completed';

export interface CreateSiteReportInput {
  reportDate: string;
  reportTitle: string;
}

export interface CreateReportFormState {
  reportDate: string;
  reportTitle: string;
}

export const EMPTY_CREATE_REPORT_FORM: CreateReportFormState = {
  reportDate: '',
  reportTitle: '',
};
