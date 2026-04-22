import type { SafetyInspectionSchedule } from '@/types/admin';

export type ScheduleDisplayPhase =
  | 'canceled'
  | 'completed'
  | 'in_progress'
  | 'planned'
  | 'postponed';

type SchedulePhaseRow = Pick<
  SafetyInspectionSchedule,
  'actualVisitDate' | 'linkedReportKey' | 'status'
>;

export function getScheduleDisplayPhase(row: SchedulePhaseRow): ScheduleDisplayPhase {
  switch (row.status) {
    case 'completed':
      return 'completed';
    case 'postponed':
      return 'postponed';
    case 'canceled':
      return 'canceled';
    case 'planned': {
      if (row.actualVisitDate) {
        return 'completed';
      }
      if (row.linkedReportKey) {
        return 'in_progress';
      }
      return 'planned';
    }
    default:
      return 'planned';
  }
}

export function getScheduleStatusLabel(row: SchedulePhaseRow) {
  switch (getScheduleDisplayPhase(row)) {
    case 'completed':
      return '완료';
    case 'in_progress':
      return '기술지도 진행중';
    case 'postponed':
      return '연기';
    case 'canceled':
      return '취소';
    case 'planned':
    default:
      return '예정';
  }
}
