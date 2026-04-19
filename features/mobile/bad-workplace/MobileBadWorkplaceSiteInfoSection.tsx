'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';
import { BAD_WORKPLACE_NOTICE_TITLE } from '@/lib/erpReports/badWorkplace';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { MobileBadWorkplaceEditableField } from './MobileBadWorkplaceEditableField';

interface MobileBadWorkplaceSiteInfoSectionProps {
  draft: BadWorkplaceReport;
  onUpdateSiteSnapshot: (
    key: keyof BadWorkplaceReport['siteSnapshot'],
    value: string,
  ) => void;
  onUpdateDraft: (updater: (current: BadWorkplaceReport) => BadWorkplaceReport) => void;
}

export function MobileBadWorkplaceSiteInfoSection({
  draft,
  onUpdateSiteSnapshot,
  onUpdateDraft,
}: MobileBadWorkplaceSiteInfoSectionProps) {
  return (
    <section className={styles.mobileEditorCard}>
      <div className={styles.mobileImplementationListHeader}>
        <div className={styles.mobileImplementationListTitle}>2. 현장 / 본사 기본정보</div>
      </div>

      <div className={styles.inlineNotice}>
        <strong style={{ display: 'block', marginBottom: '4px' }}>
          {BAD_WORKPLACE_NOTICE_TITLE}
        </strong>
      </div>

      <div className={styles.mobileImplementationList}>
        <article className={styles.mobileImplementationItem}>
          <div className={styles.mobileEditorCardTitle}>현장</div>
          <div className={styles.mobileImplementationFieldGrid}>
            <MobileBadWorkplaceEditableField
              label="현장명"
              value={draft.siteSnapshot.siteName}
              onChange={(value) => onUpdateSiteSnapshot('siteName', value)}
            />
            <MobileBadWorkplaceEditableField
              label="사업개시번호"
              value={draft.siteSnapshot.businessStartNumber}
              onChange={(value) => onUpdateSiteSnapshot('businessStartNumber', value)}
            />
            <MobileBadWorkplaceEditableField
              label="공사기간"
              value={draft.siteSnapshot.constructionPeriod}
              onChange={(value) => onUpdateSiteSnapshot('constructionPeriod', value)}
            />
            <MobileBadWorkplaceEditableField
              label="공정률"
              value={draft.progressRate}
              onChange={(value) => onUpdateDraft((current) => ({ ...current, progressRate: value }))}
            />
            <MobileBadWorkplaceEditableField
              label="공사금액"
              value={draft.siteSnapshot.constructionAmount}
              onChange={(value) => onUpdateSiteSnapshot('constructionAmount', value)}
            />
            <MobileBadWorkplaceEditableField
              label="현장소장"
              value={draft.siteSnapshot.siteManagerName}
              onChange={(value) => onUpdateSiteSnapshot('siteManagerName', value)}
            />
            <MobileBadWorkplaceEditableField
              label="현장 연락처"
              value={draft.siteSnapshot.siteManagerPhone}
              onChange={(value) => onUpdateSiteSnapshot('siteManagerPhone', value)}
            />
            <MobileBadWorkplaceEditableField
              label="현장 주소"
              value={draft.siteSnapshot.siteAddress}
              wide
              onChange={(value) => onUpdateSiteSnapshot('siteAddress', value)}
            />
          </div>
        </article>

        <article className={styles.mobileImplementationItem}>
          <div className={styles.mobileEditorCardTitle}>본사</div>
          <div className={styles.mobileImplementationFieldGrid}>
            <MobileBadWorkplaceEditableField
              label="회사명"
              value={draft.siteSnapshot.companyName}
              onChange={(value) => onUpdateSiteSnapshot('companyName', value)}
            />
            <MobileBadWorkplaceEditableField
              label="면허번호"
              value={draft.siteSnapshot.licenseNumber}
              onChange={(value) => onUpdateSiteSnapshot('licenseNumber', value)}
            />
            <MobileBadWorkplaceEditableField
              label="사업자등록번호"
              value={draft.siteSnapshot.businessRegistrationNumber}
              onChange={(value) => onUpdateSiteSnapshot('businessRegistrationNumber', value)}
            />
            <MobileBadWorkplaceEditableField
              label="사업관리번호"
              value={draft.siteSnapshot.siteManagementNumber}
              onChange={(value) => onUpdateSiteSnapshot('siteManagementNumber', value)}
            />
            <MobileBadWorkplaceEditableField
              label="본사 주소"
              value={draft.siteSnapshot.headquartersAddress}
              wide
              onChange={(value) => onUpdateSiteSnapshot('headquartersAddress', value)}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
