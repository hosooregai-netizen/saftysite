'use client';

import type { SafetySite, SafetyUser } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';
import type { SafetyAssignment } from '@/types/controller';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { toBackendUserRole, toNullableText } from '@/lib/admin';
import { UserEditorModal } from './UserEditorModal';
import { useUsersSectionState } from './useUsersSectionState';
import { UsersTable } from './UsersTable';

interface UsersSectionProps {
  assignments: SafetyAssignment[];
  busy: boolean;
  canDelete: boolean;
  onCreate: (input: {
    email: string;
    name: string;
    password: string;
    phone?: string | null;
    role: SafetyUser['role'];
    position?: string | null;
    organization_name?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSaveEdit: (
    id: string,
    input: {
      name?: string | null;
      phone?: string | null;
      role?: SafetyUser['role'];
      position?: string | null;
      organization_name?: string | null;
      is_active?: boolean | null;
    },
    password?: string | null,
  ) => Promise<void>;
  sessions: InspectionSession[];
  sites: SafetySite[];
  users: SafetyUser[];
}

export function UsersSection(props: UsersSectionProps) {
  const { assignments, busy, canDelete, onCreate, onDelete, onSaveEdit, sessions, sites, users } =
    props;
  const state = useUsersSectionState(users, sites, assignments, sessions, busy);

  const submit = async () => {
    if (!state.form.name.trim()) return;

    if (state.editingId === 'create') {
      if (!state.form.email.trim() || !state.form.password.trim()) return;
      await onCreate({
        email: state.form.email.trim(),
        name: state.form.name.trim(),
        password: state.form.password.trim(),
        phone: toNullableText(state.form.phone),
        role: toBackendUserRole(state.form.role),
        position: toNullableText(state.form.position),
        organization_name: toNullableText(state.form.organization_name),
        is_active: state.form.is_active,
      });
    } else if (state.editingId) {
      const updateInput = state.buildUpdateInput();
      const nextPassword = state.form.password.trim() || null;
      if (Object.keys(updateInput).length === 0 && !nextPassword) {
        state.closeModal();
        return;
      }
      await onSaveEdit(state.editingId, updateInput, nextPassword);
    }

    state.closeModal();
  };

  const handleDeleteUser = async (user: SafetyUser) => {
    const confirmed = window.confirm(
      `'${user.name}' 사용자를 삭제하시겠습니까?\n연결된 현장 배정도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.`,
    );

    if (!confirmed) return;
    await onDelete(user.id);
  };

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <UsersTable
        busy={busy}
        canDelete={canDelete}
        filteredUsers={state.filteredUsers}
        onCreateRequest={state.openCreate}
        onDeleteRequest={handleDeleteUser}
        onEditRequest={state.openEdit}
        roleFilter={state.roleFilter}
        setRoleFilter={state.setRoleFilter}
        setStatusFilter={state.setStatusFilter}
        setQuery={state.setQuery}
        statusFilter={state.statusFilter}
        totalUserCount={users.length}
        userOverviewById={state.userOverviewById}
        query={state.query}
      />

      <UserEditorModal
        busy={busy}
        editingId={state.editingId}
        form={state.form}
        onClose={state.closeModal}
        onFormChange={state.setForm}
        onSubmit={submit}
        open={state.isOpen}
      />
    </section>
  );
}

