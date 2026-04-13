'use client';

import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { ControllerReportRow } from '@/types/admin';

interface ReportsFilterMenuProps {
  activeCount: number;
  assigneeFilter: string;
  assigneeOptions: ReadonlyArray<readonly [string, string]>;
  dateFrom: string;
  dateTo: string;
  headquarterFilter: string;
  headquarterOptions: ReadonlyArray<readonly [string, string]>;
  onAssigneeFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onHeadquarterFilterChange: (value: string) => void;
  onQualityFilterChange: (value: string) => void;
  onReportTypeChange: (value: 'all' | ControllerReportRow['reportType']) => void;
  onReset: () => void;
  onSiteFilterChange: (value: string) => void;
  qualityFilter: string;
  reportType: 'all' | ControllerReportRow['reportType'];
  siteFilter: string;
  siteOptions: ReadonlyArray<readonly [string, string]>;
}

export function ReportsFilterMenu({
  activeCount,
  assigneeFilter,
  assigneeOptions,
  dateFrom,
  dateTo,
  headquarterFilter,
  headquarterOptions,
  onAssigneeFilterChange,
  onDateFromChange,
  onDateToChange,
  onHeadquarterFilterChange,
  onQualityFilterChange,
  onReportTypeChange,
  onReset,
  onSiteFilterChange,
  qualityFilter,
  reportType,
  siteFilter,
  siteOptions,
}: ReportsFilterMenuProps) {
  return (
    <SectionHeaderFilterMenu activeCount={activeCount} ariaLabel="전체 보고서 필터" onReset={onReset}>
      <div className={styles.sectionHeaderMenuGrid}>
        <div className={styles.sectionHeaderMenuField}>
          <label htmlFor="reports-filter-type">유형</label>
          <select
            id="reports-filter-type"
            className="app-select"
            value={reportType}
            onChange={(event) =>
              onReportTypeChange(event.target.value as 'all' | ControllerReportRow['reportType'])
            }
          >
            <option value="all">전체 유형</option>
            <option value="technical_guidance">지도보고서</option>
            <option value="quarterly_report">분기 보고서</option>
            <option value="bad_workplace">불량사업장</option>
          </select>
        </div>

        <div className={styles.sectionHeaderMenuField}>
          <label htmlFor="reports-filter-headquarter">사업장</label>
          <select
            id="reports-filter-headquarter"
            className="app-select"
            value={headquarterFilter}
            onChange={(event) => onHeadquarterFilterChange(event.target.value)}
          >
            <option value="all">전체 사업장</option>
            {headquarterOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.sectionHeaderMenuField}>
          <label htmlFor="reports-filter-site">현장</label>
          <select
            id="reports-filter-site"
            className="app-select"
            value={siteFilter}
            onChange={(event) => onSiteFilterChange(event.target.value)}
          >
            <option value="all">전체 현장</option>
            {siteOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.sectionHeaderMenuField}>
          <label htmlFor="reports-filter-assignee">담당자</label>
          <select
            id="reports-filter-assignee"
            className="app-select"
            value={assigneeFilter}
            onChange={(event) => onAssigneeFilterChange(event.target.value)}
          >
            <option value="all">전체 담당자</option>
            {assigneeOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.sectionHeaderMenuField}>
          <label htmlFor="reports-filter-quality">품질 체크</label>
          <select
            id="reports-filter-quality"
            className="app-select"
            value={qualityFilter}
            onChange={(event) => onQualityFilterChange(event.target.value)}
          >
            <option value="all">전체 품질체크</option>
            <option value="unchecked">미확인</option>
            <option value="ok">확인완료</option>
            <option value="issue">이슈</option>
          </select>
        </div>

        <div className={styles.sectionHeaderMenuDateRange}>
          <div className={styles.sectionHeaderMenuField}>
            <label htmlFor="reports-filter-date-from">기준일 시작</label>
            <input
              id="reports-filter-date-from"
              className="app-input"
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
            />
          </div>

          <div className={styles.sectionHeaderMenuField}>
            <label htmlFor="reports-filter-date-to">기준일 종료</label>
            <input
              id="reports-filter-date-to"
              className="app-input"
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
            />
          </div>
        </div>
      </div>
    </SectionHeaderFilterMenu>
  );
}
