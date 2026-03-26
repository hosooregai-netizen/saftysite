'use client';

import type { SafetyHeadquarter } from '@/types/controller';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { useHeadquartersSectionState } from './useHeadquartersSectionState';
import { HeadquartersTable } from './HeadquartersTable';
import { HeadquarterEditorModal } from './HeadquarterEditorModal';

interface HeadquartersSectionProps {
  busy: boolean;
  canDelete: boolean;
  headquarters: SafetyHeadquarter[];
  onCreate: (input: {
    name: string;
    business_registration_no?: string | null;
    corporate_registration_no?: string | null;
    license_no?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    memo?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (
    id: string,
    input: Partial<{
      name: string;
      business_registration_no?: string | null;
      corporate_registration_no?: string | null;
      license_no?: string | null;
      contact_name?: string | null;
      contact_phone?: string | null;
      address?: string | null;
      memo?: string | null;
      is_active?: boolean;
    }>,
  ) => Promise<void>;
}

export function HeadquartersSection(props: HeadquartersSectionProps) {
  const { busy, canDelete, headquarters, onCreate, onDelete, onUpdate } = props;
  const state = useHeadquartersSectionState(headquarters, busy);

  const submit = async () => {
    if (!state.form.name.trim()) return;
    const payload = state.buildPayload();
    if (state.editingId === 'create') {
      await onCreate(payload);
    } else if (state.editingId) {
      await onUpdate(state.editingId, payload);
    }
    state.closeModal();
  };

  const handleDeleteHeadquarter = async (item: SafetyHeadquarter) => {
    const confirmed = window.confirm(
      `'${item.name}' 사업장을 삭제하시겠습니까?\n연결된 현장과 현장 배정도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.`,
    );

    if (!confirmed) return;
    await onDelete(item.id);
  };

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <HeadquartersTable
        busy={busy}
        canDelete={canDelete}
        filteredHeadquarters={state.filteredHeadquarters}
        onCreateRequest={state.openCreate}
        onDeleteRequest={handleDeleteHeadquarter}
        onEditRequest={state.openEdit}
        onQueryChange={state.setQuery}
        query={state.query}
        totalHeadquarterCount={headquarters.length}
      />

      <HeadquarterEditorModal
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

