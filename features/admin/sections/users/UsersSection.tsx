'use client';

import type { SafetyAdminUserListRow } from '@/types/admin';
import type { SafetyUser } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { toBackendUserRole, toNullableText } from '@/lib/admin';
import { UserEditorModal } from './UserEditorModal';
import { useUsersSectionState } from './useUsersSectionState';
import { UsersTable } from './UsersTable';

interface UsersSectionProps {
  busy: boolean;
  canDelete: boolean;
  currentUserId: string;
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
}

export function UsersSection({
  busy,
  canDelete,
  currentUserId,
  onCreate,
  onDelete,
  onSaveEdit,
  sessions,
}: UsersSectionProps) {
  const state = useUsersSectionState(currentUserId, sessions, busy);

  if (state.isLoading && state.pagedUsers.length === 0) {
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
                <span
                  className={`${styles.contentTableSkeletonLine} ${styles.contentTableSkeletonLineMedium}`}
                />
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
        is_active: state.form.is_active,
        name: state.form.name.trim(),
        organization_name: toNullableText(state.form.organization_name),
        password: state.form.password.trim(),
        phone: toNullableText(state.form.phone),
        position: toNullableText(state.form.position),
        role: toBackendUserRole(state.form.role),
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
    await state.refreshPage();
  };

  const handleDeleteUser = async (user: SafetyAdminUserListRow) => {
    const confirmed = window.confirm(
      `'${user.name}' 사용자를 삭제하시겠습니까?\n연결된 현장 배정도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.`,
    );
    if (!confirmed) return;
    await onDelete(user.id);
    await state.refreshPage();
  };

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <UsersTable
        busy={busy || state.isLoading}
        canDelete={canDelete}
        exportUsers={state.exportUsers}
        filteredUsers={state.pagedUsers}
        onCreateRequest={state.openCreate}
        onDeleteRequest={handleDeleteUser}
        onEditRequest={state.openEdit}
        page={state.page}
        queryInput={state.queryInput}
        roleFilter={state.roleFilter}
        setPage={state.setPage}
        setQuery={state.setQueryInput}
        submitQuery={state.submitQuery}
        setRoleFilter={state.setRoleFilter}
        setSort={state.setSort}
        setStatusFilter={state.setStatusFilter}
        sort={state.sort}
        statusFilter={state.statusFilter}
        totalCount={state.total}
        totalPages={state.totalPages}
        userOverviewById={state.userOverviewById}
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
