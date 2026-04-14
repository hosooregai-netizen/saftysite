'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  formatCurrencyValue,
  SITE_CONTRACT_STATUS_OPTIONS,
  SITE_CONTRACT_TYPE_OPTIONS,
  SITE_STATUS_OPTIONS,
} from '@/lib/admin';
import type { Dispatch, SetStateAction } from 'react';
import type { SafetyHeadquarter, SafetySiteStatus } from '@/types/controller';
import { getDerivedPerVisitAmount, type SiteFormState } from './siteSectionHelpers';

interface SiteEditorModalProps {
  busy: boolean;
  editingId: string | null;
  form: SiteFormState;
  headquarters: SafetyHeadquarter[];
  isCreateReady: boolean;
  lockedHeadquarterId: string | null;
  onClose: () => void;
  onSubmit: () => void;
  setForm: Dispatch<SetStateAction<SiteFormState>>;
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
  const resolvedPerVisitAmount = getDerivedPerVisitAmount(form);

  return (
    <AppModal
      open={editingId !== null}
      title={editingId === 'create' ? '현장 추가' : '현장 수정'}
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
            disabled={busy || (editingId === 'create' && !isCreateReady)}
          >
            {editingId === 'create' ? '생성' : '저장'}
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
            <label className={styles.modalField}>
              <span className={styles.label}>사업장</span>
              <select
                className="app-select"
                value={lockedHeadquarterId ?? form.headquarter_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, headquarter_id: event.target.value }))
                }
                disabled={busy || Boolean(lockedHeadquarterId)}
              >
                <option value="">선택</option>
                {headquarters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>현장명</span>
              <input
                className="app-input"
                value={form.site_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, site_name: event.target.value }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>현장코드</span>
              <input
                className="app-input"
                value={form.site_code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, site_code: event.target.value }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>현장관리번호</span>
              <input
                className="app-input"
                value={form.management_number}
                onChange={(event) =>
                  setForm((current) => ({ ...current, management_number: event.target.value }))
                }
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
            <label className={styles.modalField}>
              <span className={styles.label}>고위험 사업장</span>
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
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>소재지</span>
              <input
                className="app-input"
                value={form.site_address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, site_address: event.target.value }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>현장대리인/소장 메일</span>
              <input
                className="app-input"
                type="email"
                value={form.site_contact_email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, site_contact_email: event.target.value }))
                }
                disabled={busy}
                placeholder="site@example.com"
              />
              <span className={styles.modalHint}>분기 보고서 발송 기본 수신 주소로 사용합니다.</span>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>공사금액</span>
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
              <span className={styles.label}>공사시작일</span>
              <input
                className="app-input"
                type="date"
                value={form.project_start_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, project_start_date: event.target.value }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>공사종료일</span>
              <input
                className="app-input"
                type="date"
                value={form.project_end_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, project_end_date: event.target.value }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>공사규모</span>
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
              <span className={styles.label}>공사종류</span>
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
        </section>

        <section className={styles.contentTypePanel}>
          <div className={styles.contentTypeHeader}>
            <div>
              <h3 className={styles.menuTitle}>연락 및 발주처 정보</h3>
            </div>
          </div>
          <div className={styles.modalGrid}>
            <label className={styles.modalField}>
              <span className={styles.label}>현장소장명</span>
              <input
                className="app-input"
                value={form.manager_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, manager_name: event.target.value }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>현장소장 연락처</span>
              <input
                className="app-input"
                value={form.manager_phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, manager_phone: event.target.value }))
                }
                disabled={busy}
              />
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
              <span className={styles.label}>지도원</span>
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
              <span className={styles.label}>계약담당자</span>
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
              <span className={styles.label}>발주자 사업장관리번호</span>
              <input
                className="app-input"
                value={form.client_management_number}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    client_management_number: event.target.value,
                  }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>발주자 사업자명</span>
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
              <span className={styles.label}>발주자 대표자</span>
              <input
                className="app-input"
                value={form.client_representative_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    client_representative_name: event.target.value,
                  }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>발주자법인등록번호</span>
              <input
                className="app-input"
                value={form.client_corporate_registration_no}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    client_corporate_registration_no: event.target.value,
                  }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>발주자 사업자등록번호</span>
              <input
                className="app-input"
                value={form.client_business_registration_no}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    client_business_registration_no: event.target.value,
                  }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>발주유형구분</span>
              <input
                className="app-input"
                value={form.order_type_division}
                onChange={(event) =>
                  setForm((current) => ({ ...current, order_type_division: event.target.value }))
                }
                disabled={busy}
              />
            </label>
          </div>
        </section>

        <section className={styles.contentTypePanel}>
          <div className={styles.contentTypeHeader}>
            <div>
              <h3 className={styles.menuTitle}>계약 및 단가</h3>
            </div>
          </div>
          <div className={styles.modalGrid}>
            <label className={styles.modalField}>
              <span className={styles.label}>계약유형</span>
              <select
                className="app-select"
                value={form.contract_type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contract_type: event.target.value }))
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
              <span className={styles.label}>계약상태</span>
              <select
                className="app-select"
                value={form.contract_status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contract_status: event.target.value }))
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
              <span className={styles.label}>기술지도 대가</span>
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
                  setForm((current) => ({ ...current, per_visit_amount: event.target.value }))
                }
                disabled={busy}
                placeholder="비우면 총액/횟수로 자동 계산"
              />
              {resolvedPerVisitAmount.source === 'explicit' ? (
                <span className={styles.modalHint}>명시된 회차 단가를 매출 집계에 사용합니다.</span>
              ) : resolvedPerVisitAmount.source === 'derived' ? (
                <span className={styles.modalHint}>
                  자동 계산 단가 {formatCurrencyValue(resolvedPerVisitAmount.value)}를 매출 집계에 사용합니다.
                </span>
              ) : (
                <span className={styles.modalHint}>
                  총 계약금액과 총 회차를 입력하면 회차 단가를 자동 계산합니다.
                </span>
              )}
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>계약시작일</span>
              <input
                className="app-input"
                type="date"
                value={form.contract_start_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contract_start_date: event.target.value }))
                }
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>계약종료일</span>
              <input
                className="app-input"
                type="date"
                value={form.contract_end_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contract_end_date: event.target.value }))
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
                  setForm((current) => ({ ...current, contract_signed_date: event.target.value }))
                }
                disabled={busy}
              />
            </label>
          </div>
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
