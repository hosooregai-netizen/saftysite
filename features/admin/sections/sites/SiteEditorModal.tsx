'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  SITE_CONTRACT_STATUS_OPTIONS,
  SITE_CONTRACT_TYPE_OPTIONS,
  SITE_STATUS_OPTIONS,
} from '@/lib/admin';
import { useState, type Dispatch, type SetStateAction } from 'react';
import type { SafetySiteStatus } from '@/types/controller';
import type { SiteFormState } from './siteSectionHelpers';

interface SiteEditorModalProps {
  busy: boolean;
  editingId: string | null;
  form: SiteFormState;
  headquarters: Array<{ id: string; name: string }>;
  isCreateReady: boolean;
  lockedHeadquarterId: string | null;
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

function hasFilledValue(value: string | boolean) {
  return typeof value === 'boolean' ? value : Boolean(value.trim());
}

export function SiteEditorModal({
  busy,
  editingId,
  form,
  headquarters,
  isCreateReady,
  lockedHeadquarterId,
  onClose,
  onSubmit,
  setForm,
}: SiteEditorModalProps) {
  const isCreateMode = editingId === 'create';
  const resolvedHeadquarterId = lockedHeadquarterId ?? form.headquarter_id;
  const resolvedHeadquarterName =
    headquarters.find((item) => item.id === resolvedHeadquarterId)?.name || '';

  const hasOperationDetails = [
    form.site_code,
    form.management_number,
    form.status !== 'planned' ? form.status : '',
    form.pause_start_date,
    form.is_high_risk_site,
    form.labor_office,
    form.guidance_officer_name,
    form.inspector_name,
    form.project_amount,
    form.project_start_date,
    form.project_end_date,
    form.project_scale,
    form.project_kind,
  ].some(hasFilledValue);

  const hasClientDetails = [form.client_business_name, form.order_type_division].some(
    hasFilledValue,
  );

  const hasContractDetails = [
    form.technical_guidance_kind,
    form.contract_contact_name,
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
  const resolvedSectionState =
    sectionState.key === editingId ? sectionState : initialSectionState;

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
                <span className={styles.label}>사업장</span>
                <input
                  className="app-input"
                  value={resolvedHeadquarterName}
                  disabled
                  readOnly
                />
              </label>
            ) : (
              <label className={styles.modalField}>
                <span className={styles.label}>사업장 *</span>
                <select
                  className="app-select"
                  value={form.headquarter_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, headquarter_id: event.target.value }))
                  }
                  disabled={busy}
                >
                  <option value="">선택</option>
                  {headquarters.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

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

            <label className={styles.modalField}>
              <span className={styles.label}>현장 책임자명</span>
              <input
                className="app-input"
                value={form.manager_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, manager_name: event.target.value }))
                }
                maxLength={100}
                disabled={busy}
                placeholder="예: 홍길동"
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.label}>현장 책임자 연락처</span>
              <input
                className="app-input"
                value={form.manager_phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, manager_phone: event.target.value }))
                }
                maxLength={50}
                disabled={busy}
                placeholder="예: 010-1234-5678"
              />
            </label>

            <label className={styles.modalFieldWide}>
              <span className={styles.label}>보고서 수신 메일</span>
              <input
                className="app-input"
                type="email"
                value={form.site_contact_email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    site_contact_email: event.target.value,
                  }))
                }
                maxLength={200}
                disabled={busy}
                placeholder="site@example.com"
              />
            </label>
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
                  <span className={styles.label}>현장코드</span>
                  <input
                    className="app-input"
                    value={form.site_code}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, site_code: event.target.value }))
                    }
                    maxLength={100}
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>현장관리번호</span>
                  <input
                    className="app-input"
                    value={form.management_number}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        management_number: event.target.value,
                      }))
                    }
                    maxLength={100}
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>현장 상태</span>
                  <select
                    className="app-select"
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as SafetySiteStatus,
                        pause_start_date:
                          event.target.value === 'paused' ? current.pause_start_date : '',
                      }))
                    }
                    disabled={busy}
                  >
                    {SITE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {form.status === 'paused' ? (
                  <label className={styles.modalField}>
                    <span className={styles.label}>중지 시작일</span>
                    <input
                      className="app-input"
                      type="date"
                      value={form.pause_start_date}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          pause_start_date: event.target.value,
                        }))
                      }
                      disabled={busy}
                    />
                  </label>
                ) : null}

                <label className={styles.modalField}>
                  <span className={styles.label}>고위험 여부</span>
                  <select
                    className="app-select"
                    value={form.is_high_risk_site ? 'yes' : 'no'}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_high_risk_site: event.target.value === 'yes',
                      }))
                    }
                    disabled={busy}
                  >
                    <option value="no">일반</option>
                    <option value="yes">고위험</option>
                  </select>
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>노동관서</span>
                  <input
                    className="app-input"
                    value={form.labor_office}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, labor_office: event.target.value }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>지도요원</span>
                  <input
                    className="app-input"
                    value={form.guidance_officer_name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        guidance_officer_name: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>점검자</span>
                  <input
                    className="app-input"
                    value={form.inspector_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, inspector_name: event.target.value }))
                    }
                    disabled={busy}
                  />
                </label>

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

                <label className={styles.modalField}>
                  <span className={styles.label}>공사 규모</span>
                  <input
                    className="app-input"
                    value={form.project_scale}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, project_scale: event.target.value }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>공사 종류</span>
                  <input
                    className="app-input"
                    value={form.project_kind}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, project_kind: event.target.value }))
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
                  <span className={styles.label}>기술지도 구분</span>
                  <input
                    className="app-input"
                    value={form.technical_guidance_kind}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        technical_guidance_kind: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.label}>계약 담당자</span>
                  <input
                    className="app-input"
                    value={form.contract_contact_name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contract_contact_name: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
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

                <label className={styles.modalField}>
                  <span className={styles.label}>발주유형 구분</span>
                  <input
                    className="app-input"
                    value={form.order_type_division}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        order_type_division: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>
              </div>
            </div>
          ) : null}
        </section>

        <section className={styles.contentTypePanel}>
          <div className={styles.contentTypeHeader}>
            <div>
              <h3 className={styles.menuTitle}>운영 메모</h3>
            </div>
          </div>
          <div className={styles.modalGrid}>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>운영 메모</span>
              <textarea
                className="app-textarea"
                value={form.memo}
                onChange={(event) =>
                  setForm((current) => ({ ...current, memo: event.target.value }))
                }
                disabled={busy}
                rows={5}
              />
            </label>
          </div>
        </section>
      </div>
    </AppModal>
  );
}
