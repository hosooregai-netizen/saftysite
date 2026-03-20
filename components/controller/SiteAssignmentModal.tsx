'use client';

import AppModal from '@/components/ui/AppModal';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SafetyAssignment } from '@/types/controller';

interface SiteAssignmentModalProps {
  busy: boolean;
  styles: Record<string, string>;
  open: boolean;
  site: SafetySite | null;
  users: SafetyUser[];
  currentAssignment: SafetyAssignment | null;
  onClose: () => void;
  onAssign: (siteId: string, userId: string) => Promise<void>;
  onClear: (siteId: string) => Promise<void>;
}

export default function SiteAssignmentModal(props: SiteAssignmentModalProps) {
  const { busy, styles, open, site, users, currentAssignment, onClose, onAssign, onClear } = props;
  const fieldAgents = users.filter((user) => user.role === 'field_agent' && user.is_active);

  return (
    <AppModal
      open={open}
      title={site ? `${site.site_name} 지도요원 배정` : '지도요원 배정'}
      size="large"
      onClose={onClose}
      actions={<button type="button" className="app-button app-button-secondary" onClick={onClose} disabled={busy}>닫기</button>}
    >
      <div className={styles.modalForm}>
        <p className={styles.modalHint}>
          현재 배정: {currentAssignment?.user?.name || site?.assigned_user?.name || '없음'}
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
                    <th>직책</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldAgents.map((user) => {
                    const isCurrent = currentAssignment?.user_id === user.id || site?.assigned_user?.id === user.id;
                    return (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.phone || '-'}</td>
                        <td>{user.position || '-'}</td>
                        <td>{isCurrent ? '현재 배정' : '배정 가능'}</td>
                        <td>
                          <div className={styles.tableActions}>
                            <button type="button" className="app-button app-button-primary" onClick={() => site && void onAssign(site.id, user.id)} disabled={busy || isCurrent}>배정</button>
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
        {site ? (
          <div className={styles.sectionHeaderActions}>
            <button type="button" className="app-button app-button-danger" onClick={() => void onClear(site.id)} disabled={busy || !currentAssignment}>배정 해제</button>
          </div>
        ) : null}
      </div>
    </AppModal>
  );
}
