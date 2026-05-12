import Link from 'next/link';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  buildSiteBadWorkplaceHref,
  buildSitePhotoAlbumHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import {
  formatCurrencyValue,
  getControllerSectionHref,
  getSiteStatusLabel,
  SITE_CONTRACT_STATUS_LABELS,
  SITE_CONTRACT_TYPE_LABELS,
} from '@/lib/admin';
import { parseSiteRequiredCompletionFields } from '@/lib/admin/siteContractProfile';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import {
  normalizeSafetyClientContacts,
  normalizeSafetySiteManagers,
} from '@/lib/siteContacts';
import type {
  SafetyClientContact,
  SafetySite,
  SafetySiteManagerContact,
} from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';
import { getSiteManagementMissingFields } from '../sites/siteSectionHelpers';

interface SiteManagementMainPanelProps {
  headquarter: SafetyHeadquarter | null;
  site: SafetySite;
  badWorkplaceHref?: string;
  mailHref?: string;
  photoHref?: string;
  quarterlyHref?: string;
  reportHref?: string;
  siteEditHref?: string;
  /** When false, hides the controller "현장 정보 수정" link (e.g. worker site hub). Default true. */
  showSiteEditAction?: boolean;
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  return `${start || '-'} ~ ${end || '-'}`;
}

function formatCountLabel(value: number | null | undefined, suffix = '회') {
  return value != null ? `${value}${suffix}` : '-';
}

function formatContactMeta(contact: Pick<SafetySiteManagerContact, 'phone' | 'email'>) {
  return [contact.phone, contact.email].filter(Boolean).join(' / ');
}

function renderContactList(
  contacts: Array<SafetySiteManagerContact | SafetyClientContact>,
  primaryLabel?: string,
) {
  if (contacts.length === 0) {
    return '-';
  }
  return (
    <div className={styles.contactList}>
      {contacts.map((contact) => (
        <div key={contact.id} className={styles.contactListItem}>
          <span className={styles.contactListName}>
            {contact.name || contact.phone || contact.email || '-'}
            {'is_primary' in contact && contact.is_primary && primaryLabel ? (
              <span className={styles.contactListBadge}>{primaryLabel}</span>
            ) : null}
          </span>
          {formatContactMeta(contact) ? (
            <span className={styles.contactListMeta}>{formatContactMeta(contact)}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function SiteManagementMainPanel({
  badWorkplaceHref,
  headquarter,
  mailHref,
  photoHref,
  quarterlyHref,
  reportHref,
  site,
  siteEditHref,
  showSiteEditAction = true,
}: SiteManagementMainPanelProps) {
  const assignedUsers =
    site.assigned_users?.length
      ? site.assigned_users.map((user) => user.name)
      : site.assigned_user
        ? [site.assigned_user.name]
        : [];
  const requiredCompletionFields =
    site.required_completion_fields?.length
      ? site.required_completion_fields
      : parseSiteRequiredCompletionFields(site);
  const combinedMissingFields = Array.from(
    new Set([...requiredCompletionFields, ...getSiteManagementMissingFields(site)]),
  );
  const contractTypeLabel =
    SITE_CONTRACT_TYPE_LABELS[
      (site.contract_type ?? '') as keyof typeof SITE_CONTRACT_TYPE_LABELS
    ] || '미입력';
  const contractStatusLabel =
    SITE_CONTRACT_STATUS_LABELS[
      (site.contract_status ?? '') as keyof typeof SITE_CONTRACT_STATUS_LABELS
    ] || '미입력';
  const headquarterName =
    headquarter?.name || site.headquarter_detail?.name || site.headquarter?.name || '-';
  const siteManagerContacts = normalizeSafetySiteManagers(site);
  const clientContacts = normalizeSafetyClientContacts(site);
  const assigneeDisplay = assignedUsers.length > 0 ? assignedUsers.join(', ') : '-';
  const statusMeta = combinedMissingFields.length
    ? `보완 ${combinedMissingFields.length}건`
    : '기본 정보 입력 완료';

  const editHref = siteEditHref ?? getControllerSectionHref('headquarters', {
    editSiteId: site.id,
    headquarterId: site.headquarter_id,
  });
  const resolvedReportHref = reportHref ?? buildSiteReportsHref(site.id);
  const resolvedQuarterlyHref = quarterlyHref ?? buildSiteQuarterlyListHref(site.id);
  const resolvedBadWorkplaceHref =
    badWorkplaceHref ?? buildSiteBadWorkplaceHref(site.id, getCurrentReportMonth());
  const resolvedPhotoHref = photoHref ?? buildSitePhotoAlbumHref(site.id);
  const resolvedMailHref =
    mailHref ??
    `/mailbox?headquarterId=${encodeURIComponent(site.headquarter_id)}&siteId=${encodeURIComponent(site.id)}`;

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderTitleBlock}>
          <div className={styles.sectionHeaderMeta}>{headquarterName}</div>
        </div>
        {showSiteEditAction ? (
          <div className={styles.sectionHeaderActions}>
            <Link href={editHref} className="app-button app-button-primary">
              현장 정보 수정
            </Link>
          </div>
        ) : null}
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.siteMainCardGrid}>
          <article className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <h3 className={styles.detailCardTitle}>현장 개요</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>현장명</span>
                <strong className={styles.detailItemValue}>{site.site_name || '-'}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>운영 상태</span>
                <strong className={styles.detailItemValue}>{getSiteStatusLabel(site.status)}</strong>
                <span className={styles.detailItemMeta}>{statusMeta}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>건설 현장 주소</span>
                <strong className={styles.detailItemValue}>{site.site_address || '-'}</strong>
              </div>
            </div>
          </article>

          <article className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <h3 className={styles.detailCardTitle}>담당 정보</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>현장 책임자</span>
                <div className={styles.detailItemValue}>
                  {renderContactList(siteManagerContacts, '대표')}
                </div>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>담당요원</span>
                <strong className={styles.detailItemValue}>{assigneeDisplay}</strong>
              </div>
            </div>
          </article>

          <article className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <h3 className={styles.detailCardTitle}>공사 정보</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>공사 금액</span>
                <strong className={styles.detailItemValue}>
                  {formatCurrencyValue(site.project_amount)}
                </strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>공사 기간</span>
                <strong className={styles.detailItemValue}>
                  {formatDateRange(site.project_start_date, site.project_end_date)}
                </strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>발주처</span>
                <strong className={styles.detailItemValue}>{site.client_business_name || '-'}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>발주처 담당자</span>
                <div className={styles.detailItemValue}>{renderContactList(clientContacts)}</div>
              </div>
            </div>
          </article>

          <article className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <h3 className={styles.detailCardTitle}>계약 정보</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>계약 유형 / 계약 상태</span>
                <strong className={styles.detailItemValue}>
                  {contractTypeLabel} / {contractStatusLabel}
                </strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>기술지도 대가(총액)</span>
                <strong className={styles.detailItemValue}>
                  {formatCurrencyValue(site.total_contract_amount)}
                </strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>기술지도 횟수</span>
                <strong className={styles.detailItemValue}>{formatCountLabel(site.total_rounds)}</strong>
              </div>
            </div>
          </article>
        </div>

        <div className={styles.siteMainActionGrid}>
          <Link href={resolvedReportHref} className={styles.metricLinkCard}>
            <strong className={styles.metricLinkValue}>기술지도 보고서 목록</strong>
            <span className={styles.metricLinkMeta}>기술지도 보고서 목록으로 이동</span>
          </Link>
          <Link href={resolvedQuarterlyHref} className={styles.metricLinkCard}>
            <strong className={styles.metricLinkValue}>분기 보고서 목록</strong>
            <span className={styles.metricLinkMeta}>분기 보고서 목록으로 이동</span>
          </Link>
          <Link href={resolvedBadWorkplaceHref} className={styles.metricLinkCard}>
            <strong className={styles.metricLinkValue}>불량 사업장 신고</strong>
            <span className={styles.metricLinkMeta}>이번 달 불량 사업장 신고로 이동</span>
          </Link>
          <Link href={resolvedPhotoHref} className={styles.metricLinkCard}>
            <strong className={styles.metricLinkValue}>사진첩</strong>
            <span className={styles.metricLinkMeta}>점검 사진과 현장 이미지 확인</span>
          </Link>
          <Link href={resolvedMailHref} className={styles.metricLinkCard}>
            <strong className={styles.metricLinkValue}>메일함</strong>
            <span className={styles.metricLinkMeta}>현장 기준 메일 작성과 이력 확인</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
