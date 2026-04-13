import type { InspectionReportListItem } from '@/types/inspectionSession';

export interface CreateMobileReportForm {
  reportDate: string;
  reportTitle: string;
}

export interface MobileReportCardModel {
  progressLabel: string;
  progressRate: number;
  visitDateLabel: string;
  drafterDisplay: string;
  item: InspectionReportListItem;
}

export const EMPTY_CREATE_FORM: CreateMobileReportForm = {
  reportDate: '',
  reportTitle: '',
};
