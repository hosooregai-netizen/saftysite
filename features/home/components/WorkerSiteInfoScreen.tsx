'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import {
  SITE_CONTRACT_STATUS_OPTIONS,
  SITE_CONTRACT_TYPE_OPTIONS,
} from '@/lib/admin';
import {
  normalizeSafetyClientContacts,
  normalizeSafetySiteManagers,
} from '@/lib/siteContacts';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  createSafetySiteForHeadquarter,
  fetchAssignedSafetyHeadquarters,
  fetchSafetySiteDetail,
  readSafetyAuthToken,
  updateAssignedSafetyHeadquarter,
  updateAssignedSafetySite,
} from '@/lib/safetyApi';
import { buildSiteHubHref } from '@/features/home/lib/siteEntry';
import type { SafetyHeadquarterUpdateInput, SafetySiteInput, SafetySiteUpdateInput } from '@/types/controller';
import type { SafetyHeadquarterDetail, SafetySite } from '@/types/backend';
import styles from './HomeScreen.module.css';

type WorkerSiteInfoMode = 'create' | 'edit';

interface WorkerSiteInfoScreenProps {
  headquarterId?: string;
  mode: WorkerSiteInfoMode;
  siteId?: string;
}

interface HeadquarterFormState {
  address: string;
  business_registration_no: string;
  contact_name: string;
  contact_phone: string;
  corporate_registration_no: string;
  license_no: string;
  management_number: string;
  name: string;
  opening_number: string;
}

interface WorkerSiteFormState {
  client_business_name: string;
  client_contacts: WorkerClientContactFormRow[];
  contract_end_date: string;
  contract_signed_date: string;
  contract_start_date: string;
  contract_status: string;
  contract_type: string;
  labor_office: string;
  manager_name: string;
  manager_phone: string;
  per_visit_amount: string;
  project_amount: string;
  project_end_date: string;
  project_start_date: string;
  site_address: string;
  site_contact_email: string;
  site_managers: WorkerSiteManagerFormRow[];
  site_name: string;
  total_contract_amount: string;
  total_rounds: string;
}

interface WorkerSiteManagerFormRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  is_primary: boolean;
}

interface WorkerClientContactFormRow {
  id: string;
  name: string;
  phone: string;
  email: string;
}

const EMPTY_HEADQUARTER_FORM: HeadquarterFormState = {
  address: '',
  business_registration_no: '',
  contact_name: '',
  contact_phone: '',
  corporate_registration_no: '',
  license_no: '',
  management_number: '',
  name: '',
  opening_number: '',
};

const EMPTY_SITE_FORM: WorkerSiteFormState = {
  client_business_name: '',
  client_contacts: [],
  contract_end_date: '',
  contract_signed_date: '',
  contract_start_date: '',
  contract_status: '',
  contract_type: '',
  labor_office: '',
  manager_name: '',
  manager_phone: '',
  per_visit_amount: '',
  project_amount: '',
  project_end_date: '',
  project_start_date: '',
  site_address: '',
  site_contact_email: '',
  site_managers: [],
  site_name: '',
  total_contract_amount: '',
  total_rounds: '',
};

function toText(value: string | null | undefined): string {
  return String(value ?? '');
}

function toNullableText(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim().replace(/,/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInteger(value: string): number | null {
  const parsed = parseOptionalNumber(value);
  return typeof parsed === 'number' && Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

let contactRowSequence = 0;

function createContactRowId(prefix: string) {
  contactRowSequence += 1;
  return `${prefix}-${Date.now()}-${contactRowSequence}`;
}

function createEmptySiteManagerRow(isPrimary = false): WorkerSiteManagerFormRow {
  return {
    id: createContactRowId('site-manager'),
    name: '',
    phone: '',
    email: '',
    is_primary: isPrimary,
  };
}

function createEmptyClientContactRow(): WorkerClientContactFormRow {
  return {
    id: createContactRowId('client-contact'),
    name: '',
    phone: '',
    email: '',
  };
}

function hasContactValue(contact: Pick<WorkerClientContactFormRow, 'name' | 'phone' | 'email'>) {
  return Boolean(contact.name.trim() || contact.phone.trim() || contact.email.trim());
}

function normalizeSiteManagerPayload(rows: WorkerSiteManagerFormRow[]) {
  const contacts = rows
    .map((row, index) => ({
      id: row.id || `site-manager-${index + 1}`,
      name: row.name.trim(),
      phone: row.phone.trim(),
      email: row.email.trim(),
      is_primary: Boolean(row.is_primary),
    }))
    .filter(hasContactValue);

  if (contacts.length === 0) {
    return [];
  }

  let primarySeen = false;
  const normalized = contacts.map((contact) => {
    const isPrimary = contact.is_primary && !primarySeen;
    if (isPrimary) primarySeen = true;
    return { ...contact, is_primary: isPrimary };
  });
  if (!primarySeen) {
    normalized[0] = { ...normalized[0], is_primary: true };
  }
  return normalized;
}

function normalizeClientContactPayload(rows: WorkerClientContactFormRow[]) {
  return rows
    .map((row, index) => ({
      id: row.id || `client-contact-${index + 1}`,
      name: row.name.trim(),
      phone: row.phone.trim(),
      email: row.email.trim(),
    }))
    .filter(hasContactValue);
}

function ensureOnePrimary(rows: WorkerSiteManagerFormRow[]) {
  if (rows.length === 0 || rows.some((row) => row.is_primary)) {
    return rows;
  }
  return rows.map((row, index) => ({ ...row, is_primary: index === 0 }));
}

function syncPrimarySiteManagerFields(
  current: WorkerSiteFormState,
  rows: WorkerSiteManagerFormRow[],
): WorkerSiteFormState {
  const primary = rows.find((row) => row.is_primary) ?? rows[0];
  return {
    ...current,
    site_managers: rows,
    manager_name: primary?.name ?? '',
    manager_phone: primary?.phone ?? '',
    site_contact_email: primary?.email ?? '',
  };
}

function createHeadquarterForm(headquarter: SafetyHeadquarterDetail | null): HeadquarterFormState {
  if (!headquarter) return EMPTY_HEADQUARTER_FORM;
  return {
    address: toText(headquarter.address),
    business_registration_no: toText(headquarter.business_registration_no),
    contact_name: toText(headquarter.contact_name),
    contact_phone: toText(headquarter.contact_phone),
    corporate_registration_no: toText(headquarter.corporate_registration_no),
    license_no: toText(headquarter.license_no),
    management_number: toText(headquarter.management_number),
    name: toText(headquarter.name),
    opening_number: toText(headquarter.opening_number),
  };
}

function createSiteForm(site: SafetySite | null): WorkerSiteFormState {
  if (!site) return EMPTY_SITE_FORM;
  const siteManagers = normalizeSafetySiteManagers(site).map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    is_primary: contact.is_primary,
  }));
  const clientContacts = normalizeSafetyClientContacts(site).map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
  }));
  const primaryManager = siteManagers.find((contact) => contact.is_primary) ?? siteManagers[0];
  return {
    client_business_name: toText(site.client_business_name),
    client_contacts: clientContacts,
    contract_end_date: toText(site.contract_end_date),
    contract_signed_date: toText(site.contract_signed_date ?? site.contract_date),
    contract_start_date: toText(site.contract_start_date),
    contract_status: toText(site.contract_status),
    contract_type: toText(site.contract_type),
    labor_office: toText(site.labor_office),
    manager_name: primaryManager?.name ?? toText(site.manager_name),
    manager_phone: primaryManager?.phone ?? toText(site.manager_phone),
    per_visit_amount: site.per_visit_amount != null ? String(site.per_visit_amount) : '',
    project_amount: site.project_amount != null ? String(site.project_amount) : '',
    project_end_date: toText(site.project_end_date),
    project_start_date: toText(site.project_start_date),
    site_address: toText(site.site_address),
    site_contact_email: primaryManager?.email ?? toText(site.site_contact_email),
    site_managers: siteManagers,
    site_name: toText(site.site_name),
    total_contract_amount:
      site.total_contract_amount != null ? String(site.total_contract_amount) : '',
    total_rounds: site.total_rounds != null ? String(site.total_rounds) : '',
  };
}

function buildHeadquarterPayload(form: HeadquarterFormState): SafetyHeadquarterUpdateInput {
  const payload: SafetyHeadquarterUpdateInput = {
    address: toNullableText(form.address),
    business_registration_no: toNullableText(form.business_registration_no),
    contact_name: toNullableText(form.contact_name),
    contact_phone: toNullableText(form.contact_phone),
    corporate_registration_no: toNullableText(form.corporate_registration_no),
    license_no: toNullableText(form.license_no),
    management_number: toNullableText(form.management_number),
    opening_number: toNullableText(form.opening_number),
  };
  const name = form.name.trim();
  if (name) {
    payload.name = name;
  }
  return payload;
}

function buildSitePayload(form: WorkerSiteFormState): Omit<SafetySiteInput, 'headquarter_id'> {
  const siteManagers = normalizeSiteManagerPayload(form.site_managers);
  const primaryManager = siteManagers.find((contact) => contact.is_primary) ?? siteManagers[0];
  return {
    client_business_name: toNullableText(form.client_business_name),
    client_contacts: normalizeClientContactPayload(form.client_contacts),
    contract_end_date: toNullableText(form.contract_end_date),
    contract_signed_date: toNullableText(form.contract_signed_date),
    contract_start_date: toNullableText(form.contract_start_date),
    contract_status: toNullableText(form.contract_status),
    contract_type: toNullableText(form.contract_type),
    labor_office: toNullableText(form.labor_office),
    manager_name: toNullableText(primaryManager?.name ?? form.manager_name),
    manager_phone: toNullableText(primaryManager?.phone ?? form.manager_phone),
    per_visit_amount: parseOptionalNumber(form.per_visit_amount),
    project_amount: parseOptionalNumber(form.project_amount),
    project_end_date: toNullableText(form.project_end_date),
    project_start_date: toNullableText(form.project_start_date),
    site_address: toNullableText(form.site_address),
    site_contact_email: toNullableText(primaryManager?.email ?? form.site_contact_email),
    site_managers: siteManagers,
    site_name: form.site_name.trim(),
    total_contract_amount: parseOptionalNumber(form.total_contract_amount),
    total_rounds: parseOptionalInteger(form.total_rounds),
  };
}

export function WorkerSiteInfoScreen({
  headquarterId,
  mode,
  siteId,
}: WorkerSiteInfoScreenProps) {
  const router = useRouter();
  const { currentUser, logout } = useInspectionSessions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [headquarterForm, setHeadquarterForm] =
    useState<HeadquarterFormState>(EMPTY_HEADQUARTER_FORM);
  const [siteForm, setSiteForm] = useState<WorkerSiteFormState>(EMPTY_SITE_FORM);
  const [resolvedHeadquarterId, setResolvedHeadquarterId] = useState(headquarterId ?? '');
  const [resolvedSite, setResolvedSite] = useState<SafetySite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'create' ? '현장 등록' : '현장 정보 수정';
  const canSubmit = Boolean(resolvedHeadquarterId && siteForm.site_name.trim());
  const backHref = useMemo(
    () => (mode === 'edit' && siteId ? buildSiteHubHref(siteId) : '/'),
    [mode, siteId],
  );

  const addSiteManager = () => {
    setSiteForm((current) => {
      const nextRows = [
        ...current.site_managers,
        createEmptySiteManagerRow(current.site_managers.length === 0),
      ];
      return syncPrimarySiteManagerFields(current, ensureOnePrimary(nextRows));
    });
  };

  const updateSiteManager = (
    rowId: string,
    patch: Partial<Omit<WorkerSiteManagerFormRow, 'id' | 'is_primary'>>,
  ) => {
    setSiteForm((current) => {
      const nextRows = current.site_managers.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      );
      return syncPrimarySiteManagerFields(current, ensureOnePrimary(nextRows));
    });
  };

  const selectPrimarySiteManager = (rowId: string) => {
    setSiteForm((current) => {
      const nextRows = current.site_managers.map((row) => ({
        ...row,
        is_primary: row.id === rowId,
      }));
      return syncPrimarySiteManagerFields(current, nextRows);
    });
  };

  const removeSiteManager = (rowId: string) => {
    setSiteForm((current) => {
      const nextRows = ensureOnePrimary(current.site_managers.filter((row) => row.id !== rowId));
      return syncPrimarySiteManagerFields(current, nextRows);
    });
  };

  const addClientContact = () => {
    setSiteForm((current) => ({
      ...current,
      client_contacts: [...current.client_contacts, createEmptyClientContactRow()],
    }));
  };

  const updateClientContact = (
    rowId: string,
    patch: Partial<Omit<WorkerClientContactFormRow, 'id'>>,
  ) => {
    setSiteForm((current) => ({
      ...current,
      client_contacts: current.client_contacts.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      ),
    }));
  };

  const removeClientContact = (rowId: string) => {
    setSiteForm((current) => ({
      ...current,
      client_contacts: current.client_contacts.filter((row) => row.id !== rowId),
    }));
  };

  useEffect(() => {
    const token = readSafetyAuthToken();
    if (!token) {
      setError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void (async () => {
      if (mode === 'create') {
        if (!headquarterId) {
          throw new Error('건설사 정보가 없습니다.');
        }
        const assignments = await fetchAssignedSafetyHeadquarters(token);
        const matched = assignments.find((assignment) => assignment.headquarter_id === headquarterId);
        if (!matched) {
          throw new Error('배정된 건설사만 현장을 등록할 수 있습니다.');
        }
        if (cancelled) return;
        setResolvedHeadquarterId(matched.headquarter_id);
        setHeadquarterForm(createHeadquarterForm(matched.headquarter));
        setSiteForm(EMPTY_SITE_FORM);
        setResolvedSite(null);
        return;
      }

      if (!siteId) {
        throw new Error('현장 정보가 없습니다.');
      }
      const site = await fetchSafetySiteDetail(token, siteId);
      if (cancelled) return;
      setResolvedSite(site);
      setResolvedHeadquarterId(site.headquarter_id);
      setHeadquarterForm(createHeadquarterForm(site.headquarter_detail));
      setSiteForm(createSiteForm(site));
    })()
      .catch((nextError) => {
        if (cancelled) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : '현장 정보를 불러오지 못했습니다.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [headquarterId, mode, siteId]);

  const submit = async () => {
    const token = readSafetyAuthToken();
    if (!token) {
      setError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }
    if (!canSubmit) return;

    setIsSaving(true);
    setError(null);
    try {
      await updateAssignedSafetyHeadquarter(
        token,
        resolvedHeadquarterId,
        buildHeadquarterPayload(headquarterForm),
      );
      const payload = buildSitePayload(siteForm);
      if (mode === 'create') {
        const created = await createSafetySiteForHeadquarter(
          token,
          resolvedHeadquarterId,
          payload,
        );
        router.replace(buildSiteHubHref(created.id));
        return;
      }
      if (!resolvedSite) {
        throw new Error('수정할 현장 정보가 없습니다.');
      }
      await updateAssignedSafetySite(
        token,
        resolvedSite.id,
        payload as SafetySiteUpdateInput,
      );
      router.replace(buildSiteHubHref(resolvedSite.id));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '현장 정보 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />
          <WorkerShellBody>
            <WorkerMenuSidebar>
              <WorkerMenuPanel />
            </WorkerMenuSidebar>
            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>{title}</h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <section className={styles.formPanel}>
                  {isLoading ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>현장 정보를 불러오는 중입니다.</p>
                    </div>
                  ) : (
                    <div className={styles.workerForm}>
                      {error ? <p className={styles.formError}>{error}</p> : null}

                      <div className={styles.formSection}>
                        <h2 className={styles.formSectionTitle}>건설사 기본정보</h2>
                        <div className={styles.formGrid}>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>건설사명</span>
                            <input
                              className="app-input"
                              value={headquarterForm.name}
                              onChange={(event) =>
                                setHeadquarterForm((current) => ({
                                  ...current,
                                  name: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>사업장관리번호</span>
                            <input
                              className="app-input"
                              value={headquarterForm.management_number}
                              onChange={(event) =>
                                setHeadquarterForm((current) => ({
                                  ...current,
                                  management_number: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>사업개시번호</span>
                            <input
                              className="app-input"
                              value={headquarterForm.opening_number}
                              onChange={(event) =>
                                setHeadquarterForm((current) => ({
                                  ...current,
                                  opening_number: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>사업자등록번호</span>
                            <input
                              className="app-input"
                              value={headquarterForm.business_registration_no}
                              onChange={(event) =>
                                setHeadquarterForm((current) => ({
                                  ...current,
                                  business_registration_no: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>법인등록번호</span>
                            <input
                              className="app-input"
                              value={headquarterForm.corporate_registration_no}
                              onChange={(event) =>
                                setHeadquarterForm((current) => ({
                                  ...current,
                                  corporate_registration_no: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>면허번호</span>
                            <input
                              className="app-input"
                              value={headquarterForm.license_no}
                              onChange={(event) =>
                                setHeadquarterForm((current) => ({
                                  ...current,
                                  license_no: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>대표 성명</span>
                            <input
                              className="app-input"
                              value={headquarterForm.contact_name}
                              onChange={(event) =>
                                setHeadquarterForm((current) => ({
                                  ...current,
                                  contact_name: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>대표 전화번호</span>
                            <input
                              className="app-input"
                              value={headquarterForm.contact_phone}
                              onChange={(event) =>
                                setHeadquarterForm((current) => ({
                                  ...current,
                                  contact_phone: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={`${styles.formField} ${styles.formFieldWide}`}>
                            <span className={styles.formLabel}>소재지</span>
                            <input
                              className="app-input"
                              value={headquarterForm.address}
                              onChange={(event) =>
                                setHeadquarterForm((current) => ({
                                  ...current,
                                  address: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                        </div>
                      </div>

                      <div className={styles.formSection}>
                        <h2 className={styles.formSectionTitle}>현장 정보</h2>
                        <div className={styles.formGrid}>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>현장명 *</span>
                            <input
                              className="app-input"
                              value={siteForm.site_name}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  site_name: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={`${styles.formField} ${styles.formFieldWide}`}>
                            <span className={styles.formLabel}>현장 주소</span>
                            <input
                              className="app-input"
                              value={siteForm.site_address}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  site_address: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>고용부 관할(지)청</span>
                            <input
                              className="app-input"
                              value={siteForm.labor_office}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  labor_office: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>공사 금액</span>
                            <input
                              className="app-input"
                              value={siteForm.project_amount}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  project_amount: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>공사 시작일</span>
                            <input
                              className="app-input"
                              type="date"
                              value={siteForm.project_start_date}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  project_start_date: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>공사 종료일</span>
                            <input
                              className="app-input"
                              type="date"
                              value={siteForm.project_end_date}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  project_end_date: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>발주처명</span>
                            <input
                              className="app-input"
                              value={siteForm.client_business_name}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  client_business_name: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <div className={styles.contactEditorBlock}>
                            <div className={styles.contactEditorHeader}>
                              <span className={styles.contactEditorTitle}>현장 책임자</span>
                              <button
                                type="button"
                                className="app-button app-button-secondary"
                                onClick={addSiteManager}
                                disabled={isSaving}
                              >
                                추가
                              </button>
                            </div>
                            <div className={styles.contactEditorRows}>
                              {siteForm.site_managers.length > 0 ? (
                                siteForm.site_managers.map((manager) => (
                                  <div key={manager.id} className={styles.contactEditorRow}>
                                    <label className={styles.formField}>
                                      <span className={styles.formLabel}>이름</span>
                                      <input
                                        className="app-input"
                                        value={manager.name}
                                        onChange={(event) =>
                                          updateSiteManager(manager.id, { name: event.target.value })
                                        }
                                        disabled={isSaving}
                                      />
                                    </label>
                                    <label className={styles.formField}>
                                      <span className={styles.formLabel}>연락처</span>
                                      <input
                                        className="app-input"
                                        value={manager.phone}
                                        onChange={(event) =>
                                          updateSiteManager(manager.id, { phone: event.target.value })
                                        }
                                        disabled={isSaving}
                                      />
                                    </label>
                                    <label className={styles.formField}>
                                      <span className={styles.formLabel}>이메일</span>
                                      <input
                                        className="app-input"
                                        type="email"
                                        value={manager.email}
                                        onChange={(event) =>
                                          updateSiteManager(manager.id, { email: event.target.value })
                                        }
                                        disabled={isSaving}
                                      />
                                    </label>
                                    <label className={styles.contactPrimaryToggle}>
                                      <input
                                        type="radio"
                                        name="worker-primary-site-manager"
                                        checked={manager.is_primary}
                                        onChange={() => selectPrimarySiteManager(manager.id)}
                                        disabled={isSaving}
                                      />
                                      대표
                                    </label>
                                    <button
                                      type="button"
                                      className="app-button app-button-secondary"
                                      onClick={() => removeSiteManager(manager.id)}
                                      disabled={isSaving}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className={styles.contactEditorEmpty}>
                                  등록된 현장 책임자가 없습니다.
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={styles.contactEditorBlock}>
                            <div className={styles.contactEditorHeader}>
                              <span className={styles.contactEditorTitle}>발주처 담당자</span>
                              <button
                                type="button"
                                className="app-button app-button-secondary"
                                onClick={addClientContact}
                                disabled={isSaving}
                              >
                                추가
                              </button>
                            </div>
                            <div className={styles.contactEditorRows}>
                              {siteForm.client_contacts.length > 0 ? (
                                siteForm.client_contacts.map((contact) => (
                                  <div
                                    key={contact.id}
                                    className={`${styles.contactEditorRow} ${styles.contactEditorRowNoPrimary}`}
                                  >
                                    <label className={styles.formField}>
                                      <span className={styles.formLabel}>이름</span>
                                      <input
                                        className="app-input"
                                        value={contact.name}
                                        onChange={(event) =>
                                          updateClientContact(contact.id, { name: event.target.value })
                                        }
                                        disabled={isSaving}
                                      />
                                    </label>
                                    <label className={styles.formField}>
                                      <span className={styles.formLabel}>연락처</span>
                                      <input
                                        className="app-input"
                                        value={contact.phone}
                                        onChange={(event) =>
                                          updateClientContact(contact.id, { phone: event.target.value })
                                        }
                                        disabled={isSaving}
                                      />
                                    </label>
                                    <label className={styles.formField}>
                                      <span className={styles.formLabel}>이메일</span>
                                      <input
                                        className="app-input"
                                        type="email"
                                        value={contact.email}
                                        onChange={(event) =>
                                          updateClientContact(contact.id, { email: event.target.value })
                                        }
                                        disabled={isSaving}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      className="app-button app-button-secondary"
                                      onClick={() => removeClientContact(contact.id)}
                                      disabled={isSaving}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className={styles.contactEditorEmpty}>
                                  등록된 발주처 담당자가 없습니다.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.formSection}>
                        <h2 className={styles.formSectionTitle}>계약 정보</h2>
                        <div className={styles.formGrid}>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>계약 유형</span>
                            <select
                              className="app-select"
                              value={siteForm.contract_type}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  contract_type: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            >
                              {siteForm.contract_type === 'maintenance' ? (
                                <option value="maintenance" disabled>
                                  유지보수(기존)
                                </option>
                              ) : null}
                              {SITE_CONTRACT_TYPE_OPTIONS.map((option) => (
                                <option key={option.value || 'blank'} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>계약 상태</span>
                            <select
                              className="app-select"
                              value={siteForm.contract_status}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  contract_status: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            >
                              {SITE_CONTRACT_STATUS_OPTIONS.map((option) => (
                                <option key={option.value || 'blank'} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>계약 시작일</span>
                            <input
                              className="app-input"
                              type="date"
                              value={siteForm.contract_start_date}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  contract_start_date: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>계약 종료일</span>
                            <input
                              className="app-input"
                              type="date"
                              value={siteForm.contract_end_date}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  contract_end_date: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>계약 체결일</span>
                            <input
                              className="app-input"
                              type="date"
                              value={siteForm.contract_signed_date}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  contract_signed_date: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>기술지도 계약 총액</span>
                            <input
                              className="app-input"
                              value={siteForm.total_contract_amount}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  total_contract_amount: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>기술지도 횟수</span>
                            <input
                              className="app-input"
                              value={siteForm.total_rounds}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  total_rounds: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                          <label className={styles.formField}>
                            <span className={styles.formLabel}>회차당 단가</span>
                            <input
                              className="app-input"
                              value={siteForm.per_visit_amount}
                              onChange={(event) =>
                                setSiteForm((current) => ({
                                  ...current,
                                  per_visit_amount: event.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </label>
                        </div>
                      </div>

                      <div className={styles.formActions}>
                        <Link href={backHref} className="app-button app-button-secondary">
                          취소
                        </Link>
                        <button
                          type="button"
                          className="app-button app-button-primary"
                          onClick={() => void submit()}
                          disabled={isSaving || !canSubmit}
                        >
                          {isSaving ? '저장 중' : '저장'}
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>
      <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </main>
  );
}
