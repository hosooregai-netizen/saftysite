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
  const activeAssignmentsByUserId = useMemo(
    () =>
      new Map(
        assignments
          .filter((assignment) => assignment.is_active)
          .map((assignment) => [assignment.user_id, assignment]),
      ),
    [assignments],
  );
  const currentAssignedNames = fieldAgents
    .filter((user) => activeAssignmentsByUserId.has(user.id))
    .map((user) => user.name);

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
          현재 배정: {currentAssignedNames.length > 0 ? currentAssignedNames.join(', ') : '없음'}
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
                    const assignment = activeAssignmentsByUserId.get(user.id) ?? null;
                    return (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.phone || '-'}</td>
                        <td>{user.position || '-'}</td>
                        <td>{assignment ? '현재 배정' : '배정 가능'}</td>
                        <td>
                          <div className={styles.tableActions}>
                            {assignment ? (
                              <button
                                type="button"
                                className="app-button app-button-secondary"
                                onClick={() => void onClear(assignment.id)}
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
