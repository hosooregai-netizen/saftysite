'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSubmittedSearchState } from '@/hooks/useSubmittedSearchState';
import {
  readEnumParam,
  readNumberParam,
  readStringParam,
  useUrlQueryUpdater,
} from '@/hooks/useUrlQueryState';
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

const HEADQUARTER_LIST_QUERY_DEFAULTS = {
  hqDir: 'desc',
  hqPage: 1,
  hqQuery: '',
  hqSort: 'created_at',
};

function buildNormalizedPayload(form: HeadquarterFormState) {
  return {
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
  };
}

export function useHeadquartersSectionState(busy: boolean) {
  const searchParams = useSearchParams();
  const updateUrlQuery = useUrlQueryUpdater();
  const initialQuery = readStringParam(searchParams, 'hqQuery');
  const urlPage = readNumberParam(searchParams, 'hqPage', 1, 1);
  const urlSort = useMemo<TableSortState>(
    () => ({
      direction: readEnumParam(searchParams, 'hqDir', ['asc', 'desc'] as const, 'desc'),
      key: readStringParam(searchParams, 'hqSort', 'created_at'),
    }),
    [searchParams],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPageState] = useState(urlPage);
  const [sort, setSortState] = useState<TableSortState>(urlSort);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const { query, queryInput, setQueryInput, submitQuery } = useSubmittedSearchState(initialQuery);
  const isOpen = editingId !== null;

  useEffect(() => {
    setPageState(urlPage);
  }, [urlPage]);

  useEffect(() => {
    setSortState(urlSort);
  }, [urlSort]);

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
  };

  const openEdit = (item: SafetyHeadquarter) => {
    const nextForm = {
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
    };
    setEditingId(item.id);
    setForm(nextForm);
    setInitialForm(nextForm);
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
  };

  const isCreateReady = Boolean(form.name.trim());

  const buildPayload = () => buildNormalizedPayload(form);

  const buildUpdatePayload = () => {
    const next = buildNormalizedPayload(form);
    const previous = buildNormalizedPayload(initialForm);
    return Object.fromEntries(
      Object.entries(next).filter(
        ([key, value]) => previous[key as keyof typeof previous] !== value,
      ),
    ) as Partial<ReturnType<typeof buildNormalizedPayload>>;
  };

  return {
    buildUpdatePayload,
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
      const nextPageValue = Math.max(1, nextPage);
      setPageState(nextPageValue);
      updateUrlQuery({ hqPage: nextPageValue }, HEADQUARTER_LIST_QUERY_DEFAULTS);
    },
    setQueryInput,
    submitQuery: () => {
      const nextQuery = submitQuery();
      setPageState(1);
      updateUrlQuery(
        { hqPage: 1, hqQuery: nextQuery },
        HEADQUARTER_LIST_QUERY_DEFAULTS,
      );
    },
    setSort: (value: TableSortState) => {
      setPageState(1);
      setSortState(value);
      updateUrlQuery(
        { hqDir: value.direction, hqPage: 1, hqSort: value.key },
        HEADQUARTER_LIST_QUERY_DEFAULTS,
      );
    },
    sort,
  };
}
