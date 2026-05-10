'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchAdminSitesList } from '@/lib/admin/apiClient';
import { ensureAppsSafetySession } from '@/lib/appsSafetySession';
import { fetchAssignedSafetyHeadquarters } from '@/lib/safetyApi';
import type { SafetyAssignedHeadquarterSummary, SafetySite } from '@/types/backend';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import {
  buildSiteBadWorkplaceHref,
  buildSiteHubHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
} from '@/features/home/lib/siteEntry';

type SortMode = 'recent' | 'name';

export function SitesHubScreen() {
  const [headquarters, setHeadquarters] = useState<SafetyAssignedHeadquarterSummary[]>([]);
  const [sites, setSites] = useState<SafetySite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setIsLoading(true);
        setError('');
        const { token } = await ensureAppsSafetySession();
        const [nextHeadquarters, nextSites] = await Promise.all([
          fetchAssignedSafetyHeadquarters(token),
          fetchAdminSitesList({
            limit: 500,
            offset: 0,
            sortBy: 'last_visit_date',
            sortDir: 'desc',
          }).then((response) => response.rows),
        ]);
        if (cancelled) return;
        setHeadquarters(nextHeadquarters);
        setSites(nextSites);
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : '현장 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = !normalizedQuery
      ? sites
      : sites.filter((site) =>
          [
            site.client_business_name,
            site.site_name,
            site.manager_name,
            site.site_address,
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery),
        );

    return [...rows].sort((left, right) => {
      if (sortMode === 'name') {
        return left.site_name.localeCompare(right.site_name, 'ko');
      }
      return String(right.last_visit_date || '').localeCompare(String(left.last_visit_date || ''));
    });
  }, [query, sites, sortMode]);

  const requiresLogin = error.includes('로그인') || error.includes('이 메뉴는 로그인');

  return (
    <div className="erp-page">
      <section className="page-header-card">
        <div>
          <span className="page-kicker">Sites</span>
          <h1 className="page-title">현장 목록</h1>
          <p className="page-meta-line">배정된 현장과 최근 기술지도 흐름을 같은 셸 안에서 확인합니다.</p>
        </div>
      </section>

      {requiresLogin ? (
        <section className="erp-panel">
          <h2>로그인 후 사용할 수 있습니다.</h2>
          <p className="page-meta-line">현장 목록, 사업장 배정, 메일함은 계정 로그인과 서버 연결이 필요합니다.</p>
        </section>
      ) : null}

      {headquarters.length > 0 && !requiresLogin ? (
        <section className="erp-panel">
          <div className="erp-panel-header">
            <h2>배정 건설사</h2>
          </div>
          <div className="report-table">
            {headquarters.map((assignment) => (
              <article key={assignment.id} className="report-row">
                <div className="report-row-title">
                  <strong>{assignment.headquarter.name}</strong>
                  <span>사업개시번호 {assignment.headquarter.opening_number || '-'}</span>
                </div>
                <div className="row-meta-block">
                  <strong>{assignment.site_count}개 현장</strong>
                  <span>연결 완료</span>
                </div>
                <div className="row-actions">
                  <Link href="/headquarters" className="erp-button erp-button-secondary">
                    건설사/현장 열기
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="erp-panel">
        <div className="erp-panel-header">
          <h2>배정 현장</h2>
          <div className="erp-toolbar">
            <input
              className="erp-input erp-search"
              placeholder="고객명, 현장명, 담당자로 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={isLoading}
            />
            <select
              className="erp-select"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              disabled={isLoading}
            >
              <option value="recent">최근 방문순</option>
              <option value="name">현장명순</option>
            </select>
          </div>
        </div>

        {error ? <div className="row-meta">{error}</div> : null}
        {isLoading ? <div className="row-meta">현장 목록을 불러오는 중입니다.</div> : null}

        {!isLoading && !requiresLogin ? (
          <div className="report-table">
            <div className="report-table-head">
              <span>고객사</span>
              <span>현장명</span>
              <span>담당자</span>
              <span>상태</span>
              <span>최근 지도일</span>
              <span>작업</span>
            </div>

            {filteredSites.length > 0 ? (
              filteredSites.map((site) => (
                <article key={site.id} className="report-row">
                  <div className="report-row-title">
                    <strong>{site.client_business_name || site.headquarter?.name || '-'}</strong>
                    <span>{site.headquarter_detail?.opening_number || site.management_number || '-'}</span>
                  </div>
                  <div className="report-row-title">
                    <strong>{site.site_name}</strong>
                    <span>{site.site_address || '-'}</span>
                  </div>
                  <div className="row-meta-block">
                    <strong>{site.manager_name || site.primary_site_manager?.name || '-'}</strong>
                    <span>{site.manager_phone || site.primary_site_manager?.phone || '-'}</span>
                  </div>
                  <div className="row-meta-block">
                    <strong>{site.status === 'active' ? '운영 중' : site.status}</strong>
                    <span>공정률 {site.guidance_max_visit_round ? `${site.guidance_max_visit_round}회차` : '-'}</span>
                  </div>
                  <div className="row-meta-block">
                    <strong>{site.last_visit_date || '-'}</strong>
                    <span>{site.total_rounds ? `총 ${site.total_rounds}회` : '회차 미설정'}</span>
                  </div>
                  <div className="row-actions">
                    <Link href={buildSiteHubHref(site.id)} className="erp-button erp-button-secondary">
                      현장 열기
                    </Link>
                    <Link href={buildSiteReportsHref(site.id)} className="erp-button erp-button-text">
                      기술지도
                    </Link>
                    <Link href={buildSiteQuarterlyListHref(site.id)} className="erp-button erp-button-text">
                      분기 보고서
                    </Link>
                    <Link
                      href={buildSiteBadWorkplaceHref(site.id, getCurrentReportMonth())}
                      className="erp-button erp-button-text"
                    >
                      불량사업장
                    </Link>
                    <Link
                      href={`/mailbox?headquarterId=${encodeURIComponent(site.headquarter_id)}&siteId=${encodeURIComponent(site.id)}`}
                      className="erp-button erp-button-text"
                    >
                      메일함
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article className="report-row">
                <div className="report-row-title">
                  <strong>표시할 현장이 없습니다.</strong>
                  <span>검색 조건을 조정하거나 건설사/현장 메뉴에서 현장을 추가해 주세요.</span>
                </div>
              </article>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
