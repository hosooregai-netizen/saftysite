import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { parseSiteRequiredCompletionFields } from '@/lib/admin/siteContractProfile';
import type { SafetySite } from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';
import { getSiteManagementMissingFields } from '../sites/siteSectionHelpers';

interface HeadquarterSummaryPanelProps {
  headquarter: SafetyHeadquarter;
  sites: SafetySite[];
  onEdit: () => void;
}

function getHeadquarterMissingFields(headquarter: SafetyHeadquarter) {
  const requiredChecks: Array<[string, string | null]> = [
    ['사업장관리번호', headquarter.management_number],
    ['개시번호', headquarter.opening_number],
    ['사업자등록번호', headquarter.business_registration_no],
    ['법인등록번호', headquarter.corporate_registration_no],
    ['면허번호', headquarter.license_no],
    ['대표자명', headquarter.contact_name],
    ['대표 전화', headquarter.contact_phone],
    ['본사 주소', headquarter.address],
  ];

  return requiredChecks
    .filter(([, value]) => !String(value ?? '').trim())
    .map(([label]) => label);
}

function buildRegistrationRows(headquarter: SafetyHeadquarter) {
  return [
    ['사업장관리번호', headquarter.management_number || '-'],
    ['개시번호', headquarter.opening_number || '-'],
    ['사업자등록번호', headquarter.business_registration_no || '-'],
    ['법인등록번호', headquarter.corporate_registration_no || '-'],
    ['면허번호', headquarter.license_no || '-'],
  ] as const;
}

export function HeadquarterSummaryPanel({
  headquarter,
  sites,
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
  const registrationRows = buildRegistrationRows(headquarter);
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderTitleBlock}>
          <div className={styles.sectionHeaderMeta}>사업장 요약</div>
          {missingFields.length ? (
            <div className={styles.contextBadgeRow}>
              <span className={`${styles.contextBadge} ${styles.contextBadgeWarning}`}>
                사업장 보완 {missingFields.length}건
              </span>
            </div>
          ) : null}
        </div>
        <div className={styles.sectionHeaderActions}>
          <button type="button" className="app-button app-button-primary" onClick={onEdit}>
            사업장 정보 수정
          </button>
        </div>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.headquarterOverviewShell}>
          <article className={styles.headquarterOverviewPrimary}>
            <div className={styles.headquarterOverviewHeader}>
              <span className={styles.summaryCardLabel}>사업장 등록 정보</span>
              <strong className={styles.headquarterOverviewTitle}>{headquarter.name}</strong>
            </div>
            <div className={styles.summaryCardList}>
              {registrationRows.map(([label, value]) => (
                <div key={label} className={styles.summaryCardListRow}>
                  <span className={styles.summaryCardListLabel}>{label}</span>
                  <strong className={styles.summaryCardListValue}>{value}</strong>
                </div>
              ))}
            </div>
          </article>
          <div className={styles.headquarterOverviewAside}>
            <article className={styles.contextCell}>
              <span className={styles.contextCellLabel}>대표자</span>
              <strong className={styles.contextCellValue}>{headquarter.contact_name || '-'}</strong>
              <span className={styles.contextCellMeta}>
                {headquarter.contact_phone || '대표 전화 미입력'}
              </span>
            </article>
            <article className={styles.contextCell}>
              <span className={styles.contextCellLabel}>소속 현장</span>
              <strong className={styles.contextCellValue}>{sites.length}개</strong>
              <span className={styles.contextCellMeta}>
                운영중 {activeSiteCount} / 준비중 {plannedSiteCount} / 종료 {closedSiteCount}
              </span>
            </article>
            <article className={styles.contextCell}>
              <span className={styles.contextCellLabel}>데이터 보완</span>
              <strong className={styles.contextCellValue}>
                {siteGapCount + missingFields.length}건
              </strong>
              <span className={styles.contextCellMeta}>
                현장 보완 {siteGapCount} / 메일 미입력 {missingEmailCount}
              </span>
            </article>
            <article className={styles.contextCell}>
              <span className={styles.contextCellLabel}>본사 주소</span>
              <strong className={styles.contextCellValue}>{headquarter.address || '-'}</strong>
              <span className={styles.contextCellMeta}>
                대표 전화 {headquarter.contact_phone || '-'}
              </span>
            </article>
            <article className={styles.contextCell}>
              <span className={styles.contextCellLabel}>등록 상태</span>
              <strong className={styles.contextCellValue}>
                {missingFields.length ? `입력 필요 ${missingFields.length}건` : '기본 정보 입력 완료'}
              </strong>
              {missingFields.length ? (
                <div className={styles.contextCellList}>
                  {missingFields.map((item) => (
                    <span key={item} className={styles.contextCellMeta}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
            <article className={styles.contextCell}>
              <span className={styles.contextCellLabel}>운영 메모</span>
              <strong className={styles.contextCellValue}>{headquarter.memo || '운영 메모 없음'}</strong>
              <span className={styles.contextCellMeta}>
                {missingFields.length ? '빠진 항목을 정리한 뒤 메모를 남겨주세요.' : '사업장 기본 정보 입력 완료'}
              </span>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
