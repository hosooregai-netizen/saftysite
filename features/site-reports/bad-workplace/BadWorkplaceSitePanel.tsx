import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { SnapshotDualInputCell, SnapshotInputCell } from './BadWorkplaceFieldControls';

interface BadWorkplaceSitePanelProps {
  draft: BadWorkplaceReport;
  onUpdateProgressRate: (value: string) => void;
  onUpdateSiteSnapshot: (
    key: keyof BadWorkplaceReport['siteSnapshot'],
    value: string,
  ) => void;
}

export function BadWorkplaceSitePanel({
  draft,
  onUpdateProgressRate,
  onUpdateSiteSnapshot,
}: BadWorkplaceSitePanelProps) {
  return (
    <section className={operationalStyles.snapshotPanel}>
      <h3 className={operationalStyles.snapshotPanelTitle}>현장</h3>
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
                현장명
              </th>
              <SnapshotInputCell
                label="현장명"
                value={draft.siteSnapshot.siteName}
                onChange={(value) => onUpdateSiteSnapshot('siteName', value)}
              />
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                사업장개시번호
              </th>
              <SnapshotInputCell
                label="사업장개시번호"
                value={draft.siteSnapshot.businessStartNumber}
                onChange={(value) => onUpdateSiteSnapshot('businessStartNumber', value)}
              />
            </tr>
            <tr>
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                공사기간
              </th>
              <SnapshotInputCell
                label="공사기간"
                value={draft.siteSnapshot.constructionPeriod}
                onChange={(value) => onUpdateSiteSnapshot('constructionPeriod', value)}
              />
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                공정률
              </th>
              <SnapshotInputCell
                label="공정률"
                value={draft.progressRate}
                onChange={onUpdateProgressRate}
              />
            </tr>
            <tr>
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                공사금액
              </th>
              <SnapshotInputCell
                label="공사금액"
                value={draft.siteSnapshot.constructionAmount}
                onChange={(value) => onUpdateSiteSnapshot('constructionAmount', value)}
              />
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                책임자(연락처)
              </th>
              <SnapshotDualInputCell
                labels={['책임자', '연락처']}
                values={[
                  draft.siteSnapshot.siteManagerName,
                  draft.siteSnapshot.siteManagerPhone,
                ]}
                onChange={[
                  (value) => onUpdateSiteSnapshot('siteManagerName', value),
                  (value) => onUpdateSiteSnapshot('siteManagerPhone', value),
                ]}
              />
            </tr>
            <tr>
              <th scope="row" className={operationalStyles.snapshotLabelCell}>
                주소
              </th>
              <SnapshotInputCell
                label="현장 주소"
                value={draft.siteSnapshot.siteAddress}
                onChange={(value) => onUpdateSiteSnapshot('siteAddress', value)}
                colSpan={3}
              />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
