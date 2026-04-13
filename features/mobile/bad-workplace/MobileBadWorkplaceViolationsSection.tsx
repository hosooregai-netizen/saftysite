'use client';

import type { BadWorkplaceReport } from '@/types/erpReports';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { MobileBadWorkplaceEditableField } from './MobileBadWorkplaceEditableField';

interface MobileBadWorkplaceViolationsSectionProps {
  draft: BadWorkplaceReport;
  onUpdateViolation: (
    violationId: string,
    patch: Partial<BadWorkplaceReport['violations'][number]>,
  ) => void;
}

export function MobileBadWorkplaceViolationsSection({
  draft,
  onUpdateViolation,
}: MobileBadWorkplaceViolationsSectionProps) {
  return (
    <section className={styles.mobileEditorCard}>
      <div className={styles.mobileImplementationListHeader}>
        <div className={styles.mobileImplementationListTitle}>4. 위반사항</div>
      </div>

      {draft.violations.length > 0 ? (
        <div className={styles.mobileFuturePlanCardList}>
          {draft.violations.map((item, index) => (
            <article key={item.id} className={styles.mobileFuturePlanCard}>
              <div className={styles.mobileImplementationItemTop}>
                <span className={styles.mobileImplementationItemBadge}>
                  {`위반사항 ${index + 1}`}
                </span>
              </div>
              <div className={styles.mobileImplementationFieldGrid}>
                <MobileBadWorkplaceEditableField
                  label="관련 법령"
                  multiline
                  rows={3}
                  value={item.legalReference}
                  onChange={(value) => onUpdateViolation(item.id, { legalReference: value })}
                />
                <MobileBadWorkplaceEditableField
                  label="유해위험요인"
                  multiline
                  rows={4}
                  value={item.hazardFactor}
                  onChange={(value) => onUpdateViolation(item.id, { hazardFactor: value })}
                />
                <MobileBadWorkplaceEditableField
                  label="개선지시사항"
                  multiline
                  rows={4}
                  wide
                  value={item.improvementMeasure}
                  onChange={(value) =>
                    onUpdateViolation(item.id, { improvementMeasure: value })
                  }
                />
                <MobileBadWorkplaceEditableField
                  label="지시일"
                  value={item.guidanceDate}
                  placeholder="YYYY-MM-DD"
                  onChange={(value) => onUpdateViolation(item.id, { guidanceDate: value })}
                />
                <MobileBadWorkplaceEditableField
                  label="불이행 사항"
                  multiline
                  rows={4}
                  wide
                  value={item.nonCompliance}
                  onChange={(value) => onUpdateViolation(item.id, { nonCompliance: value })}
                />
                <MobileBadWorkplaceEditableField
                  label="확인일"
                  value={item.confirmationDate}
                  placeholder="YYYY-MM-DD"
                  onChange={(value) =>
                    onUpdateViolation(item.id, { confirmationDate: value })
                  }
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.mobileImplementationEmpty}>선택된 지적사항이 없습니다.</div>
      )}
    </section>
  );
}
