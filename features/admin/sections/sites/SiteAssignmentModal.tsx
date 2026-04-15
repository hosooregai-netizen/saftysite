'use client';

import { useMemo } from 'react';
import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { isFieldAgentUserRole } from '@/lib/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';

interface SiteAssignmentModalProps {
  busy: boolean;
  open: boolean;
  site: SafetySite | null;
  users: SafetyUser[];
  currentAssignedUserIds: string[];
  onClose: () => void;
  onAssign: (siteId: string, userId: string) => Promise<void>;
  onClear: (siteId: string, userId: string) => Promise<void>;
}

export function SiteAssignmentModal(props: SiteAssignmentModalProps) {
  const { busy, open, site, users, currentAssignedUserIds, onClose, onAssign, onClear } = props;
  const fieldAgents = users.filter((user) => isFieldAgentUserRole(user.role) && user.is_active);
  const activeAssignmentUserIds = useMemo(
    () => new Set(currentAssignedUserIds),
    [currentAssignedUserIds],
  );
  const currentAssignedNames = fieldAgents
    .filter((user) => activeAssignmentUserIds.has(user.id))
    .map((user) => user.name);

  return (
    <AppModal
      open={open}
      title={site ? `${site.site_name} 지도요원 배정` : '지도요원 배정'}
      size="large"
      onClose={onClose}
      actions={
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={onClose}
          disabled={busy}
        >
          닫기
        </button>
      }
    >
      <div className={styles.modalForm}>
        <p className={styles.modalHint}>
          현재 배정: {currentAssignedNames.length > 0 ? currentAssignedNames.join(', ') : '없음'}
        </p>
        <p className={styles.modalHint}>
          같은 현장에는 여러 지도요원을 동시에 배정할 수 있고, 배정된 지도요원은 해당 현장
          보고서를 함께 조회합니다.
        </p>
        <div className={styles.tableShell}>
          {fieldAgents.length === 0 ? (
            <div className={styles.tableEmpty}>배정 가능한 지도요원이 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>지도요원</th>
                    <th>연락처</th>
                    <th>직급</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldAgents.map((user) => {
                    const isAssigned = activeAssignmentUserIds.has(user.id);
                    return (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.phone || '-'}</td>
                        <td>{user.position || '-'}</td>
                        <td>{isAssigned ? '현재 배정' : '배정 가능'}</td>
                        <td>
                          <div className={styles.tableActions}>
                            {isAssigned ? (
                              <button
                                type="button"
                                className="app-button app-button-secondary"
                                onClick={() => site && void onClear(site.id, user.id)}
                                disabled={busy}
                              >
                                해제
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="app-button app-button-primary"
                                onClick={() => site && void onAssign(site.id, user.id)}
                                disabled={busy}
                              >
                                배정
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
}
