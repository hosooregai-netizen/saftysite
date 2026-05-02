'use client';

import { useMemo } from 'react';
import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { isFieldAgentUserRole } from '@/lib/admin';
import type { SafetyUser } from '@/types/backend';
import type { SafetyHeadquarter, SafetyHeadquarterAssignment } from '@/types/controller';

interface HeadquarterAssignmentModalProps {
  assignments: SafetyHeadquarterAssignment[];
  busy: boolean;
  headquarter: SafetyHeadquarter | null;
  open: boolean;
  users: SafetyUser[];
  onAssign: (headquarterId: string, userId: string) => Promise<void>;
  onClear: (assignmentId: string) => Promise<void>;
  onClose: () => void;
}

export function HeadquarterAssignmentModal({
  assignments,
  busy,
  headquarter,
  open,
  users,
  onAssign,
  onClear,
  onClose,
}: HeadquarterAssignmentModalProps) {
  const fieldAgents = users.filter((user) => isFieldAgentUserRole(user.role) && user.is_active);
  const currentAssignment = useMemo(
    () => assignments.find((assignment) => assignment.is_active) ?? null,
    [assignments],
  );
  const currentAssignedUserId = currentAssignment?.user_id ?? null;
  const currentAssignedName =
    fieldAgents.find((user) => user.id === currentAssignedUserId)?.name ??
    currentAssignment?.user?.name ??
    (currentAssignedUserId ? '지도요원 1명' : '없음');
  const hasCurrentAssignment = Boolean(currentAssignedUserId);

  return (
    <AppModal
      open={open}
      title={headquarter ? `${headquarter.name} 지도요원 배정` : '지도요원 배정'}
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
          현재 배정: {currentAssignedName}
        </p>
        <p className={styles.modalHint}>
          건설사에는 지도요원 1명만 배정됩니다. 다른 지도요원을 배정하면 현재 배정이 교체됩니다.
        </p>
        <div className={styles.tableShell}>
          {fieldAgents.length === 0 ? (
            <div className={styles.tableEmpty}>
              {busy ? '지도요원 정보를 불러오는 중입니다.' : '배정 가능한 지도요원이 없습니다.'}
            </div>
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
                    const isAssigned = user.id === currentAssignedUserId;
                    return (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.phone || '-'}</td>
                        <td>{user.position || '-'}</td>
                        <td>
                          {isAssigned
                            ? '현재 배정'
                            : hasCurrentAssignment
                              ? '교체 가능'
                              : '배정 가능'}
                        </td>
                        <td>
                          <div className={styles.tableActions}>
                            {isAssigned && currentAssignment ? (
                              <button
                                type="button"
                                className="app-button app-button-secondary"
                                onClick={() => void onClear(currentAssignment.id)}
                                disabled={busy}
                              >
                                해제
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="app-button app-button-primary"
                                onClick={() =>
                                  headquarter && void onAssign(headquarter.id, user.id)
                                }
                                disabled={busy}
                              >
                                {hasCurrentAssignment ? '교체' : '배정'}
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
