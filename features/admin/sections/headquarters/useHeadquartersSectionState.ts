'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type { SafetyHeadquarter } from '@/types/controller';
import { toNullableText } from '@/lib/admin';

const EMPTY_FORM = {
  name: '',
  license_no: '',
  contact_phone: '',
  address: '',
  is_active: true,
  registration_number: '',
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
      license_no: item.license_no ?? '',
      contact_phone: item.contact_phone ?? '',
      address: item.address ?? '',
      is_active: item.is_active,
      registration_number:
        item.corporate_registration_no ??
        item.business_registration_no ??
        '',
    });
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const isCreateReady = Boolean(
    form.name.trim() &&
      form.registration_number.trim() &&
      form.license_no.trim() &&
      form.contact_phone.trim() &&
      form.address.trim(),
  );

  const buildPayload = () => ({
    name: form.name.trim(),
    business_registration_no: toNullableText(form.registration_number),
    corporate_registration_no: toNullableText(form.registration_number),
    license_no: toNullableText(form.license_no),
    contact_phone: toNullableText(form.contact_phone),
    address: toNullableText(form.address),
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
  };
}
