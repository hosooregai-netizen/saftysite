import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { SnapshotInputCell } from './BadWorkplaceFieldControls';

interface BadWorkplaceNotificationPanelProps {
  draft: BadWorkplaceReport;
  onUpdateDraft: (updater: (current: BadWorkplaceReport) => BadWorkplaceReport) => void;
}

export function BadWorkplaceNotificationPanel({
  draft,
  onUpdateDraft,
}: BadWorkplaceNotificationPanelProps) {
  return (
    <section className={operationalStyles.snapshotPanel}>
      <h3 className={operationalStyles.snapshotPanelTitle}>통보 정보</h3>
      <div className={operationalStyles.snapshotTableWrap}>
        <table className={operationalStyles.snapshotTable}>
          <colgroup>
            <col className={operationalStyles.snapshotLabelCol} />
            <col className={operationalStyles.snapshotValueCol} />
            <col className={operationalStyles.snapshotLabelCol} />
            <col className={operationalStyles.snapshotValueCol} />
          </colgroup>
          <tbody>
            <tr>
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                개선 지도일
              </th>
              <SnapshotInputCell
                label="개선 지도일"
                value={draft.guidanceDate}
                onChange={(value) =>
                  onUpdateDraft((current) => ({ ...current, guidanceDate: value }))
                }
              />
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                이행 확인일
              </th>
              <SnapshotInputCell
                label="이행 확인일"
                value={draft.confirmationDate}
                placeholder="오늘 날짜가 기본 입력됩니다"
                onChange={(value) =>
                  onUpdateDraft((current) => ({ ...current, confirmationDate: value }))
                }
              />
            </tr>
            <tr>
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                담당 요원
              </th>
              <SnapshotInputCell
                label="담당 요원"
                value={draft.reporterName}
                onChange={(value) =>
                  onUpdateDraft((current) => ({ ...current, reporterName: value }))
                }
              />
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                연락처
              </th>
              <SnapshotInputCell
                label="담당 요원 연락처"
                value={draft.assigneeContact}
                placeholder="원본 작성자 연락처를 확인해 입력"
                onChange={(value) =>
                  onUpdateDraft((current) => ({ ...current, assigneeContact: value }))
                }
              />
            </tr>
            <tr>
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                통보일
              </th>
              <SnapshotInputCell
                label="통보일"
                value={draft.notificationDate}
                onChange={(value) =>
                  onUpdateDraft((current) => ({ ...current, notificationDate: value }))
                }
              />
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                지방노동청(지청)장
              </th>
              <SnapshotInputCell
                label="지방노동청(지청)장"
                value={draft.recipientOfficeName}
                placeholder="관할 지방노동청(지청)장을 입력"
                onChange={(value) =>
                  onUpdateDraft((current) => ({ ...current, recipientOfficeName: value }))
                }
              />
            </tr>
            <tr>
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                대표자
              </th>
              <SnapshotInputCell
                label="대표자"
                value={draft.agencyRepresentative}
                placeholder="기관 대표자명을 입력"
                onChange={(value) =>
                  onUpdateDraft((current) => ({ ...current, agencyRepresentative: value }))
                }
              />
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                첨부서류
              </th>
              <SnapshotInputCell
                label="첨부서류"
                value={draft.attachmentDescription}
                onChange={(value) =>
                  onUpdateDraft((current) => ({ ...current, attachmentDescription: value }))
                }
              />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
