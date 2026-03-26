'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type { SafetyHeadquarter } from '@/types/controller';
import { toNullableText } from '@/lib/admin';

const EMPTY_FORM = {
  name: '',
  business_registration_no: '',
  corporate_registration_no: '',
  license_no: '',
  contact_name: '',
  contact_phone: '',
  address: '',
  memo: '',
  is_active: true,
};

export function useHeadquartersSectionState(
  headquarters: SafetyHeadquarter[],
  busy: boolean,
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const isOpen = editingId !== null;
  const deferredQuery = useDeferredValue(query);
  const filteredHeadquarters = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) return headquarters;
    return headquarters.filter((item) =>
      [
        item.name,
        item.contact_name ?? '',
        item.contact_phone ?? '',
        item.business_registration_no ?? '',
        item.corporate_registration_no ?? '',
        item.address ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [deferredQuery, headquarters]);

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
  };

  const openEdit = (item: SafetyHeadquarter) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      business_registration_no: item.business_registration_no ?? '',
      corporate_registration_no: item.corporate_registration_no ?? '',
      license_no: item.license_no ?? '',
      contact_name: item.contact_name ?? '',
      contact_phone: item.contact_phone ?? '',
      address: item.address ?? '',
      memo: item.memo ?? '',
      is_active: item.is_active,
    });
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    business_registration_no: toNullableText(form.business_registration_no),
    corporate_registration_no: toNullableText(form.corporate_registration_no),
    license_no: toNullableText(form.license_no),
    contact_name: toNullableText(form.contact_name),
    contact_phone: toNullableText(form.contact_phone),
    address: toNullableText(form.address),
    memo: toNullableText(form.memo),
    is_active: form.is_active,
  });

  return {
    buildPayload,
    closeModal,
    editingId,
    filteredHeadquarters,
    form,
    isOpen,
    openCreate,
    openEdit,
    query,
    setForm,
    setQuery,
  };
}

