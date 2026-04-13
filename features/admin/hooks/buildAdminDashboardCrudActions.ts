import {
  createSafetyHeadquarter,
  createSafetySite,
  createSafetyUser,
  deactivateSafetyAssignment,
  deleteSafetyHeadquarter,
  deleteSafetySite,
  deleteSafetyUser,
  updateSafetyHeadquarter,
  updateSafetySite,
  updateSafetyUser,
  updateSafetyUserPassword,
} from '@/lib/safetyApi/adminEndpoints';
import { deleteAssignmentsById, hasValues } from '@/features/admin/lib/adminDashboardMutations';
import type {
  ControllerDashboardData,
  SafetyHeadquarterInput,
  SafetyHeadquarterUpdateInput,
  SafetySiteInput,
  SafetySiteUpdateInput,
  SafetyUserCreateInput,
  SafetyUserUpdateInput,
} from '@/types/controller';
import { removeRecordById, upsertRecordById } from './adminDashboardStateShared';

type MutationRunner = <TResult>(
  task: (token: string) => Promise<TResult>,
  successMessage: string,
  options?: {
    applyResult?: (current: ControllerDashboardData, result: TResult) => ControllerDashboardData;
  },
) => Promise<void>;

interface BuildAdminDashboardCrudActionsParams {
  data: ControllerDashboardData;
  runMutation: MutationRunner;
}

export function buildAdminDashboardCrudActions({
  data,
  runMutation,
}: BuildAdminDashboardCrudActionsParams) {
  return {
    createUser: (input: SafetyUserCreateInput) =>
      runMutation((token) => createSafetyUser(token, input), '사용자를 생성했습니다.', {
        applyResult: (current, user) => ({
          ...current,
          users: upsertRecordById(current.users, user),
        }),
      }),
    updateUser: (id: string, input: SafetyUserUpdateInput) =>
      runMutation((token) => updateSafetyUser(token, id, input), '사용자 정보를 수정했습니다.', {
        applyResult: (current, user) => ({
          ...current,
          users: upsertRecordById(current.users, user),
        }),
      }),
    resetUserPassword: (id: string, password: string) =>
      runMutation((token) => updateSafetyUserPassword(token, id, password), '비밀번호를 변경했습니다.'),
    saveUserEdit: (id: string, input: SafetyUserUpdateInput, password?: string | null) =>
      runMutation(
        async (token) => {
          let nextUser = null;
          if (hasValues(input)) {
            nextUser = await updateSafetyUser(token, id, input);
          }
          if (password) {
            await updateSafetyUserPassword(token, id, password);
          }
          return nextUser;
        },
        hasValues(input) && password
          ? '사용자 정보와 비밀번호를 수정했습니다.'
          : password
            ? '비밀번호를 변경했습니다.'
            : '사용자 정보를 수정했습니다.',
        {
          applyResult: (current, user) =>
            user
              ? {
                  ...current,
                  users: upsertRecordById(current.users, user),
                }
              : current,
        },
      ),
    deleteUser: (id: string) =>
      runMutation(
        async (token) => {
          const assignmentIds = data.assignments
            .filter((assignment) => assignment.user_id === id)
            .map((assignment) => assignment.id);
          await deleteAssignmentsById(token, assignmentIds, deactivateSafetyAssignment);
          await deleteSafetyUser(token, id);
          return { userId: id };
        },
        '사용자를 삭제했습니다.',
        {
          applyResult: (current, result) => ({
            ...current,
            users: removeRecordById(current.users, result.userId),
            assignments: current.assignments.filter(
              (assignment) => assignment.user_id !== result.userId,
            ),
          }),
        },
      ),
    createHeadquarter: (input: SafetyHeadquarterInput) =>
      runMutation((token) => createSafetyHeadquarter(token, input), '사업장 정보를 생성했습니다.', {
        applyResult: (current, headquarter) => ({
          ...current,
          headquarters: upsertRecordById(current.headquarters, headquarter),
        }),
      }),
    updateHeadquarter: (id: string, input: SafetyHeadquarterUpdateInput) =>
      runMutation((token) => updateSafetyHeadquarter(token, id, input), '사업장 정보를 수정했습니다.', {
        applyResult: (current, headquarter) => ({
          ...current,
          headquarters: upsertRecordById(current.headquarters, headquarter),
        }),
      }),
    deleteHeadquarter: (id: string) =>
      runMutation(
        async (token) => {
          const relatedSites = data.sites.filter((site) => site.headquarter_id === id);
          const relatedSiteIds = new Set(relatedSites.map((site) => site.id));
          const assignmentIds = data.assignments
            .filter((assignment) => relatedSiteIds.has(assignment.site_id))
            .map((assignment) => assignment.id);
          await deleteAssignmentsById(token, assignmentIds, deactivateSafetyAssignment);
          for (const site of relatedSites) {
            await deleteSafetySite(token, site.id);
          }
          await deleteSafetyHeadquarter(token, id);
          return { headquarterId: id, relatedSiteIds: Array.from(relatedSiteIds) };
        },
        '사업장을 삭제했습니다.',
        {
          applyResult: (current, result) => ({
            ...current,
            headquarters: removeRecordById(current.headquarters, result.headquarterId),
            sites: current.sites.filter((site) => site.headquarter_id !== result.headquarterId),
            assignments: current.assignments.filter(
              (assignment) => !result.relatedSiteIds.includes(assignment.site_id),
            ),
          }),
        },
      ),
    createSite: (input: SafetySiteInput) =>
      runMutation((token) => createSafetySite(token, input), '현장을 생성했습니다.', {
        applyResult: (current, site) => ({
          ...current,
          sites: upsertRecordById(current.sites, site),
        }),
      }),
    updateSite: (id: string, input: SafetySiteUpdateInput) =>
      runMutation((token) => updateSafetySite(token, id, input), '현장 정보를 수정했습니다.', {
        applyResult: (current, site) => ({
          ...current,
          sites: upsertRecordById(current.sites, site),
        }),
      }),
    deleteSite: (id: string) =>
      runMutation(
        async (token) => {
          const assignmentIds = data.assignments
            .filter((assignment) => assignment.site_id === id)
            .map((assignment) => assignment.id);
          await deleteAssignmentsById(token, assignmentIds, deactivateSafetyAssignment);
          await deleteSafetySite(token, id);
          return { siteId: id };
        },
        '현장을 삭제했습니다.',
        {
          applyResult: (current, result) => ({
            ...current,
            sites: current.sites.filter((site) => site.id !== result.siteId),
            assignments: current.assignments.filter(
              (assignment) => assignment.site_id !== result.siteId,
            ),
          }),
        },
      ),
  };
}
