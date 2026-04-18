'use client';

import { SubmitSearchField } from '@/components/ui/SubmitSearchField';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import type { AdminAnalyticsPeriod } from '@/features/admin/lib/buildAdminControlCenterModel';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';

interface AnalyticsSectionHeaderProps {
  activeFilterCount: number;
  contractType: string;
  contractTypeOptions: Array<{ label: string; value: string }>;
  exportAnalytics: () => Promise<void>;
  headquarterId: string;
  headquarterOptions: Array<{ label: string; value: string }>;
  isBusy: boolean;
  period: AdminAnalyticsPeriod;
  query: string;
  resetHeaderFilters: () => void;
  setContractType: (value: string) => void;
  setHeadquarterId: (value: string) => void;
  setPeriod: (value: AdminAnalyticsPeriod) => void;
  setQuery: (value: string) => void;
  submitQuery: () => void;
  setUserId: (value: string) => void;
  userId: string;
  userOptions: Array<{ label: string; value: string }>;
}

export function AnalyticsSectionHeader({
  activeFilterCount,
  contractType,
  contractTypeOptions,
  exportAnalytics,
  headquarterId,
  headquarterOptions,
  isBusy,
  period,
  query,
  resetHeaderFilters,
  setContractType,
  setHeadquarterId,
  setPeriod,
  setQuery,
  submitQuery,
  setUserId,
  userId,
  userOptions,
}: AnalyticsSectionHeaderProps) {
  return (
    <div className={sharedStyles.sectionHeader}>
      <div className={sharedStyles.sectionHeaderTitleBlock}>
        <h2 className={sharedStyles.sectionTitle}>매출/실적 집계</h2>
      </div>
      <div className={`${sharedStyles.sectionHeaderActions} ${sharedStyles.sectionHeaderToolbarActions}`}>
        <SubmitSearchField
          busy={isBusy}
          formClassName={`${sharedStyles.sectionHeaderSearchShell} ${sharedStyles.sectionHeaderToolbarSearch}`}
          inputClassName={`app-input ${sharedStyles.sectionHeaderSearchInput}`}
          buttonClassName={sharedStyles.sectionHeaderSearchButton}
          placeholder="직원, 현장, 사업장 검색"
          value={query}
          onChange={setQuery}
          onSubmit={submitQuery}
        />
        <SectionHeaderFilterMenu activeCount={activeFilterCount} ariaLabel="실적 집계 필터" onReset={resetHeaderFilters}>
          <div className={sharedStyles.sectionHeaderMenuGrid}>
            <div className={sharedStyles.sectionHeaderMenuField}>
              <label htmlFor="analytics-filter-period">집계 기간</label>
              <select id="analytics-filter-period" className="app-select" value={period} onChange={(event) => setPeriod(event.target.value as AdminAnalyticsPeriod)}>
                <option value="month">월</option>
                <option value="quarter">분기</option>
                <option value="year">연</option>
                <option value="all">전체</option>
              </select>
            </div>
            <div className={sharedStyles.sectionHeaderMenuField}>
              <label htmlFor="analytics-filter-headquarter">사업장</label>
              <select id="analytics-filter-headquarter" className="app-select" value={headquarterId} onChange={(event) => setHeadquarterId(event.target.value)}>
                <option value="">전체 사업장</option>
                {headquarterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className={sharedStyles.sectionHeaderMenuField}>
              <label htmlFor="analytics-filter-user">직원</label>
              <select id="analytics-filter-user" className="app-select" value={userId} onChange={(event) => setUserId(event.target.value)}>
                <option value="">전체 직원</option>
                {userOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className={sharedStyles.sectionHeaderMenuField}>
              <label htmlFor="analytics-filter-contract-type">구분</label>
              <select id="analytics-filter-contract-type" className="app-select" value={contractType} onChange={(event) => setContractType(event.target.value)}>
                <option value="">전체 구분</option>
                {contractTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </SectionHeaderFilterMenu>
        <button type="button" className="app-button app-button-secondary" onClick={() => void exportAnalytics()}>
          엑셀 내보내기
        </button>
      </div>
    </div>
  );
}
