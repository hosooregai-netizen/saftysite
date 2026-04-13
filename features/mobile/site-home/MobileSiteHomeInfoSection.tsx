'use client';

import { getDisplayValue } from './mobileSiteHomeHelpers';
import styles from '../components/MobileShell.module.css';

interface MobileSiteHomeInfoSectionProps {
  companyName: string;
  constructionAmount: string;
  constructionPeriod: string;
  customerName: string;
  headquartersAddress: string;
  headquartersContact: string;
  headquartersContactHref: string | null;
  managerPhone: string;
  managerPhoneHref: string | null;
  managementNumber: string;
  assigneeName: string;
  businessStartNumber: string;
  siteAddress: string;
  siteContact: string;
  siteContactHref: string | null;
  siteManagerName: string;
  showSiteContact: boolean;
}

export function MobileSiteHomeInfoSection(props: MobileSiteHomeInfoSectionProps) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>현장 정보</h2>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>현장 관리번호</span>
          <strong className={styles.metaValue}>{getDisplayValue(props.managementNumber)}</strong>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>사업개시번호</span>
          <strong className={styles.metaValue}>{getDisplayValue(props.businessStartNumber)}</strong>
        </div>
      </div>

      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>고객사</span>
          <strong className={styles.infoValue}>{getDisplayValue(props.customerName)}</strong>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>현장 주소</span>
          <strong className={styles.infoValue}>{getDisplayValue(props.siteAddress)}</strong>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>공사 기간</span>
          <strong className={styles.infoValue}>{getDisplayValue(props.constructionPeriod)}</strong>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>공사 금액</span>
          <strong className={styles.infoValue}>{getDisplayValue(props.constructionAmount)}</strong>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>담당자</span>
          <strong className={styles.infoValue}>{getDisplayValue(props.assigneeName)}</strong>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>현장소장</span>
          <strong className={styles.infoValue}>{getDisplayValue(props.siteManagerName)}</strong>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>연락처</span>
          {props.managerPhoneHref ? (
            <a className={`${styles.infoValue} ${styles.infoValueLink}`} href={props.managerPhoneHref}>
              {props.managerPhone}
            </a>
          ) : (
            <strong className={styles.infoValue}>{getDisplayValue(props.managerPhone)}</strong>
          )}
        </div>
        {props.showSiteContact ? (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>현장 연락처</span>
            {props.siteContactHref ? (
              <a className={`${styles.infoValue} ${styles.infoValueLink}`} href={props.siteContactHref}>
                {props.siteContact}
              </a>
            ) : (
              <strong className={styles.infoValue}>{props.siteContact}</strong>
            )}
          </div>
        ) : null}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>본사</span>
          <strong className={styles.infoValue}>{getDisplayValue(props.companyName)}</strong>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>본사 연락처</span>
          {props.headquartersContactHref ? (
            <a className={`${styles.infoValue} ${styles.infoValueLink}`} href={props.headquartersContactHref}>
              {props.headquartersContact}
            </a>
          ) : (
            <strong className={styles.infoValue}>{getDisplayValue(props.headquartersContact)}</strong>
          )}
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>본사 주소</span>
          <strong className={styles.infoValue}>{getDisplayValue(props.headquartersAddress)}</strong>
        </div>
      </div>
    </section>
  );
}
