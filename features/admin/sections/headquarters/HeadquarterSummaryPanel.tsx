import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetySite } from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';

interface HeadquarterSummaryPanelProps {
  headquarter: SafetyHeadquarter;
  sites: SafetySite[];
  onEdit: () => void;
  onOpenAssignment: () => void;
}

function buildRegistrationRows(headquarter: SafetyHeadquarter) {
  return [
    ['사업장관리번호', headquarter.management_number || '-'],
    ['사업개시번호', headquarter.opening_number || '-'],
    ['사업자등록번호', headquarter.business_registration_no || '-'],
    ['법인등록번호', headquarter.corporate_registration_no || '-'],
  ] as const;
}

export function HeadquarterSummaryPanel({
  headquarter,
  sites,
  onEdit,
  onOpenAssignment,
}: HeadquarterSummaryPanelProps) {
  const activeSiteCount = sites.filter((site) => site.status === 'active').length;
  const plannedSiteCount = sites.filter((site) => site.status === 'planned').length;
  const closedSiteCount = sites.filter((site) => site.status === 'closed').length;
  const registrationRows = buildRegistrationRows(headquarter);
  const contactDetails = [
    headquarter.contact_phone ? `연락처 ${headquarter.contact_phone}` : '',
    headquarter.contact_email ? `이메일 ${headquarter.contact_email}` : '',
  ].filter(Boolean);

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderTitleBlock}>
          <div className={styles.sectionHeaderMeta}>건설사 요약</div>
        </div>
        <div className={styles.sectionHeaderActions}>
          <button type="button" className="app-button app-button-secondary" onClick={onOpenAssignment}>
            지도요원 배정
          </button>
          <button type="button" className="app-button app-button-primary" onClick={onEdit}>
            건설사 정보 수정
          </button>
        </div>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.headquarterOverviewShell}>
          <article className={styles.headquarterOverviewPrimary}>
            <div className={styles.headquarterOverviewHeader}>
              <span className={styles.summaryCardLabel}>건설사 등록 정보</span>
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
              <span className={styles.contextCellLabel}>담당자 연락 정보</span>
              <strong className={styles.contextCellValue}>{headquarter.contact_name || '-'}</strong>
              <span className={styles.contextCellMeta}>
                {contactDetails.join(' / ') || '연락처 미입력'}
              </span>
            </article>
            <article className={styles.contextCell}>
              <span className={styles.contextCellLabel}>소속 현장</span>
              <strong className={styles.contextCellValue}>{sites.length}개</strong>
              <span className={styles.contextCellMeta}>
                운영중 {activeSiteCount} / 미착수 {plannedSiteCount} / 종료 {closedSiteCount}
              </span>
            </article>
            <article className={`${styles.contextCell} ${styles.contextCellWide}`}>
              <span className={styles.contextCellLabel}>본사 주소</span>
              <strong className={styles.contextCellValue}>{headquarter.address || '-'}</strong>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
