import { PageBackControl } from '@/components/navigation/PageBackControl';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { parseSiteRequiredCompletionFields } from '@/lib/admin/siteContractProfile';
import type { SafetySite } from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';
import { getSiteManagementMissingFields } from '../sites/siteSectionHelpers';

interface HeadquarterSummaryPanelProps {
  headquarter: SafetyHeadquarter;
  sites: SafetySite[];
  onBack: () => void;
  onEdit: () => void;
}

function getHeadquarterMissingFields(headquarter: SafetyHeadquarter) {
  const requiredChecks: Array<[string, string | null]> = [
    ['사업장관리번호', headquarter.management_number],
    ['사업장개시번호', headquarter.opening_number],
    ['사업자등록번호', headquarter.business_registration_no],
    ['법인등록번호', headquarter.corporate_registration_no],
    ['건설업면허/등록번호', headquarter.license_no],
    ['본사 담당자명', headquarter.contact_name],
    ['대표 전화', headquarter.contact_phone],
    ['본사 주소', headquarter.address],
  ];

  return requiredChecks
    .filter(([, value]) => !String(value ?? '').trim())
    .map(([label]) => label);
}

export function HeadquarterSummaryPanel({
  headquarter,
  sites,
  onBack,
  onEdit,
}: HeadquarterSummaryPanelProps) {
  const missingFields = getHeadquarterMissingFields(headquarter);
  const activeSiteCount = sites.filter((site) => site.status === 'active').length;
  const plannedSiteCount = sites.filter((site) => site.status === 'planned').length;
  const closedSiteCount = sites.filter((site) => site.status === 'closed').length;
  const missingEmailCount = sites.filter((site) => !String(site.site_contact_email ?? '').trim()).length;
  const siteGapCount = sites.filter((site) => {
    const requiredCompletionFields =
      site.required_completion_fields?.length
        ? site.required_completion_fields
        : parseSiteRequiredCompletionFields(site);
    const combinedMissingFields = new Set([
      ...requiredCompletionFields,
      ...getSiteManagementMissingFields(site),
    ]);
    return combinedMissingFields.size > 0;
  }).length;

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderTitleBlock}>
          <div className={styles.contextLead}>
            <PageBackControl label="사업장 목록" onClick={onBack} />
          </div>
          <h2 className={styles.sectionTitle}>{headquarter.name}</h2>
          <div className={styles.contextBadgeRow}>
            <span className={`${styles.contextBadge} ${styles.contextBadgeStrong}`}>
              사업장관리번호 {headquarter.management_number || '-'}
            </span>
            <span className={styles.contextBadge}>개시번호 {headquarter.opening_number || '-'}</span>
            {missingFields.length ? (
              <span className={`${styles.contextBadge} ${styles.contextBadgeWarning}`}>
                사업장 보완 {missingFields.length}건
              </span>
            ) : null}
          </div>
        </div>
        <div className={styles.sectionHeaderActions}>
          <button type="button" className="app-button app-button-primary" onClick={onEdit}>
            사업장 정보 수정
          </button>
        </div>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.summaryBar}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryCardLabel}>담당자</span>
            <strong className={styles.summaryCardValue}>{headquarter.contact_name || '-'}</strong>
            <span className={styles.summaryCardMeta}>{headquarter.contact_phone || '대표 전화 미입력'}</span>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryCardLabel}>등록 정보</span>
            <strong className={styles.summaryCardValue}>{headquarter.business_registration_no || '-'}</strong>
            <span className={styles.summaryCardMeta}>
              법인 {headquarter.corporate_registration_no || '-'} / 면허 {headquarter.license_no || '-'}
            </span>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryCardLabel}>소속 현장</span>
            <strong className={styles.summaryCardValue}>{sites.length}개</strong>
            <span className={styles.summaryCardMeta}>
              운영중 {activeSiteCount} / 준비중 {plannedSiteCount} / 종료 {closedSiteCount}
            </span>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryCardLabel}>데이터 보완</span>
            <strong className={styles.summaryCardValue}>
              {siteGapCount + missingFields.length}건
            </strong>
            <span className={styles.summaryCardMeta}>
              현장 보완 {siteGapCount} / 메일 미입력 {missingEmailCount}
            </span>
          </article>
        </div>
        <div className={styles.contextGrid}>
          <article className={styles.contextCell}>
            <span className={styles.contextCellLabel}>본사 주소</span>
            <strong className={styles.contextCellValue}>{headquarter.address || '-'}</strong>
            <span className={styles.contextCellMeta}>대표 전화 {headquarter.contact_phone || '-'}</span>
          </article>
          <article className={styles.contextCell}>
            <span className={styles.contextCellLabel}>등록번호 / 면허</span>
            <strong className={styles.contextCellValue}>
              법인 {headquarter.corporate_registration_no || '-'}
            </strong>
            <span className={styles.contextCellMeta}>면허 {headquarter.license_no || '-'}</span>
          </article>
          <article className={styles.contextCell}>
            <span className={styles.contextCellLabel}>운영 메모</span>
            <strong className={styles.contextCellValue}>{headquarter.memo || '운영 메모 없음'}</strong>
            <span className={styles.contextCellMeta}>
              {missingFields.length ? `미입력: ${missingFields.join(', ')}` : '사업장 기본 정보 입력 완료'}
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}
