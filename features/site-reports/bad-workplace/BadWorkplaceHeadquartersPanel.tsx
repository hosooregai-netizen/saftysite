import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { SnapshotInputCell } from './BadWorkplaceFieldControls';

interface BadWorkplaceHeadquartersPanelProps {
  draft: BadWorkplaceReport;
  onUpdateSiteSnapshot: (
    key: keyof BadWorkplaceReport['siteSnapshot'],
    value: string,
  ) => void;
}

export function BadWorkplaceHeadquartersPanel({
  draft,
  onUpdateSiteSnapshot,
}: BadWorkplaceHeadquartersPanelProps) {
  return (
    <section className={operationalStyles.snapshotPanel}>
      <h3 className={operationalStyles.snapshotPanelTitle}>본사</h3>
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
                회사명
              </th>
              <SnapshotInputCell
                label="회사명"
                value={draft.siteSnapshot.companyName}
                onChange={(value) => onUpdateSiteSnapshot('companyName', value)}
              />
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                면허번호
              </th>
              <SnapshotInputCell
                label="면허번호"
                value={draft.siteSnapshot.licenseNumber}
                onChange={(value) => onUpdateSiteSnapshot('licenseNumber', value)}
              />
            </tr>
            <tr>
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                사업자등록번호
              </th>
              <SnapshotInputCell
                label="사업자등록번호"
                value={draft.siteSnapshot.businessRegistrationNumber}
                onChange={(value) =>
                  onUpdateSiteSnapshot('businessRegistrationNumber', value)
                }
              />
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                사업장관리번호
              </th>
              <SnapshotInputCell
                label="사업장관리번호"
                value={draft.siteSnapshot.siteManagementNumber}
                onChange={(value) => onUpdateSiteSnapshot('siteManagementNumber', value)}
              />
            </tr>
            <tr>
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                주소
              </th>
              <SnapshotInputCell
                label="본사 주소"
                value={draft.siteSnapshot.headquartersAddress}
                onChange={(value) => onUpdateSiteSnapshot('headquartersAddress', value)}
                colSpan={3}
              />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
