import {
  createSafetyAssignment,
  deactivateSafetyAssignment,
  updateSafetyAssignment,
} from '@/lib/safetyApi/adminEndpoints';
import {
  buildAssignmentPayload,
  loadAllSafetyAssignments,
} from '@/features/admin/lib/adminDashboardMutations';
import type {
  ControllerDashboardData,
  SafetyAssignmentInput,
  SafetyAssignmentUpdateInput,
} from '@/types/controller';
import { removeRecordById, upsertRecordById } from './adminDashboardStateShared';

type MutationRunner = <TResult>(
  task: (token: string) => Promise<TResult>,
  successMessage: string,
  options?: {
    applyResult?: (current: ControllerDashboardData, result: TResult) => ControllerDashboardData;
  },
) => Promise<void>;

interface BuildAdminDashboardAssignmentActionsParams {
  data: ControllerDashboardData;
  runMutation: MutationRunner;
}

export function buildAdminDashboardAssignmentActions({
  data,
  runMutation,
}: BuildAdminDashboardAssignmentActionsParams) {
  return {
    createAssignment: (input: SafetyAssignmentInput) =>
      runMutation(
        async (token) => {
          const assignments = await loadAllSafetyAssignments(token);
          const existingAssignment = assignments.find(
            (assignment) =>
              assignment.site_id === input.site_id && assignment.user_id === input.user_id,
          );

          if (existingAssignment) {
            return updateSafetyAssignment(token, existingAssignment.id, {
              role_on_site: input.role_on_site ?? existingAssignment.role_on_site,
              memo: input.memo ?? existingAssignment.memo ?? null,
              is_active: true,
            });
          }

          return createSafetyAssignment(token, input);
        },
        '현장 배정을 생성했습니다.',
        {
          applyResult: (current, assignment) => ({
            ...current,
            assignments: upsertRecordById(current.assignments, assignment),
          }),
        },
      ),
    assignFieldAgentToSite: (
      siteId: string,
      userId: string,
      options?: { roleOnSite?: string; memo?: string | null },
    ) =>
      runMutation(
        async (token) => {
          const assignments = await loadAllSafetyAssignments(token);
          const matchedAssignment = assignments.find(
            (assignment) => assignment.site_id === siteId && assignment.user_id === userId,
          );

          if (matchedAssignment) {
            if (matchedAssignment.is_active) {
              return matchedAssignment;
            }

            return updateSafetyAssignment(token, matchedAssignment.id, {
              ...buildAssignmentPayload('현장 지도요원', options, matchedAssignment),
              is_active: true,
            });
          }

          return createSafetyAssignment(token, {
            site_id: siteId,
            user_id: userId,
            ...buildAssignmentPayload('현장 지도요원', options),
          });
        },
        '지도요원을 배정했습니다.',
        {
          applyResult: (current, assignment) => ({
            ...current,
            assignments: upsertRecordById(current.assignments, assignment),
          }),
        },
      ),
    unassignFieldAgentFromSite: (siteId: string, userId: string) =>
      runMutation(
        async (token) => {
          const assignments = await loadAllSafetyAssignments(token);
          const matchedAssignment = assignments.find(
            (assignment) =>
              assignment.site_id === siteId &&
              assignment.user_id === userId &&
              assignment.is_active,
          );

          if (!matchedAssignment) {
            return null;
          }

          await deactivateSafetyAssignment(token, matchedAssignment.id);
          return { assignmentId: matchedAssignment.id };
        },
        '지도요원 배정을 해제했습니다.',
        {
          applyResult: (current, result) =>
            result
              ? {
                  ...current,
                  assignments: removeRecordById(current.assignments, result.assignmentId),
                }
              : current,
        },
      ),
    updateAssignment: (id: string, input: SafetyAssignmentUpdateInput) =>
      runMutation((token) => updateSafetyAssignment(token, id, input), '배정 정보를 수정했습니다.', {
        applyResult: (current, assignment) => ({
          ...current,
          assignments: upsertRecordById(current.assignments, assignment),
        }),
      }),
    deactivateAssignment: (id: string) =>
      runMutation((token) => deactivateSafetyAssignment(token, id), '배정을 비활성화했습니다.', {
        applyResult: (current, assignment) => ({
          ...current,
          assignments: removeRecordById(current.assignments, assignment.id),
        }),
      }),
  };
}
