'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { getSessionTitle } from '@/constants/inspectionSession';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';
import type { SafetyAssignment } from '@/types/controller';
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

export function useUsersSectionState(
  users: SafetyUser[],
  sites: SafetySite[],
  assignments: SafetyAssignment[],
  sessions: InspectionSession[],
  busy: boolean,
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRoleView>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [editingRoleSource, setEditingRoleSource] =
    useState<SafetyUser['role']>('field_agent');
  const isOpen = editingId !== null;
  const sitesById = useMemo(() => new Map(sites.map((site) => [site.id, site])), [sites]);
  const activeAssignmentsByUser = useMemo(() => {
    const next = new Map<string, SafetyAssignment[]>();
    assignments
      .filter((item) => item.is_active)
      .forEach((item) => {
        next.set(item.user_id, [...(next.get(item.user_id) || []), item]);
      });
    return next;
  }, [assignments]);
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
  const sessionCountBySiteId = useMemo(() => {
    const next = new Map<string, number>();
    sessions.forEach((session) => {
      next.set(session.siteKey, (next.get(session.siteKey) || 0) + 1);
    });
    return next;
  }, [sessions]);
  const userOverviewById = useMemo(() => {
    const next = new Map<
      string,
      { assignedSites: SafetySite[]; latestSession: InspectionSession | null; reportCount: number }
    >();

    users.forEach((user) => {
      const assignedSites = (activeAssignmentsByUser.get(user.id) || [])
        .map((assignment) => sitesById.get(assignment.site_id))
        .filter(Boolean) as SafetySite[];
      const latestSession =
        assignedSites
          .map((site) => latestSessionBySiteId.get(site.id) || null)
          .filter(Boolean)
          .sort((left, right) => right!.updatedAt.localeCompare(left!.updatedAt))[0] || null;
      const reportCount = assignedSites.reduce(
        (total, site) => total + (sessionCountBySiteId.get(site.id) || 0),
        0,
      );

      next.set(user.id, { assignedSites, latestSession, reportCount });
    });

    return next;
  }, [activeAssignmentsByUser, latestSessionBySiteId, sessionCountBySiteId, sitesById, users]);
  const deferredQuery = useDeferredValue(query);
  const filteredUsers = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'all' && toUserRoleView(user.role) !== roleFilter) return false;
      if (statusFilter === 'active' && !user.is_active) return false;
      if (statusFilter === 'inactive' && user.is_active) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        user.name,
        user.email,
        user.phone ?? '',
        user.position ?? '',
        user.organization_name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [deferredQuery, roleFilter, statusFilter, users]);

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setEditingRoleSource('field_agent');
  };

  const openEdit = (user: SafetyUser) => {
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
      name: form.name.trim(),
      phone: toNullableText(form.phone),
      role: nextRole,
      position: toNullableText(form.position),
      organization_name: toNullableText(form.organization_name),
      is_active: form.is_active,
    };
    const previous = {
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
      name?: string | null;
      phone?: string | null;
      role?: SafetyUser['role'];
      position?: string | null;
      organization_name?: string | null;
      is_active?: boolean | null;
    };
  };

  return {
    buildUpdateInput,
    closeModal,
    editingId,
    filteredUsers,
    form,
    getLatestSessionTitle: getSessionTitle,
    isOpen,
    openCreate,
    openEdit,
    query,
    roleFilter,
    setForm,
    setQuery,
    setRoleFilter,
    setStatusFilter,
    statusFilter,
    userOverviewById,
  };
}

