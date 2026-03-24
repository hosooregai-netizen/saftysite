import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { InfoTable } from '@/components/session/workspace/widgets';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

export default function Doc1Section({
  session,
}: Pick<OverviewSectionProps, 'session'>) {
  const snapshot = session.adminSiteSnapshot;

  return (
    <div className={styles.sectionStack}>
      <div className={styles.infoTableGrid}>
        <InfoTable
          title="현장 정보"
          rows={[
            { label: '현장명', value: snapshot.siteName },
            {
              label: '사업장관리번호(사업개시번호)',
              value: snapshot.siteManagementNumber || snapshot.businessStartNumber,
            },
            { label: '공사기간', value: snapshot.constructionPeriod },
            { label: '공사금액', value: snapshot.constructionAmount },
            { label: '책임자', value: snapshot.siteManagerName },
            { label: '연락처(이메일)', value: snapshot.siteContactEmail },
            { label: '현장주소', value: snapshot.siteAddress },
          ]}
        />
        <InfoTable
          title="본사 정보"
          rows={[
            { label: '회사명', value: snapshot.companyName || snapshot.customerName },
            {
              label: '법인등록번호(사업자등록번호)',
              value:
                snapshot.corporationRegistrationNumber ||
                snapshot.businessRegistrationNumber,
            },
            { label: '면허번호', value: snapshot.licenseNumber },
            { label: '연락처', value: snapshot.headquartersContact },
            { label: '본사주소', value: snapshot.headquartersAddress },
          ]}
        />
      </div>
    </div>
  );
}
