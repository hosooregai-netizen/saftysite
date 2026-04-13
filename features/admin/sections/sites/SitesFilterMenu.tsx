'use client';

import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { SITE_STATUS_OPTIONS } from '@/lib/admin';
import type { SafetySiteStatus } from '@/types/controller';
import type { SiteAssignmentFilter } from './siteSectionHelpers';

interface SitesFilterMenuProps {
  activeCount: number;
  assignmentFilter: SiteAssignmentFilter;
  onAssignmentFilterChange: (value: SiteAssignmentFilter) => void;
  onReset: () => void;
  onStatusFilterChange: (value: 'all' | SafetySiteStatus) => void;
  statusFilter: 'all' | SafetySiteStatus;
}

export function SitesFilterMenu({
  activeCount,
  assignmentFilter,
  onAssignmentFilterChange,
  onReset,
  onStatusFilterChange,
  statusFilter,
}: SitesFilterMenuProps) {
  return (
    <SectionHeaderFilterMenu activeCount={activeCount} ariaLabel="현장 목록 필터" onReset={onReset}>
      <div className={styles.sectionHeaderMenuGrid}>
        <div className={styles.sectionHeaderMenuField}>
          <label htmlFor="site-filter-status">현장 상태</label>
          <select
            id="site-filter-status"
            className="app-select"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as 'all' | SafetySiteStatus)}
          >
            <option value="all">전체 상태</option>
            {SITE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.sectionHeaderMenuField}>
          <label htmlFor="site-filter-assignment">배정 상태</label>
          <select
            id="site-filter-assignment"
            className="app-select"
            value={assignmentFilter}
            onChange={(event) => onAssignmentFilterChange(event.target.value as SiteAssignmentFilter)}
          >
            <option value="all">전체 배정</option>
            <option value="unassigned">미배정만</option>
          </select>
        </div>
      </div>
    </SectionHeaderFilterMenu>
  );
}
