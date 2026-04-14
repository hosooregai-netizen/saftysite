'use client';

import { useDeferredValue, useMemo, useState } from 'react';
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

const HEADQUARTERS_PAGE_SIZE = 30;

function isPinnedTestHeadquarter(item: SafetyHeadquarter) {
  return item.name.includes('테스트');
}

export function useHeadquartersSectionState(
  headquarters: SafetyHeadquarter[],
  busy: boolean,
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
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
        item.business_registration_no ?? '',
        item.corporate_registration_no ?? '',
        item.license_no ?? '',
        item.contact_name ?? '',
        item.contact_phone ?? '',
        item.address ?? '',
        item.memo ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [deferredQuery, headquarters]);
  const sortedHeadquarters = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1;

    return [...filteredHeadquarters].sort((left, right) => {
      const leftPinned = isPinnedTestHeadquarter(left);
      const rightPinned = isPinnedTestHeadquarter(right);
      if (leftPinned !== rightPinned) {
        return leftPinned ? -1 : 1;
      }

      if (sort.key === 'updated_at') {
        return left.updated_at.localeCompare(right.updated_at) * direction;
      }

      if (sort.key === 'contact_phone') {
        return (left.contact_phone ?? '').localeCompare(right.contact_phone ?? '', 'ko') * direction;
      }

      return left.name.localeCompare(right.name, 'ko') * direction;
    });
  }, [filteredHeadquarters, sort.direction, sort.key]);
  const totalPages = Math.max(1, Math.ceil(sortedHeadquarters.length / HEADQUARTERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedHeadquarters = useMemo(() => {
    const offset = (currentPage - 1) * HEADQUARTERS_PAGE_SIZE;
    return sortedHeadquarters.slice(offset, offset + HEADQUARTERS_PAGE_SIZE);
  }, [currentPage, sortedHeadquarters]);

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
    filteredHeadquarters,
    form,
    isCreateReady,
    isOpen,
    openCreate,
    openEdit,
    page: currentPage,
    pagedHeadquarters,
    query,
    setForm,
    setPage: (nextPage: number) => {
      setPage(Math.max(1, Math.min(nextPage, totalPages)));
    },
    setQuery: (value: string) => {
      setPage(1);
      setQuery(value);
    },
    setSort: (value: TableSortState) => {
      setPage(1);
      setSort(value);
    },
    sort,
    sortedHeadquarters,
    totalPages,
  };
}
