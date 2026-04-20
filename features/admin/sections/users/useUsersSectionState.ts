'use client';

import { useSearchParams } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSubmittedSearchState } from '@/hooks/useSubmittedSearchState';
import {
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/features/admin/lib/adminSessionCache';
import { fetchAdminUsersList } from '@/lib/admin/apiClient';
import { getSessionTitle } from '@/constants/inspectionSession';
import type { SafetyAdminUserListResponse, TableSortState } from '@/types/admin';
import type { InspectionSession } from '@/types/inspectionSession';
import {
  toBackendUserRole,
  toNullableText,
  toUserRoleView,
  type UserRoleView,
} from '@/lib/admin';

const EMPTY_FORM = {
  email: '',
  name: '',
  password: '',
  phone: '',
  role: 'field_agent' as UserRoleView,
  position: '',
  organization_name: '',
  is_active: true,
};

const USERS_PAGE_SIZE = 50;
const EMPTY_USER_ROWS: SafetyAdminUserListResponse['rows'] = [];

function buildRequestKey(input: {
  page: number;
  query: string;
  roleFilter: 'all' | UserRoleView;
  sort: TableSortState;
}) {
  return JSON.stringify(input);
}

export function useUsersSectionState(
  currentUserId: string,
  sessions: InspectionSession[],
  busy: boolean,
) {
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const {
    query,
    queryInput,
    setQueryInput,
    submitQuery,
  } = useSubmittedSearchState(searchParams.get('query') || '');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRoleView>(() => {
    const value = searchParams.get('role');
    return value === 'admin' || value === 'field_agent' ? value : 'all';
  });
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<TableSortState>({
    direction: 'asc',
    key: 'name',
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [editingRoleSource, setEditingRoleSource] =
    useState<import('@/types/backend').SafetyUser['role']>('field_agent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOpen = editingId !== null;
  const deferredQuery = useDeferredValue(query);
  const requestKey = useMemo(
    () =>
      buildRequestKey({
        page,
        query: deferredQuery.trim(),
        roleFilter,
        sort,
      }),
    [deferredQuery, page, roleFilter, sort],
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const cachedResponse = useMemo(
    () =>
      readAdminSessionCache<SafetyAdminUserListResponse>(
        currentUserId,
        `users:list:${requestKey}`,
      ),
    [currentUserId, requestKey],
  );
  const [resolvedResponseState, setResolvedResponseState] = useState<{
    requestKey: string;
    response: SafetyAdminUserListResponse;
  } | null>(null);
  const currentResponse =
    useMemo(
      () =>
        (resolvedResponseState?.requestKey === requestKey ? resolvedResponseState.response : null) ??
        cachedResponse.value ??
        resolvedResponseState?.response ??
        null,
      [cachedResponse.value, requestKey, resolvedResponseState],
    );
  const rows = currentResponse?.rows ?? EMPTY_USER_ROWS;
  const total = currentResponse?.total ?? 0;

  useEffect(() => {
    if (cachedResponse.isFresh && cachedResponse.value) {
      queueMicrotask(() => {
        setLoading(false);
      });
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setLoading(true);
    setError(null);

    const requestedSortKey = sort.key === 'reportCount' ? 'name' : sort.key;

    void fetchAdminUsersList(
      {
        limit: USERS_PAGE_SIZE,
        offset: (page - 1) * USERS_PAGE_SIZE,
        query: deferredQuery.trim(),
        role: roleFilter,
        sortBy: requestedSortKey,
        sortDir: sort.direction,
      },
      { signal: abortController.signal },
    )
      .then((response) => {
        writeAdminSessionCache(currentUserId, `users:list:${requestKey}`, response);
        setResolvedResponseState({
          requestKey,
          response,
        });
      })
      .catch((nextError) => {
        if (abortController.signal.aborted) return;
        setError(nextError instanceof Error ? nextError.message : '사용자 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [
    cachedResponse.isFresh,
    cachedResponse.value,
    currentUserId,
    deferredQuery,
    page,
    requestKey,
    roleFilter,
    sort.direction,
    sort.key,
  ]);

  const sessionCountBySiteId = useMemo(() => {
    const next = new Map<string, number>();
    sessions.forEach((session) => {
      next.set(session.siteKey, (next.get(session.siteKey) || 0) + 1);
    });
    return next;
  }, [sessions]);

  const latestSessionBySiteId = useMemo(() => {
    const next = new Map<string, InspectionSession>();
    sessions.forEach((session) => {
      const current = next.get(session.siteKey);
      if (!current || current.updatedAt.localeCompare(session.updatedAt) < 0) {
        next.set(session.siteKey, session);
      }
    });
    return next;
  }, [sessions]);

  const userOverviewById = useMemo(() => {
    const next = new Map<
      string,
      {
        assignedSites: Array<{ id: string; siteName: string }>;
        latestSession: InspectionSession | null;
        reportCount: number;
      }
    >();

    rows.forEach((user) => {
      const assignedSites = user.assignedSites ?? [];
      const latestSession =
        assignedSites
          .map((site) => latestSessionBySiteId.get(site.id) || null)
          .filter(Boolean)
          .sort((left, right) => right!.updatedAt.localeCompare(left!.updatedAt))[0] || null;
      const reportCount = assignedSites.reduce(
        (count, site) => count + (sessionCountBySiteId.get(site.id) || 0),
        0,
      );
      next.set(user.id, {
        assignedSites,
        latestSession,
        reportCount,
      });
    });

    return next;
  }, [latestSessionBySiteId, rows, sessionCountBySiteId]);

  const pagedUsers = useMemo(() => {
    if (sort.key !== 'reportCount') return rows;
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => {
      const leftCount = userOverviewById.get(left.id)?.reportCount ?? 0;
      const rightCount = userOverviewById.get(right.id)?.reportCount ?? 0;
      return (leftCount - rightCount) * direction;
    });
  }, [rows, sort.direction, sort.key, userOverviewById]);

  const totalPages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setEditingRoleSource('field_agent');
  };

  const openEdit = (user: import('@/types/admin').SafetyAdminUserListRow) => {
    const nextForm = {
      email: user.email,
      name: user.name,
      password: '',
      phone: user.phone ?? '',
      role: toUserRoleView(user.role),
      position: user.position ?? '',
      organization_name: user.organization_name ?? '',
      is_active: user.is_active,
    };

    setEditingId(user.id);
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditingRoleSource(user.role);
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setEditingRoleSource('field_agent');
  };

  const buildUpdateInput = () => {
    const nextRole =
      form.role !== initialForm.role
        ? toBackendUserRole(form.role, editingRoleSource)
        : undefined;
    const next = {
      email: form.email.trim().toLowerCase(),
      name: form.name.trim(),
      phone: toNullableText(form.phone),
      role: nextRole,
      position: toNullableText(form.position),
      organization_name: toNullableText(form.organization_name),
      is_active: form.is_active,
    };
    const previous = {
      email: initialForm.email.trim().toLowerCase(),
      name: initialForm.name.trim(),
      phone: toNullableText(initialForm.phone),
      role: initialForm.role,
      position: toNullableText(initialForm.position),
      organization_name: toNullableText(initialForm.organization_name),
      is_active: initialForm.is_active,
    };

    return Object.fromEntries(
      Object.entries(next).filter(
        ([key, value]) =>
          value !== undefined && previous[key as keyof typeof previous] !== value,
      ),
    ) as {
      email?: string | null;
      name?: string | null;
      phone?: string | null;
      role?: import('@/types/backend').SafetyUser['role'];
      position?: string | null;
      organization_name?: string | null;
      is_active?: boolean | null;
    };
  };

  const refreshPage = async (targetPage = currentPage) => {
    const targetRequestKey = buildRequestKey({
      page: targetPage,
      query: deferredQuery.trim(),
      roleFilter,
      sort,
    });
    const response = await fetchAdminUsersList({
      limit: USERS_PAGE_SIZE,
      offset: (targetPage - 1) * USERS_PAGE_SIZE,
      query: deferredQuery.trim(),
      role: roleFilter,
      sortBy: sort.key === 'reportCount' ? 'name' : sort.key,
      sortDir: sort.direction,
    });
    writeAdminSessionCache(currentUserId, `users:list:${targetRequestKey}`, response);
    setResolvedResponseState({
      requestKey: targetRequestKey,
      response,
    });
  };

  const exportUsers = async () => {
    const response = await fetchAdminUsersList({
      limit: 5000,
      offset: 0,
      query: deferredQuery.trim(),
      role: roleFilter,
      sortBy: sort.key === 'reportCount' ? 'name' : sort.key,
      sortDir: sort.direction,
    });
    return response.rows;
  };

  return {
    buildUpdateInput,
    closeModal,
    currentPage,
    editingId,
    error,
    exportUsers,
    form,
    getLatestSessionTitle: getSessionTitle,
    isLoading: loading,
    isOpen,
    openCreate,
    openEdit,
    page: currentPage,
    pagedUsers,
    query,
    queryInput,
    refreshPage,
    roleFilter,
    sessionCountBySiteId,
    setForm,
    setPage: (nextPage: number) => {
      setPage(Math.max(1, Math.min(nextPage, totalPages)));
    },
    setQueryInput,
    submitQuery: () => {
      setPage(1);
      submitQuery();
    },
    setRoleFilter: (value: 'all' | UserRoleView) => {
      setPage(1);
      setRoleFilter(value);
    },
    setSort: (value: TableSortState) => {
      setPage(1);
      setSort(value);
    },
    sort,
    total,
    totalPages,
    userOverviewById,
  };
}
