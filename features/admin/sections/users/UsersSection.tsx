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
      email?: string | null;
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

  if (busy && users.length === 0) {
    return (
      <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderTitleBlock}>
            <h2 className={styles.sectionTitle}>사용자</h2>
            <div className={styles.sectionHeaderMeta}>사용자 목록을 불러오는 중입니다.</div>
          </div>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.contentTableSkeleton} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`users-skeleton-${index + 1}`} className={styles.contentTableSkeletonRow}>
                <span className={styles.contentTableSkeletonLine} />
                <span className={`${styles.contentTableSkeletonLine} ${styles.contentTableSkeletonLineMedium}`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const submit = async () => {
    if (!state.form.name.trim()) return;
    if (!state.form.email.trim()) return;

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
        exportUsers={state.sortedUsers}
        filteredUsers={state.pagedUsers}
        onCreateRequest={state.openCreate}
        onDeleteRequest={handleDeleteUser}
        onEditRequest={state.openEdit}
        page={state.page}
        roleFilter={state.roleFilter}
        setPage={state.setPage}
        setRoleFilter={state.setRoleFilter}
        setSort={state.setSort}
        setStatusFilter={state.setStatusFilter}
        setQuery={state.setQuery}
        sort={state.sort}
        statusFilter={state.statusFilter}
        totalCount={state.sortedUsers.length}
        totalPages={state.totalPages}
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
