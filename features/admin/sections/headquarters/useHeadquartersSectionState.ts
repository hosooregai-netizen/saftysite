'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type { TableSortState } from '@/types/admin';
import type { SafetyHeadquarter } from '@/types/controller';
import { toNullableText } from '@/lib/admin';

const EMPTY_FORM = {
  management_number: '',
  opening_number: '',
  name: '',
  contact_phone: '',
  is_active: true,
};

export function useHeadquartersSectionState(
  headquarters: SafetyHeadquarter[],
  busy: boolean,
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<TableSortState>({
    direction: 'asc',
    key: 'name',
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const isOpen = editingId !== null;
  const deferredQuery = useDeferredValue(query);
  const filteredHeadquarters = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) return headquarters;
    return headquarters.filter((item) =>
      [
        item.name,
        item.management_number ?? '',
        item.opening_number ?? '',
        item.contact_phone ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [deferredQuery, headquarters]);
  const sortedHeadquarters = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1;

    return [...filteredHeadquarters].sort((left, right) => {
      if (sort.key === 'updated_at') {
        return left.updated_at.localeCompare(right.updated_at) * direction;
      }

      if (sort.key === 'contact_phone') {
        return (left.contact_phone ?? '').localeCompare(right.contact_phone ?? '', 'ko') * direction;
      }

      return left.name.localeCompare(right.name, 'ko') * direction;
    });
  }, [filteredHeadquarters, sort.direction, sort.key]);

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
  };

  const openEdit = (item: SafetyHeadquarter) => {
    setEditingId(item.id);
    setForm({
      management_number: item.management_number ?? '',
      opening_number: item.opening_number ?? '',
      name: item.name,
      contact_phone: item.contact_phone ?? '',
      is_active: item.is_active,
    });
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const isCreateReady = Boolean(
    form.name.trim() &&
      form.management_number.trim() &&
      form.opening_number.trim() &&
      form.contact_phone.trim() &&
      true,
  );

  const buildPayload = () => ({
    name: form.name.trim(),
    management_number: toNullableText(form.management_number),
    opening_number: toNullableText(form.opening_number),
    contact_phone: toNullableText(form.contact_phone),
    is_active: form.is_active,
  });

  return {
    buildPayload,
    closeModal,
    editingId,
    filteredHeadquarters,
    form,
    isCreateReady,
    isOpen,
    openCreate,
    openEdit,
    query,
    setForm,
    setQuery,
    setSort,
    sort,
    sortedHeadquarters,
  };
}
