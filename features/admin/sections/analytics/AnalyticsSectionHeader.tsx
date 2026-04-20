'use client';

import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';

export function AnalyticsSectionHeader() {
  return (
    <div className={sharedStyles.sectionHeader}>
      <div className={sharedStyles.sectionHeaderTitleBlock}>
        <h2 className={sharedStyles.sectionTitle}>매출/실적 집계</h2>
      </div>
    </div>
  );
}
