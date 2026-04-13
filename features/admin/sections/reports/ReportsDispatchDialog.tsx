'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { getDispatchStatusLabel } from '@/lib/admin/reportMeta';
import { buildDispatchMeta, formatDateTime } from './reportsSectionFilters';
import type { ControllerReportRow, ReportDispatchMeta } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SmsProviderStatus } from '@/types/messages';

interface ReportsDispatchDialogProps {
  currentUserId: string;
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
  currentUserId,
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
              onClick={() =>
                onSaveManual(dispatchRow, {
                  ...buildDispatchMeta(dispatchRow),
                  dispatchStatus: 'sent',
                  sentCompletedAt:
                    buildDispatchMeta(dispatchRow).sentCompletedAt || new Date().toISOString(),
                  sentHistory: [
                    ...buildDispatchMeta(dispatchRow).sentHistory,
                    {
                      id: new Date().toISOString(),
                      memo: '관제에서 발송완료 처리',
                      sentAt: new Date().toISOString(),
                      sentByUserId: currentUserId,
                    },
                  ],
                })
              }
            >
              관제 수동 완료 처리
            </button>
          </>
        ) : undefined
      }
    >
      {dispatchRow ? (
        <div className={styles.sectionBody}>
          <p className={styles.tableSecondary}>
            현재 상태: {getDispatchStatusLabel(buildDispatchMeta(dispatchRow).dispatchStatus)} / 마감일{' '}
            {buildDispatchMeta(dispatchRow).deadlineDate || '-'}
          </p>
          <div className={styles.modalGrid}>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>기본 수신자 정보</span>
              <div className={styles.tableSecondary}>
                {dispatchSite?.site_contact_email
                  ? `${dispatchSite.manager_name || dispatchSite.contract_contact_name || '현장대리인'} · ${dispatchSite.site_contact_email}`
                  : '현장대리인 메일이 등록되지 않았습니다.'}
              </div>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>실제 메일 발송</span>
              <div className={styles.tableSecondary}>
                {buildDispatchMeta(dispatchRow).actualSentAt
                  ? `${formatDateTime(buildDispatchMeta(dispatchRow).actualSentAt || '')} / ${buildDispatchMeta(dispatchRow).actualRecipient || buildDispatchMeta(dispatchRow).recipient || '-'}`
                  : '기록 없음'}
              </div>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>관제 수동 완료</span>
              <div className={styles.tableSecondary}>
                {buildDispatchMeta(dispatchRow).sentCompletedAt
                  ? formatDateTime(buildDispatchMeta(dispatchRow).sentCompletedAt || '')
                  : '기록 없음'}
              </div>
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>수신 확인</span>
              <div className={styles.tableSecondary}>
                {buildDispatchMeta(dispatchRow).readAt
                  ? formatDateTime(buildDispatchMeta(dispatchRow).readAt || '')
                  : '아직 확인되지 않았습니다.'}
              </div>
            </label>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>회신 상태</span>
              <div className={styles.tableSecondary}>
                {buildDispatchMeta(dispatchRow).replyAt
                  ? `${formatDateTime(buildDispatchMeta(dispatchRow).replyAt || '')} / ${buildDispatchMeta(dispatchRow).replySummary || '요약 없음'}`
                  : '아직 회신이 없습니다.'}
              </div>
            </label>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>문자 발송 상태</span>
              <div className={styles.tableSecondary}>
                {smsProviderStatuses.length === 0
                  ? '문자 공급자 상태를 불러오는 중입니다.'
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
          {buildDispatchMeta(dispatchRow).sentHistory.length === 0 ? (
            <div className={styles.tableEmpty}>기록된 발송 이력이 없습니다.</div>
          ) : (
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
                    {buildDispatchMeta(dispatchRow).sentHistory.map((item) => (
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
          )}
        </div>
      ) : null}
    </AppModal>
  );
}
