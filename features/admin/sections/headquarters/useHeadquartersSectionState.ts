'use client';

import { useState } from 'react';
import { useSubmittedSearchState } from '@/hooks/useSubmittedSearchState';
import type { TableSortState } from '@/types/admin';
import type { SafetyHeadquarter } from '@/types/controller';
import { toNullableText } from '@/lib/admin';

export interface HeadquarterFormState {
  address: string;
  business_registration_no: string;
  contact_name: string;
  contact_phone: string;
  corporate_registration_no: string;
  is_active: boolean;
  license_no: string;
  management_number: string;
  name: string;
  opening_number: string;
  memo: string;
}

const EMPTY_FORM: HeadquarterFormState = {
  address: '',
  business_registration_no: '',
  contact_name: '',
  contact_phone: '',
  corporate_registration_no: '',
  is_active: true,
  license_no: '',
  management_number: '',
  name: '',
  opening_number: '',
  memo: '',
};

export function useHeadquartersSectionState(busy: boolean) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'created_at',
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const { query, queryInput, setQueryInput, submitQuery } = useSubmittedSearchState();
  const isOpen = editingId !== null;

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
  };

  const openEdit = (item: SafetyHeadquarter) => {
    setEditingId(item.id);
    setForm({
      address: item.address ?? '',
      business_registration_no: item.business_registration_no ?? '',
      contact_name: item.contact_name ?? '',
      corporate_registration_no: item.corporate_registration_no ?? '',
      license_no: item.license_no ?? '',
      management_number: item.management_number ?? '',
      name: item.name,
      opening_number: item.opening_number ?? '',
      contact_phone: item.contact_phone ?? '',
      is_active: item.is_active,
      memo: item.memo ?? '',
    });
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const isCreateReady = Boolean(form.name.trim());

  const buildPayload = () => ({
    address: toNullableText(form.address),
    business_registration_no: toNullableText(form.business_registration_no),
    contact_name: toNullableText(form.contact_name),
    corporate_registration_no: toNullableText(form.corporate_registration_no),
    license_no: toNullableText(form.license_no),
    name: form.name.trim(),
    management_number: toNullableText(form.management_number),
    opening_number: toNullableText(form.opening_number),
    contact_phone: toNullableText(form.contact_phone),
    is_active: form.is_active,
    memo: toNullableText(form.memo),
  });

  return {
    buildPayload,
    closeModal,
    editingId,
    form,
    isCreateReady,
    isOpen,
    openCreate,
    openEdit,
    page,
    query,
    queryInput,
    setForm,
    setPage: (nextPage: number) => {
      setPage(Math.max(1, nextPage));
    },
    setQueryInput,
    submitQuery: () => {
      setPage(1);
      submitQuery();
    },
    setSort: (value: TableSortState) => {
      setPage(1);
      setSort(value);
    },
    sort,
  };
}
