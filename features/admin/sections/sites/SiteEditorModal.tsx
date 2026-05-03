'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  SITE_CONTRACT_STATUS_OPTIONS,
  SITE_CONTRACT_TYPE_OPTIONS,
} from '@/lib/admin';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type {
  SafetyHeadquarter,
  SafetyHeadquarterInput,
} from '@/types/controller';
import {
  createEmptyClientContactRow,
  createEmptySiteManagerRow,
  type SiteFormState,
  type SiteManagerFormRow,
  type ClientContactFormRow,
} from './siteSectionHelpers';

interface SiteEditorModalProps {
  busy: boolean;
  editingId: string | null;
  form: SiteFormState;
  headquarters: Array<{ id: string; name: string }>;
  isCreateReady: boolean;
  lockedHeadquarterId: string | null;
  onCreateHeadquarter?: (input: SafetyHeadquarterInput) => Promise<SafetyHeadquarter>;
  onClose: () => void;
  onSubmit: () => void;
  setForm: Dispatch<SetStateAction<SiteFormState>>;
}

interface SiteEditorSectionState {
  clientOpen: boolean;
  contractOpen: boolean;
  key: string | null;
  operationsOpen: boolean;
}

interface InlineHeadquarterFormState {
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

const EMPTY_INLINE_HEADQUARTER_FORM: InlineHeadquarterFormState = {
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

function hasFilledValue(value: string | boolean) {
  return typeof value === 'boolean' ? value : Boolean(value.trim());
}

function syncPrimarySiteManagerFields(
  current: SiteFormState,
  rows: SiteManagerFormRow[],
): SiteFormState {
  const primary = rows.find((row) => row.is_primary) ?? rows[0];
  return {
    ...current,
    site_managers: rows,
    manager_name: primary?.name ?? '',
    manager_phone: primary?.phone ?? '',
    site_contact_email: primary?.email ?? '',
  };
}

function ensureOnePrimary(rows: SiteManagerFormRow[]) {
  if (rows.length === 0 || rows.some((row) => row.is_primary)) {
    return rows;
  }
  return rows.map((row, index) => ({ ...row, is_primary: index === 0 }));
}

export function SiteEditorModal({
  busy,
  editingId,
  form,
  headquarters,
  isCreateReady,
  lockedHeadquarterId,
  onCreateHeadquarter,
  onClose,
  onSubmit,
  setForm,
}: SiteEditorModalProps) {
  const isCreateMode = editingId === 'create';
  const resolvedHeadquarterId = lockedHeadquarterId ?? form.headquarter_id;
  const resolvedHeadquarterName =
    headquarters.find((item) => item.id === resolvedHeadquarterId)?.name || '';

  const hasOperationDetails = [
    form.project_amount,
    form.project_start_date,
    form.project_end_date,
  ].some(hasFilledValue);

  const hasClientDetails = [form.client_business_name].some(hasFilledValue);

  const hasContractDetails = [
    form.contract_type,
    form.contract_status,
    form.total_contract_amount,
    form.total_rounds,
    form.per_visit_amount,
    form.contract_start_date,
    form.contract_end_date,
    form.contract_signed_date,
  ].some(hasFilledValue);

  const initialSectionState: SiteEditorSectionState = {
    clientOpen: !isCreateMode || hasClientDetails,
    contractOpen: !isCreateMode || hasContractDetails,
    key: editingId,
    operationsOpen: !isCreateMode || hasOperationDetails,
  };

  const [sectionState, setSectionState] = useState<SiteEditorSectionState>(initialSectionState);
  const [headquarterQuery, setHeadquarterQuery] = useState(resolvedHeadquarterName);
  const [headquarterCreateOpen, setHeadquarterCreateOpen] = useState(false);
  const [headquarterCreateBusy, setHeadquarterCreateBusy] = useState(false);
  const [headquarterCreateForm, setHeadquarterCreateForm] =
    useState<InlineHeadquarterFormState>(EMPTY_INLINE_HEADQUARTER_FORM);
  const resolvedSectionState =
    sectionState.key === editingId ? sectionState : initialSectionState;

  useEffect(() => {
    setHeadquarterQuery(resolvedHeadquarterName);
    setHeadquarterCreateOpen(false);
    setHeadquarterCreateForm(EMPTY_INLINE_HEADQUARTER_FORM);
  }, [editingId, resolvedHeadquarterName]);

  const toggleSection = (field: keyof Omit<SiteEditorSectionState, 'key'>) => {
    setSectionState((current) => {
      const base = current.key === editingId ? current : initialSectionState;
      return {
        ...base,
        key: editingId,
        [field]: !base[field],
      };
    });
  };

  const addSiteManager = () => {
    setForm((current) => {
      const nextRows = [
        ...current.site_managers,
        createEmptySiteManagerRow(current.site_managers.length === 0),
      ];
      return syncPrimarySiteManagerFields(current, ensureOnePrimary(nextRows));
    });
  };

  const updateSiteManager = (
    rowId: string,
    patch: Partial<Omit<SiteManagerFormRow, 'id' | 'is_primary'>>,
  ) => {
    setForm((current) => {
      const nextRows = current.site_managers.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      );
      return syncPrimarySiteManagerFields(current, ensureOnePrimary(nextRows));
    });
  };

  const selectPrimarySiteManager = (rowId: string) => {
    setForm((current) => {
      const nextRows = current.site_managers.map((row) => ({
        ...row,
        is_primary: row.id === rowId,
      }));
      return syncPrimarySiteManagerFields(current, nextRows);
    });
  };

  const removeSiteManager = (rowId: string) => {
    setForm((current) => {
      const nextRows = ensureOnePrimary(current.site_managers.filter((row) => row.id !== rowId));
      return syncPrimarySiteManagerFields(current, nextRows);
    });
  };

  const addClientContact = () => {
    setForm((current) => ({
      ...current,
      client_contacts: [...current.client_contacts, createEmptyClientContactRow()],
    }));
  };

  const updateClientContact = (
    rowId: string,
    patch: Partial<Omit<ClientContactFormRow, 'id'>>,
  ) => {
    setForm((current) => ({
      ...current,
      client_contacts: current.client_contacts.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      ),
    }));
  };

  const removeClientContact = (rowId: string) => {
    setForm((current) => ({
      ...current,
      client_contacts: current.client_contacts.filter((row) => row.id !== rowId),
    }));
  };

  const submitInlineHeadquarter = async () => {
    if (!onCreateHeadquarter || !headquarterCreateForm.name.trim()) return;
    setHeadquarterCreateBusy(true);
    try {
      const created = await onCreateHeadquarter({
        address: headquarterCreateForm.address.trim() || null,
        business_registration_no:
          headquarterCreateForm.business_registration_no.trim() || null,
        contact_name: headquarterCreateForm.contact_name.trim() || null,
        contact_phone: headquarterCreateForm.contact_phone.trim() || null,
        corporate_registration_no:
          headquarterCreateForm.corporate_registration_no.trim() || null,
        license_no: headquarterCreateForm.license_no.trim() || null,
        management_number: headquarterCreateForm.management_number.trim() || null,
        name: headquarterCreateForm.name.trim(),
        opening_number: headquarterCreateForm.opening_number.trim() || null,
      });
      setForm((current) => ({ ...current, headquarter_id: created.id }));
      setHeadquarterQuery(created.name);
      setHeadquarterCreateForm(EMPTY_INLINE_HEADQUARTER_FORM);
      setHeadquarterCreateOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '건설사 등록에 실패했습니다.');
    } finally {
      setHeadquarterCreateBusy(false);
    }
  };

  return (
    <AppModal
      open={editingId !== null}
      title={isCreateMode ? '현장 추가' : '현장 정보 수정'}
      size="large"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClose}
            disabled={busy}
          >
            취소
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onSubmit}
            disabled={busy || (isCreateMode && !isCreateReady)}
          >
            {isCreateMode ? '생성' : '저장'}
          </button>
        </>
      }
    >
      <div className={styles.contentStack}>
        <section className={styles.contentTypePanel}>
          <div className={styles.contentTypeHeader}>
            <div>
              <h3 className={styles.menuTitle}>기본 정보</h3>
            </div>
          </div>
          <div className={styles.modalGrid}>
            {lockedHeadquarterId ? (
              <label className={styles.modalField}>
                <span className={styles.label}>건설사</span>
                <input
                  className="app-input"
                  value={resolvedHeadquarterName}
                  disabled
                  readOnly
                />
              </label>
            ) : (
              <>
                <label className={styles.modalField}>
                  <span className={styles.label}>건설사 *</span>
                  <input
                    className="app-input"
                    list="site-editor-headquarters"
                    value={headquarterQuery}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      const matched = headquarters.find((item) => item.name === nextValue);
                      setHeadquarterQuery(nextValue);
                      setForm((current) => ({
                        ...current,
                        headquarter_id: matched?.id ?? '',
                      }));
                    }}
                    disabled={busy}
                    placeholder="건설사 검색"
                  />
                  <datalist id="site-editor-headquarters">
                    {headquarters.map((item) => (
                      <option key={item.id} value={item.name} />
                    ))}
                  </datalist>
                </label>
                {onCreateHeadquarter ? (
                  <div className={styles.modalField}>
                    <span className={styles.label}>새 건설사</span>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={() => {
                        setHeadquarterCreateOpen((current) => !current);
                        setHeadquarterCreateForm((current) => ({
                          ...current,
                          name: current.name || headquarterQuery,
                        }));
                      }}
                      disabled={busy}
                    >
                      등록
                    </button>
                  </div>
                ) : null}
              </>
            )}

            {headquarterCreateOpen ? (
              <>
                <label className={styles.modalField}>
                  <span className={styles.label}>건설사명 *</span>
                  <input
                    className="app-input"
                    value={headquarterCreateForm.name}
                    onChange={(event) =>
                      setHeadquarterCreateForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    maxLength={200}
                    disabled={busy || headquarterCreateBusy}
                  />
                </label>
                <label className={styles.modalField}>
                  <span className={styles.label}>사업장관리번호</span>
                  <input
                    className="app-input"
                    value={headquarterCreateForm.management_number}
                    onChange={(event) =>
                      setHeadquarterCreateForm((current) => ({
                        ...current,
                        management_number: event.target.value,
                      }))
                    }
                    maxLength={100}
                    disabled={busy || headquarterCreateBusy}
                  />
                </label>
                <label className={styles.modalField}>
                  <span className={styles.label}>사업개시번호</span>
                  <input
                    className="app-input"
                    value={headquarterCreateForm.opening_number}
                    onChange={(event) =>
                      setHeadquarterCreateForm((current) => ({
                        ...current,
                        opening_number: event.target.value,
                      }))
                    }
                    maxLength={100}
                    disabled={busy || headquarterCreateBusy}
                  />
                </label>
                <label className={styles.modalField}>
                  <span className={styles.label}>사업자등록번호</span>
                  <input
                    className="app-input"
                    value={headquarterCreateForm.business_registration_no}
                    onChange={(event) =>
                      setHeadquarterCreateForm((current) => ({
                        ...current,
                        business_registration_no: event.target.value,
                      }))
                    }
                    maxLength={50}
                    disabled={busy || headquarterCreateBusy}
                  />
                </label>
                <label className={styles.modalField}>
                  <span className={styles.label}>법인등록번호</span>
                  <input
                    className="app-input"
                    value={headquarterCreateForm.corporate_registration_no}
                    onChange={(event) =>
                      setHeadquarterCreateForm((current) => ({
                        ...current,
                        corporate_registration_no: event.target.value,
                      }))
                    }
                    maxLength={50}
                    disabled={busy || headquarterCreateBusy}
                  />
                </label>
                <label className={styles.modalField}>
                  <span className={styles.label}>면허번호</span>
                  <input
                    className="app-input"
                    value={headquarterCreateForm.license_no}
                    onChange={(event) =>
                      setHeadquarterCreateForm((current) => ({
                        ...current,
                        license_no: event.target.value,
                      }))
                    }
                    maxLength={50}
                    disabled={busy || headquarterCreateBusy}
                  />
                </label>
                <label className={styles.modalField}>
                  <span className={styles.label}>대표 성명</span>
                  <input
                    className="app-input"
                    value={headquarterCreateForm.contact_name}
                    onChange={(event) =>
                      setHeadquarterCreateForm((current) => ({
                        ...current,
                        contact_name: event.target.value,
                      }))
                    }
                    maxLength={100}
                    disabled={busy || headquarterCreateBusy}
                  />
                </label>
                <label className={styles.modalField}>
                  <span className={styles.label}>대표 전화번호</span>
                  <input
                    className="app-input"
                    value={headquarterCreateForm.contact_phone}
                    onChange={(event) =>
                      setHeadquarterCreateForm((current) => ({
                        ...current,
                        contact_phone: event.target.value,
                      }))
                    }
                    maxLength={50}
                    disabled={busy || headquarterCreateBusy}
                  />
                </label>
                <label className={styles.modalFieldWide}>
                  <span className={styles.label}>소재지</span>
                  <input
                    className="app-input"
                    value={headquarterCreateForm.address}
                    onChange={(event) =>
                      setHeadquarterCreateForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    disabled={busy || headquarterCreateBusy}
                  />
                </label>
                <div className={styles.modalField}>
                  <span className={styles.label}>저장</span>
                  <button
                    type="button"
                    className="app-button app-button-primary"
                    onClick={() => void submitInlineHeadquarter()}
                    disabled={
                      busy || headquarterCreateBusy || !headquarterCreateForm.name.trim()
                    }
                  >
                    건설사 생성
                  </button>
                </div>
              </>
            ) : null}

            <label className={styles.modalField}>
              <span className={styles.label}>현장명 *</span>
              <input
                className="app-input"
                value={form.site_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, site_name: event.target.value }))
                }
                maxLength={200}
                disabled={busy}
                placeholder="예: OO아파트 신축공사"
              />
            </label>

            <label className={styles.modalFieldWide}>
              <span className={styles.label}>현장 주소</span>
              <input
                className="app-input"
                value={form.site_address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, site_address: event.target.value }))
                }
                disabled={busy}
                placeholder="예: 서울시 강남구 테헤란로 123"
              />
            </label>

            <div className={styles.contactEditorBlock}>
              <div className={styles.contactEditorHeader}>
                <span className={styles.contactEditorTitle}>현장 책임자</span>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={addSiteManager}
                  disabled={busy}
                >
                  추가
                </button>
              </div>
              <div className={styles.contactEditorRows}>
                {form.site_managers.length > 0 ? (
                  form.site_managers.map((manager) => (
                    <div key={manager.id} className={styles.contactEditorRow}>
                      <label className={styles.modalField}>
                        <span className={styles.label}>이름</span>
                        <input
                          className="app-input"
                          value={manager.name}
                          onChange={(event) =>
                            updateSiteManager(manager.id, { name: event.target.value })
                          }
                          maxLength={100}
                          disabled={busy}
                        />
                      </label>
                      <label className={styles.modalField}>
                        <span className={styles.label}>연락처</span>
                        <input
                          className="app-input"
                          value={manager.phone}
                          onChange={(event) =>
                            updateSiteManager(manager.id, { phone: event.target.value })
                          }
                          maxLength={50}
                          disabled={busy}
                        />
                      </label>
                      <label className={styles.modalField}>
                        <span className={styles.label}>이메일</span>
                        <input
                          className="app-input"
                          type="email"
                          value={manager.email}
                          onChange={(event) =>
                            updateSiteManager(manager.id, { email: event.target.value })
                          }
                          maxLength={200}
                          disabled={busy}
                        />
                      </label>
                      <label className={styles.contactPrimaryToggle}>
                        <input
                          type="radio"
                          name="primary-site-manager"
                          checked={manager.is_primary}
                          onChange={() => selectPrimarySiteManager(manager.id)}
                          disabled={busy}
                        />
                        대표
                      </label>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => removeSiteManager(manager.id)}
                        disabled={busy}
                      >
                        삭제
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={styles.contactEditorEmpty}>등록된 현장 책임자가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.contentTypePanel} ${styles.collapsiblePanel}`}>
          <button
            type="button"
            className={styles.collapsibleSummaryButton}
            onClick={() => toggleSection('operationsOpen')}
            aria-expanded={resolvedSectionState.operationsOpen}
          >
            <div className={styles.collapsibleSummaryBody}>
              <h3 className={styles.menuTitle}>운영 정보</h3>
              <span
                className={`${styles.collapsibleChevron} ${
                  resolvedSectionState.operationsOpen ? styles.collapsibleChevronOpen : ''
                }`}
                aria-hidden="true"
              >
                ▸
              </span>
            </div>
          </button>
          {resolvedSectionState.operationsOpen ? (
            <div className={styles.collapsibleContent}>
              <div className={styles.modalGrid}>
                <label className={styles.modalField}>
                  <span className={styles.label}>공사 금액</span>
                  <input
                    className="app-input"
                    value={form.project_amount}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, project_amount: event.target.value }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>공사 시작일</span>
                  <input
                    className="app-input"
                    type="date"
                    value={form.project_start_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        project_start_date: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>공사 종료일</span>
                  <input
                    className="app-input"
                    type="date"
                    value={form.project_end_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        project_end_date: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>

              </div>
            </div>
          ) : null}
        </section>

        <section className={`${styles.contentTypePanel} ${styles.collapsiblePanel}`}>
          <button
            type="button"
            className={styles.collapsibleSummaryButton}
            onClick={() => toggleSection('contractOpen')}
            aria-expanded={resolvedSectionState.contractOpen}
          >
            <div className={styles.collapsibleSummaryBody}>
              <h3 className={styles.menuTitle}>계약 정보</h3>
              <span
                className={`${styles.collapsibleChevron} ${
                  resolvedSectionState.contractOpen ? styles.collapsibleChevronOpen : ''
                }`}
                aria-hidden="true"
              >
                ▸
              </span>
            </div>
          </button>
          {resolvedSectionState.contractOpen ? (
            <div className={styles.collapsibleContent}>
              <div className={styles.modalGrid}>
                <label className={styles.modalField}>
                  <span className={styles.label}>계약 유형</span>
                  <select
                    className="app-select"
                    value={form.contract_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contract_type: event.target.value,
                      }))
                    }
                    disabled={busy}
                  >
                    {form.contract_type === 'maintenance' ? (
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

                <label className={styles.modalField}>
                  <span className={styles.label}>계약 상태</span>
                  <select
                    className="app-select"
                    value={form.contract_status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contract_status: event.target.value,
                      }))
                    }
                    disabled={busy}
                  >
                    {SITE_CONTRACT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value || 'blank'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>기술지도 계약 총액</span>
                  <input
                    className="app-input"
                    value={form.total_contract_amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        total_contract_amount: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>기술지도 횟수</span>
                  <input
                    className="app-input"
                    value={form.total_rounds}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, total_rounds: event.target.value }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>회차당 단가</span>
                  <input
                    className="app-input"
                    value={form.per_visit_amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        per_visit_amount: event.target.value,
                      }))
                    }
                    disabled={busy}
                    placeholder="비워두면 총액/횟수 자동 계산"
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>계약 시작일</span>
                  <input
                    className="app-input"
                    type="date"
                    value={form.contract_start_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contract_start_date: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>계약 종료일</span>
                  <input
                    className="app-input"
                    type="date"
                    value={form.contract_end_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contract_end_date: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>계약 체결일</span>
                  <input
                    className="app-input"
                    type="date"
                    value={form.contract_signed_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contract_signed_date: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>
              </div>
            </div>
          ) : null}
        </section>

        <section className={`${styles.contentTypePanel} ${styles.collapsiblePanel}`}>
          <button
            type="button"
            className={styles.collapsibleSummaryButton}
            onClick={() => toggleSection('clientOpen')}
            aria-expanded={resolvedSectionState.clientOpen}
          >
            <div className={styles.collapsibleSummaryBody}>
              <h3 className={styles.menuTitle}>발주처</h3>
              <span
                className={`${styles.collapsibleChevron} ${
                  resolvedSectionState.clientOpen ? styles.collapsibleChevronOpen : ''
                }`}
                aria-hidden="true"
              >
                ▸
              </span>
            </div>
          </button>
          {resolvedSectionState.clientOpen ? (
            <div className={styles.collapsibleContent}>
              <div className={styles.modalGrid}>
                <label className={styles.modalField}>
                  <span className={styles.label}>발주처명</span>
                  <input
                    className="app-input"
                    value={form.client_business_name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        client_business_name: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>
                <div className={styles.contactEditorBlock}>
                  <div className={styles.contactEditorHeader}>
                    <span className={styles.contactEditorTitle}>발주처 담당자</span>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={addClientContact}
                      disabled={busy}
                    >
                      추가
                    </button>
                  </div>
                  <div className={styles.contactEditorRows}>
                    {form.client_contacts.length > 0 ? (
                      form.client_contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={`${styles.contactEditorRow} ${styles.contactEditorRowNoPrimary}`}
                        >
                          <label className={styles.modalField}>
                            <span className={styles.label}>이름</span>
                            <input
                              className="app-input"
                              value={contact.name}
                              onChange={(event) =>
                                updateClientContact(contact.id, { name: event.target.value })
                              }
                              maxLength={100}
                              disabled={busy}
                            />
                          </label>
                          <label className={styles.modalField}>
                            <span className={styles.label}>연락처</span>
                            <input
                              className="app-input"
                              value={contact.phone}
                              onChange={(event) =>
                                updateClientContact(contact.id, { phone: event.target.value })
                              }
                              maxLength={50}
                              disabled={busy}
                            />
                          </label>
                          <label className={styles.modalField}>
                            <span className={styles.label}>이메일</span>
                            <input
                              className="app-input"
                              type="email"
                              value={contact.email}
                              onChange={(event) =>
                                updateClientContact(contact.id, { email: event.target.value })
                              }
                              maxLength={200}
                              disabled={busy}
                            />
                          </label>
                          <button
                            type="button"
                            className="app-button app-button-secondary"
                            onClick={() => removeClientContact(contact.id)}
                            disabled={busy}
                          >
                            삭제
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className={styles.contactEditorEmpty}>등록된 발주처 담당자가 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </AppModal>
  );
}
