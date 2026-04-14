'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  getDeliveryStatusLabel,
  getDispatchMethodLabel,
  getDispatchStatusLabel,
} from '@/lib/admin/reportMeta';
import { buildDispatchMeta, formatDateTime } from './reportsSectionFilters';
import type { ControllerReportRow, ReportDispatchMeta } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SmsProviderStatus } from '@/types/messages';

interface ReportsDispatchDialogProps {
  buildManualDispatchPayload: (row: ControllerReportRow) => ReportDispatchMeta;
  dispatchRow: ControllerReportRow | null;
  dispatchSite: SafetySite | null;
  dispatchSmsMessage: string;
  dispatchSmsPhone: string;
  dispatchSmsSending: boolean;
  onClose: () => void;
  onSaveManual: (row: ControllerReportRow, nextDispatch: ReportDispatchMeta) => void;
  onSendSms: () => void;
  setDispatchSmsMessage: (value: string) => void;
  setDispatchSmsPhone: (value: string) => void;
  smsProviderStatuses: SmsProviderStatus[];
  users: SafetyUser[];
}

export function ReportsDispatchDialog({
  buildManualDispatchPayload,
  dispatchRow,
  dispatchSite,
  dispatchSmsMessage,
  dispatchSmsPhone,
  dispatchSmsSending,
  onClose,
  onSaveManual,
  onSendSms,
  setDispatchSmsMessage,
  setDispatchSmsPhone,
  smsProviderStatuses,
  users,
}: ReportsDispatchDialogProps) {
  const dispatchMeta = dispatchRow ? buildDispatchMeta(dispatchRow) : null;
  const dispatchSignal = dispatchRow?.dispatchSignal || dispatchRow?.dispatchStatus || '';
  const checkedByName =
    dispatchMeta?.dispatchCheckedBy
      ? users.find((user) => user.id === dispatchMeta.dispatchCheckedBy)?.name ||
        dispatchMeta.dispatchCheckedBy
      : '-';

  return (
    <AppModal
      open={Boolean(dispatchRow)}
      title="분기 보고서 발송 이력"
      onClose={onClose}
      actions={
        dispatchRow ? (
          <>
            <button type="button" className="app-button app-button-secondary" onClick={onClose}>
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => onSaveManual(dispatchRow, buildManualDispatchPayload(dispatchRow))}
            >
              수동 발송 완료 처리
            </button>
          </>
        ) : undefined
      }
    >
      {dispatchRow ? (
        <div className={styles.sectionBody}>
          <p className={styles.tableSecondary}>
            현재 신호: {getDispatchStatusLabel(dispatchSignal)} / 마감일 {dispatchRow.deadlineDate || '-'}
          </p>
          <div className={styles.modalGrid}>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>기본 수신 대상</span>
              <div className={styles.tableSecondary}>
                {dispatchSite?.site_contact_email
                  ? `${dispatchSite.manager_name || dispatchSite.contract_contact_name || '현장 담당자'} · ${dispatchSite.site_contact_email}`
                  : '현장 수신 메일이 등록되어 있지 않습니다.'}
              </div>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>발송 처리 상태</span>
              <div className={styles.tableSecondary}>
                {dispatchMeta
                  ? `${getDeliveryStatusLabel(dispatchMeta.dispatchStatus)} / ${getDispatchMethodLabel(dispatchMeta.dispatchMethod)}`
                  : '기록 없음'}
              </div>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>실제 메일 발송</span>
              <div className={styles.tableSecondary}>
                {dispatchMeta?.dispatchedAt
                  ? `${formatDateTime(dispatchMeta.dispatchedAt)} / ${dispatchMeta.actualRecipient || dispatchMeta.recipient || '-'}`
                  : '기록 없음'}
              </div>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>수동 체크</span>
              <div className={styles.tableSecondary}>
                {dispatchMeta?.dispatchCheckedAt
                  ? `${formatDateTime(dispatchMeta.dispatchCheckedAt)} / ${checkedByName}`
                  : '기록 없음'}
              </div>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>수신 확인</span>
              <div className={styles.tableSecondary}>
                {dispatchMeta?.readAt
                  ? formatDateTime(dispatchMeta.readAt)
                  : '아직 수신 확인 기록이 없습니다.'}
              </div>
            </label>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>회신 상태</span>
              <div className={styles.tableSecondary}>
                {dispatchMeta?.replyAt
                  ? `${formatDateTime(dispatchMeta.replyAt)} / ${dispatchMeta.replySummary || '요약 없음'}`
                  : '아직 회신 기록이 없습니다.'}
              </div>
            </label>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>문자 발송 상태</span>
              <div className={styles.tableSecondary}>
                {smsProviderStatuses.length === 0
                  ? '문자 발송 공급자 상태를 불러오는 중입니다.'
                  : smsProviderStatuses.map((provider) => provider.message).join(' / ')}
              </div>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>수신 번호</span>
              <input
                className="app-input"
                type="tel"
                value={dispatchSmsPhone}
                onChange={(event) => setDispatchSmsPhone(event.target.value)}
                placeholder="01012345678"
              />
            </label>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>문자 내용</span>
              <textarea
                className="app-textarea"
                rows={5}
                value={dispatchSmsMessage}
                onChange={(event) => setDispatchSmsMessage(event.target.value)}
              />
            </label>
            <div className={styles.sectionActions}>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={onSendSms}
                disabled={
                  dispatchSmsSending ||
                  !dispatchSmsPhone.trim() ||
                  !dispatchSmsMessage.trim() ||
                  smsProviderStatuses.some((provider) => !provider.sendEnabled)
                }
              >
                {dispatchSmsSending ? '문자 발송 중...' : '문자 발송'}
              </button>
            </div>
          </div>
          {dispatchMeta?.sentHistory.length ? (
            <div className={styles.tableShell}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>발송 시각</th>
                      <th>발송자</th>
                      <th>메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchMeta.sentHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{formatDateTime(item.sentAt)}</td>
                        <td>
                          {users.find((user) => user.id === item.sentByUserId)?.name || item.sentByUserId || '-'}
                        </td>
                        <td>{item.memo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className={styles.tableEmpty}>기록된 발송 이력이 없습니다.</div>
          )}
        </div>
      ) : null}
    </AppModal>
  );
}
