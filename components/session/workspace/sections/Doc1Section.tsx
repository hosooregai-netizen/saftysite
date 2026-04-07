import type { OverviewSectionProps } from '@/components/session/workspace/types';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

function renderSnapshotValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : '-';
}

function renderColGroup() {
  return (
    <colgroup>
      <col className={styles.doc1ColGroup} />
      <col className={styles.doc1ColLabel} />
      <col className={styles.doc1ColValue} />
      <col className={styles.doc1ColLabelWide} />
      <col className={styles.doc1ColValue} />
    </colgroup>
  );
}

export default function Doc1Section({
  session,
}: Pick<OverviewSectionProps, 'session'>) {
  const snapshot = session.adminSiteSnapshot;
  const siteName = renderSnapshotValue(snapshot.siteName);
  const siteManagementNumber = renderSnapshotValue(
    snapshot.siteManagementNumber || snapshot.businessStartNumber,
  );
  const constructionPeriod = renderSnapshotValue(snapshot.constructionPeriod);
  const constructionAmount = renderSnapshotValue(snapshot.constructionAmount);
  const siteManagerName = renderSnapshotValue(snapshot.siteManagerName);
  const siteContact = renderSnapshotValue(snapshot.siteContactEmail);
  const siteAddress = renderSnapshotValue(snapshot.siteAddress);

  const companyName = renderSnapshotValue(snapshot.companyName || snapshot.customerName);
  const corporationRegistrationNumber = renderSnapshotValue(
    snapshot.corporationRegistrationNumber || snapshot.businessRegistrationNumber,
  );
  const licenseNumber = renderSnapshotValue(snapshot.licenseNumber);
  const headquartersContact = renderSnapshotValue(snapshot.headquartersContact);
  const headquartersAddress = renderSnapshotValue(snapshot.headquartersAddress);

  return (
    <div className={styles.sectionStack}>
      <article className={styles.tableCard}>
        <div className={styles.doc1TableGroup}>
          <div className={styles.doc1TableWrap}>
            <table className={styles.doc1SnapshotTable}>
              {renderColGroup()}
              <tbody>
                <tr>
                  <th rowSpan={4} scope="rowgroup" className={styles.doc1GroupCell}>
                    현장
                  </th>
                  <th scope="row" className={styles.doc1LabelCell}>
                    현장명
                  </th>
                  <td className={styles.doc1ValueCell}>{siteName}</td>
                  <th scope="row" className={styles.doc1LabelCell}>
                    사업장관리번호
                    <br />
                    (사업개시번호)
                  </th>
                  <td className={styles.doc1ValueCell}>{siteManagementNumber}</td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc1LabelCell}>
                    공사기간
                  </th>
                  <td className={styles.doc1ValueCell}>{constructionPeriod}</td>
                  <th scope="row" className={styles.doc1LabelCell}>
                    공사금액
                  </th>
                  <td className={styles.doc1ValueCell}>{constructionAmount}</td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc1LabelCell}>
                    책임자
                  </th>
                  <td className={styles.doc1ValueCell}>{siteManagerName}</td>
                  <th scope="row" className={styles.doc1LabelCell}>
                    연락처(이메일)
                  </th>
                  <td className={styles.doc1ValueCell}>{siteContact}</td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc1LabelCell}>
                    현장주소
                  </th>
                  <td colSpan={3} className={`${styles.doc1ValueCell} ${styles.doc1AddressCell}`}>
                    {siteAddress}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.doc1TableWrap}>
            <table className={styles.doc1SnapshotTable}>
              {renderColGroup()}
              <tbody>
                <tr>
                  <th rowSpan={3} scope="rowgroup" className={styles.doc1GroupCell}>
                    본사
                  </th>
                  <th scope="row" className={styles.doc1LabelCell}>
                    회사명
                  </th>
                  <td className={styles.doc1ValueCell}>{companyName}</td>
                  <th scope="row" className={styles.doc1LabelCell}>
                    법인등록번호
                    <br />
                    (사업자등록번호)
                  </th>
                  <td className={styles.doc1ValueCell}>{corporationRegistrationNumber}</td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc1LabelCell}>
                    면허번호
                  </th>
                  <td className={styles.doc1ValueCell}>{licenseNumber}</td>
                  <th scope="row" className={styles.doc1LabelCell}>
                    연락처
                  </th>
                  <td className={styles.doc1ValueCell}>{headquartersContact}</td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc1LabelCell}>
                    본사주소
                  </th>
                  <td colSpan={3} className={`${styles.doc1ValueCell} ${styles.doc1AddressCell}`}>
                    {headquartersAddress}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  );
}
