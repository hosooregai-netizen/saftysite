import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { SnapshotInputCell } from './QuarterlyFieldControls';
import { QuarterlySectionHeader } from './QuarterlySectionHeader';

export function QuarterlySiteSnapshotSection(props: {
  draft: QuarterlySummaryReport;
  onChange: (field: keyof QuarterlySummaryReport['siteSnapshot'], value: string) => void;
}) {
  const { draft, onChange } = props;
  const handleSiteManagementNumberChange = (value: string) => {
    onChange('siteManagementNumber', value);
    onChange('businessStartNumber', value);
  };
  const handleCorporationNumberChange = (value: string) => {
    onChange('corporationRegistrationNumber', value);
    onChange('businessRegistrationNumber', value);
  };

  return (
    <article className={operationalStyles.reportCard}>
      <QuarterlySectionHeader title="1. 기술지도 사업장 개요" />
      <div className={operationalStyles.snapshotSectionGrid}>
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
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>현장명</th>
                  <SnapshotInputCell
                    label="현장명"
                    value={draft.siteSnapshot.siteName}
                    onChange={(value) => onChange('siteName', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>사업장관리번호</th>
                  <SnapshotInputCell
                    label="사업장관리번호"
                    value={draft.siteSnapshot.siteManagementNumber || draft.siteSnapshot.businessStartNumber}
                    onChange={handleSiteManagementNumberChange}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>공사기간</th>
                  <SnapshotInputCell
                    label="공사기간"
                    value={draft.siteSnapshot.constructionPeriod}
                    onChange={(value) => onChange('constructionPeriod', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>공사금액</th>
                  <SnapshotInputCell
                    label="공사금액"
                    value={draft.siteSnapshot.constructionAmount}
                    onChange={(value) => onChange('constructionAmount', value)}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>책임자</th>
                  <SnapshotInputCell
                    label="책임자"
                    value={draft.siteSnapshot.siteManagerName}
                    onChange={(value) => onChange('siteManagerName', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>연락처(이메일)</th>
                  <SnapshotInputCell
                    label="연락처(이메일)"
                    value={draft.siteSnapshot.siteContactEmail}
                    onChange={(value) => onChange('siteContactEmail', value)}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>현장 주소</th>
                  <SnapshotInputCell
                    label="현장 주소"
                    value={draft.siteSnapshot.siteAddress}
                    onChange={(value) => onChange('siteAddress', value)}
                    colSpan={3}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>고객명</th>
                  <SnapshotInputCell
                    label="고객명"
                    value={draft.siteSnapshot.customerName}
                    onChange={(value) => onChange('customerName', value)}
                    colSpan={3}
                  />
                </tr>
              </tbody>
            </table>
          </div>
        </section>
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
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>회사명</th>
                  <SnapshotInputCell
                    label="회사명"
                    value={draft.siteSnapshot.companyName}
                    onChange={(value) => onChange('companyName', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>법인등록번호</th>
                  <SnapshotInputCell
                    label="법인등록번호"
                    value={draft.siteSnapshot.corporationRegistrationNumber || draft.siteSnapshot.businessRegistrationNumber}
                    onChange={handleCorporationNumberChange}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>면허번호</th>
                  <SnapshotInputCell
                    label="면허번호"
                    value={draft.siteSnapshot.licenseNumber}
                    onChange={(value) => onChange('licenseNumber', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>연락처</th>
                  <SnapshotInputCell
                    label="본사 연락처"
                    value={draft.siteSnapshot.headquartersContact}
                    onChange={(value) => onChange('headquartersContact', value)}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>본사 주소</th>
                  <SnapshotInputCell
                    label="본사 주소"
                    value={draft.siteSnapshot.headquartersAddress}
                    onChange={(value) => onChange('headquartersAddress', value)}
                    colSpan={3}
                  />
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </article>
  );
}
