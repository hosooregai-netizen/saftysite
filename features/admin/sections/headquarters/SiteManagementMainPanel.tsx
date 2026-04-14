import Link from 'next/link';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  formatCurrencyValue,
  getControllerSectionHref,
  getSiteStatusLabel,
  SITE_CONTRACT_STATUS_LABELS,
  SITE_CONTRACT_TYPE_LABELS,
} from '@/lib/admin';
import {
  parseSiteRequiredCompletionFields,
  resolveSiteRevenueProfile,
} from '@/lib/admin/siteContractProfile';
import type { SafetySite } from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';
import { getSiteManagementMissingFields } from '../sites/siteSectionHelpers';

interface SiteManagementMainPanelProps {
  headquarter: SafetyHeadquarter | null;
  site: SafetySite;
}

export function SiteManagementMainPanel({
  headquarter,
  site,
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
  const revenueProfile = resolveSiteRevenueProfile(site);
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
  const headquarterManagementNumber =
    headquarter?.management_number || site.headquarter_detail?.management_number || '-';
  const headquarterOpeningNumber =
    headquarter?.opening_number || site.headquarter_detail?.opening_number || '-';
  const headquarterContactName =
    headquarter?.contact_name || site.headquarter_detail?.contact_name || '-';
  const headquarterContactPhone =
    headquarter?.contact_phone || site.headquarter_detail?.contact_phone || '-';
  const headquarterAddress = headquarter?.address || site.headquarter_detail?.address || '-';
  const editHref = getControllerSectionHref('headquarters', {
    editSiteId: site.id,
    headquarterId: site.headquarter_id,
  });
  const reportHref = getControllerSectionHref('reports', {
    headquarterId: site.headquarter_id,
    siteId: site.id,
  });
  const mailboxHref = getControllerSectionHref('mailbox', {
    headquarterId: site.headquarter_id,
    siteId: site.id,
  });
  const photoHref = getControllerSectionHref('photos', {
    headquarterId: site.headquarter_id,
    siteId: site.id,
  });
  const scheduleHref = getControllerSectionHref('schedules', {
    siteId: site.id,
  });

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderTitleBlock}>
          <span className={styles.sectionHeaderMeta}>{headquarterName}</span>
          <div className={styles.contextBadgeRow}>
            <span className={`${styles.contextBadge} ${styles.contextBadgeStrong}`}>현장 메인</span>
            <span className={styles.contextBadge}>운영 {getSiteStatusLabel(site.status)}</span>
            <span className={styles.contextBadge}>
              계약 {contractTypeLabel} · {contractStatusLabel}
            </span>
            {site.is_high_risk_site ? (
              <span className={`${styles.contextBadge} ${styles.contextBadgeWarning}`}>고위험 사업장</span>
            ) : null}
          </div>
        </div>
        <div className={styles.sectionHeaderActions}>
          <Link href={editHref} className="app-button app-button-primary">
            현장 정보 수정
          </Link>
        </div>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.summaryBar}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryCardLabel}>운영 상태</span>
            <strong className={styles.summaryCardValue}>{getSiteStatusLabel(site.status)}</strong>
            <span className={styles.summaryCardMeta}>
              {site.is_high_risk_site ? '고위험 사업장' : '일반 사업장'}
            </span>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryCardLabel}>계약 진행</span>
            <strong className={styles.summaryCardValue}>{contractTypeLabel}</strong>
            <span className={styles.summaryCardMeta}>상태 {contractStatusLabel}</span>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryCardLabel}>배정 및 담당</span>
            <strong className={styles.summaryCardValue}>
              {assignedUsers.length ? `${assignedUsers.length}명` : '미배정'}
            </strong>
            <span className={styles.summaryCardMeta}>
              {assignedUsers.length ? assignedUsers.join(', ') : '지도요원 배정이 필요합니다.'}
            </span>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryCardLabel}>데이터 보완</span>
            <strong className={styles.summaryCardValue}>
              {combinedMissingFields.length ? `${combinedMissingFields.length}건` : '완료'}
            </strong>
            <span className={styles.summaryCardMeta}>
              {combinedMissingFields.length ? '현장 관리 정보 보완 필요' : '현장 관리 기준 충족'}
            </span>
          </article>
        </div>

        <div className={styles.detailShell}>
          <div className={styles.detailShellMain}>
            <article className={styles.detailCard}>
              <div className={styles.detailCardHeader}>
                <h3 className={styles.detailCardTitle}>연락 및 발송 기준</h3>
              </div>
              <div className={styles.detailTwoColumnList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>현장소장</span>
                  <strong className={styles.detailItemValue}>{site.manager_name || '-'}</strong>
                  <span className={styles.detailItemMeta}>{site.manager_phone || '연락처 미입력'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>현장대리인 메일</span>
                  <strong className={styles.detailItemValue}>{site.site_contact_email || '-'}</strong>
                  <span className={styles.detailItemMeta}>분기 보고서 기본 수신 주소</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>계약담당자 / 점검자</span>
                  <strong className={styles.detailItemValue}>
                    {site.contract_contact_name || '-'} / {site.inspector_name || '-'}
                  </strong>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>노동관서 / 지도원</span>
                  <strong className={styles.detailItemValue}>
                    {site.labor_office || '-'} / {site.guidance_officer_name || '-'}
                  </strong>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>발주처</span>
                  <strong className={styles.detailItemValue}>{site.client_business_name || '-'}</strong>
                  <span className={styles.detailItemMeta}>
                    대표 {site.client_representative_name || '-'} / 관리번호 {site.client_management_number || '-'}
                  </span>
                </div>
              </div>
            </article>

            <article className={styles.detailCard}>
              <div className={styles.detailCardHeader}>
                <h3 className={styles.detailCardTitle}>계약 및 현장 데이터</h3>
              </div>
              <div className={styles.detailTwoColumnList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>현장 코드 / 관리번호</span>
                  <strong className={styles.detailItemValue}>
                    {site.site_code || '-'} / {site.management_number || '-'}
                  </strong>
                  <span className={styles.detailItemMeta}>{site.site_address || '주소 미입력'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>계약유형 / 계약상태</span>
                  <strong className={styles.detailItemValue}>
                    {contractTypeLabel} / {contractStatusLabel}
                  </strong>
                  <span className={styles.detailItemMeta}>
                    계약 {site.contract_start_date || '-'} ~ {site.contract_end_date || '-'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>기술지도 대가 / 회차당 단가</span>
                  <strong className={styles.detailItemValue}>
                    {formatCurrencyValue(site.total_contract_amount)} /{' '}
                    {revenueProfile.resolvedPerVisitAmount != null
                      ? formatCurrencyValue(revenueProfile.resolvedPerVisitAmount)
                      : '-'}
                  </strong>
                  <span className={styles.detailItemMeta}>총 {site.total_rounds ?? '-'}회</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>공사 정보</span>
                  <strong className={styles.detailItemValue}>
                    {formatCurrencyValue(site.project_amount)}
                  </strong>
                  <span className={styles.detailItemMeta}>
                    기간 {site.project_start_date || '-'} ~ {site.project_end_date || '-'} /{' '}
                    {site.project_kind || '공사종류 미입력'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>기술지도 구분</span>
                  <strong className={styles.detailItemValue}>
                    {site.technical_guidance_kind || '-'}
                  </strong>
                </div>
              </div>
            </article>
          </div>

          <div className={styles.detailShellRail}>
            <article className={styles.detailCard}>
              <div className={styles.detailCardHeader}>
                <h3 className={styles.detailCardTitle}>사업장 컨텍스트</h3>
              </div>
              <div className={styles.detailList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>사업장</span>
                  <strong className={styles.detailItemValue}>{headquarterName}</strong>
                  <span className={styles.detailItemMeta}>
                    관리번호 {headquarterManagementNumber} / 개시번호 {headquarterOpeningNumber}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>본사 담당</span>
                  <strong className={styles.detailItemValue}>{headquarterContactName}</strong>
                  <span className={styles.detailItemMeta}>{headquarterContactPhone}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>본사 주소</span>
                  <strong className={styles.detailItemValue}>{headquarterAddress}</strong>
                </div>
              </div>
            </article>

            <article className={styles.detailCard}>
              <div className={styles.detailCardHeader}>
                <h3 className={styles.detailCardTitle}>보완 체크</h3>
              </div>
              {combinedMissingFields.length ? (
                <div className={styles.detailChipRow}>
                  {combinedMissingFields.map((item) => (
                    <span key={item} className={styles.detailChip}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>현재 기준에서 누락된 관리 데이터가 없습니다.</div>
              )}
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>운영 메모</span>
                <strong className={styles.detailItemValue}>{site.memo || '운영 메모 없음'}</strong>
              </div>
            </article>

            <article className={styles.detailCard}>
              <div className={styles.detailCardHeader}>
                <h3 className={styles.detailCardTitle}>빠른 이동</h3>
              </div>
              <div className={styles.insightActions}>
                <Link href={reportHref} className="app-button app-button-secondary">
                  관리자 보고서
                </Link>
                <Link href={mailboxHref} className="app-button app-button-secondary">
                  메일함
                </Link>
                <Link href={photoHref} className="app-button app-button-secondary">
                  사진첩
                </Link>
                <Link href={scheduleHref} className="app-button app-button-secondary">
                  일정 관리
                </Link>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
