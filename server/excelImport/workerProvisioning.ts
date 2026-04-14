import type { SafetyUser, SafetySite } from '@/types/backend';
import type { SafetyAssignment } from '@/types/controller';
import {
  createAdminAssignment,
  createAdminUser,
  updateAdminAssignment,
} from '@/server/admin/safetyApiServer';

export interface ExcelWorkerProvisionResult {
  assignments: SafetyAssignment[];
  createdAssignment: boolean;
  createdPlaceholderUser: boolean;
  matchedExistingUser: boolean;
  matchedUserEmail: string;
  matchedUserId: string;
  message: string;
  status: string;
  user: SafetyUser | null;
  users: SafetyUser[];
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeKey(value: unknown) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, ' ');
}

function slugify(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'field-agent';
}

function buildPlaceholderEmail(name: string, siteId: string, rowIndex: number) {
  return `excel-field-agent-${slugify(name)}-${slugify(siteId)}-${rowIndex}@placeholder.local`;
}

function buildNameMatches(users: SafetyUser[], guidanceOfficerName: string) {
  const normalizedName = normalizeKey(guidanceOfficerName);
  if (!normalizedName) return [];
  return users.filter((user) => normalizeKey(user.name) === normalizedName);
}

function buildExistingAssignment(
  assignments: SafetyAssignment[],
  siteId: string,
  userId: string,
) {
  return (
    assignments.find(
      (assignment) => assignment.site_id === siteId && assignment.user_id === userId && assignment.is_active,
    ) ??
    assignments.find(
      (assignment) => assignment.site_id === siteId && assignment.user_id === userId,
    ) ??
    null
  );
}

export async function provisionExcelWorkerAssignment(
  token: string,
  request: Request,
  input: {
    assignments: SafetyAssignment[];
    guidanceOfficerName: string;
    rowIndex: number;
    site: SafetySite;
    users: SafetyUser[];
  },
): Promise<ExcelWorkerProvisionResult> {
  const guidanceOfficerName = normalizeText(input.guidanceOfficerName);
  if (!guidanceOfficerName) {
    return {
      assignments: input.assignments,
      createdAssignment: false,
      createdPlaceholderUser: false,
      matchedExistingUser: false,
      matchedUserEmail: '',
      matchedUserId: '',
      message: '지도요원명이 없어 사용자/배정을 건너뛰었습니다.',
      status: 'missing_name',
      user: null,
      users: input.users,
    };
  }

  const nameMatches = buildNameMatches(input.users, guidanceOfficerName);
  if (nameMatches.length > 1) {
    return {
      assignments: input.assignments,
      createdAssignment: false,
      createdPlaceholderUser: false,
      matchedExistingUser: false,
      matchedUserEmail: '',
      matchedUserId: '',
      message: '동명이인 후보가 있어 지도요원 자동 연결을 건너뛰었습니다.',
      status: 'ambiguous',
      user: null,
      users: input.users,
    };
  }

  let users = input.users;
  let user = nameMatches[0] ?? null;
  let matchedExistingUser = Boolean(user);
  let createdPlaceholderUser = false;

  if (!user) {
    user = await createAdminUser(
      token,
      {
        auto_provisioned_from_excel: true,
        email: buildPlaceholderEmail(guidanceOfficerName, input.site.id, input.rowIndex),
        is_active: true,
        name: guidanceOfficerName,
        organization_name:
          input.site.headquarter_detail?.name || input.site.headquarter?.name || null,
        password: `ExcelImport!${Date.now()}`,
        position: '지도요원',
        role: 'field_agent',
      },
      request,
    );
    users = [...input.users, user];
    createdPlaceholderUser = true;
    matchedExistingUser = false;
  }

  const existingAssignment = buildExistingAssignment(input.assignments, input.site.id, user.id);
  let assignments = input.assignments;
  let createdAssignment = false;

  if (!existingAssignment) {
    const createdAssignmentRecord = await createAdminAssignment(
      token,
      {
        memo: '엑셀 지도요원 자동 연결',
        role_on_site: '현장 지도요원',
        site_id: input.site.id,
        user_id: user.id,
      },
      request,
    );
    assignments = [...input.assignments, createdAssignmentRecord];
    createdAssignment = true;
  } else if (!existingAssignment.is_active) {
    const updatedAssignment = await updateAdminAssignment(
      token,
      existingAssignment.id,
      {
        is_active: true,
        memo: existingAssignment.memo || '엑셀 지도요원 자동 연결',
        role_on_site: existingAssignment.role_on_site || '현장 지도요원',
      },
      request,
    );
    assignments = input.assignments.map((assignment) =>
      assignment.id === updatedAssignment.id ? updatedAssignment : assignment,
    );
    createdAssignment = true;
  }

  return {
    assignments,
    createdAssignment,
    createdPlaceholderUser,
    matchedExistingUser,
    matchedUserEmail: normalizeText(user.email),
    matchedUserId: user.id,
    message: createdPlaceholderUser
      ? '지도요원 가계정을 생성하고 현장 배정을 연결했습니다.'
      : createdAssignment
        ? '기존 지도요원을 현장에 연결했습니다.'
        : '기존 지도요원과 배정을 그대로 사용했습니다.',
    status: createdPlaceholderUser ? 'created_placeholder' : 'matched_existing',
    user,
    users,
  };
}
