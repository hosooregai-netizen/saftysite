import {
  fetchSafetyReportByKey,
  upsertSafetyReport,
} from '@/lib/safetyApi';
import {
  createSafetyContentItem,
  deleteSafetyContentItem,
  updateSafetyContentItem,
} from '@/lib/safetyApi/adminEndpoints';
import type {
  ControllerDashboardData,
  SafetyContentItemInput,
  SafetyContentItemUpdateInput,
} from '@/types/controller';
import { upsertRecordById } from './adminDashboardStateShared';

type MutationRunner = <TResult>(
  task: (token: string) => Promise<TResult>,
  successMessage: string,
  options?: {
    applyResult?: (current: ControllerDashboardData, result: TResult) => ControllerDashboardData;
  },
) => Promise<TResult>;

interface BuildAdminDashboardContentActionsParams {
  runContentMutation: MutationRunner;
  runMutation: MutationRunner;
}

export function buildAdminDashboardContentActions({
  runContentMutation,
  runMutation,
}: BuildAdminDashboardContentActionsParams) {
  return {
    createContentItem: (input: SafetyContentItemInput) =>
      runContentMutation((token) => createSafetyContentItem(token, input), '콘텐츠 데이터를 생성했습니다.', {
        applyResult: (current, item) => ({
          ...current,
          contentItems: upsertRecordById(current.contentItems, item),
        }),
      }),
    updateContentItem: (id: string, input: SafetyContentItemUpdateInput) =>
      runContentMutation((token) => updateSafetyContentItem(token, id, input), '콘텐츠 데이터를 수정했습니다.', {
        applyResult: (current, item) => ({
          ...current,
          contentItems: upsertRecordById(current.contentItems, item),
        }),
      }),
    deleteContentItem: (id: string) =>
      runContentMutation((token) => deleteSafetyContentItem(token, id), '콘텐츠 데이터를 삭제했습니다.', {
        applyResult: (current, item) => ({
          ...current,
          contentItems: upsertRecordById(current.contentItems, item),
        }),
      }),
    saveReportMeta: (
      reportKey: string,
      metaPatch: Record<string, unknown>,
      successMessage = '보고서 관리 정보를 저장했습니다.',
    ) =>
      runMutation(
        async (token) => {
          const report = await fetchSafetyReportByKey(token, reportKey);
          return upsertSafetyReport(token, {
            report_key: report.report_key,
            report_title: report.report_title,
            site_id: report.site_id,
            headquarter_id: report.headquarter_id,
            assigned_user_id: report.assigned_user_id,
            visit_date: report.visit_date,
            visit_round: report.visit_round,
            total_round: report.total_round,
            progress_rate: report.progress_rate,
            payload: report.payload,
            meta: {
              ...report.meta,
              ...metaPatch,
            },
            status: report.status,
            create_revision: false,
            revision_reason: 'manual_save',
          });
        },
        successMessage,
      ),
  };
}
