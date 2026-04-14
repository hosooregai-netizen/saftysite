'use client';

import ActionMenu from '@/components/ui/ActionMenu';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  formatCurrencyValue,
  getAdminSectionHref,
  getSiteStatusLabel,
  normalizeSiteStatusForDisplay,
  SITE_STATUS_OPTIONS,
} from '@/lib/admin';
import type { TableSortState } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SafetySiteStatus } from '@/types/controller';
import { shouldIgnoreRowClick } from './siteSectionHelpers';

interface SitesTableProps {
  busy: boolean;
  canDelete: boolean;
  hasCustomEntry: boolean;
  onDeleteSite: (site: SafetySite) => void;
  onDownloadBasicMaterial: (site: SafetySite) => void;
  onOpenAssignmentModal: (siteId: string) => void;
  onOpenEdit: (site: SafetySite) => void;
  onPageChange: (page: number) => void;
  onOpenSiteEntry: (site: SafetySite) => void;
  onUpdateStatus: (site: SafetySite, status: SafetySiteStatus) => void;
  page: number;
  showHeadquarterColumn: boolean;
  sites: SafetySite[];
  sort: TableSortState;
  totalCount: number;
  totalPages: number;
  usersById: Map<string, SafetyUser>;
  onSortChange: (value: TableSortState) => void;
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatMonthValue(value: string | null | undefined) {
  if (!value) return '-';
  return value.length >= 7 ? value.slice(0, 7) : value;
}

export function SitesTable({
  busy,
  canDelete,
  hasCustomEntry,
  onDeleteSite,
  onDownloadBasicMaterial,
  onOpenAssignmentModal,
  onOpenEdit,
  onPageChange,
  onOpenSiteEntry,
  onUpdateStatus,
  page,
  showHeadquarterColumn,
  sites,
  sort,
  totalCount,
  totalPages,
  usersById: _usersById,
  onSortChange,
}: SitesTableProps) {
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
        <thead>
          <tr>
            <SortableHeaderCell
              column={{ key: 'site_name' }}
              current={sort}
              label="현장명"
              onChange={onSortChange}
              sortMenuOptions={buildSortMenuOptions('site_name', {
                asc: '현장 가나다순',
                desc: '현장 역순',
              })}
            />
            {showHeadquarterColumn ? (
              <SortableHeaderCell
                column={{ key: 'headquarter_name' }}
                current={sort}
                label="사업장 관리번호"
                onChange={onSortChange}
                sortMenuOptions={buildSortMenuOptions('headquarter_name', {
                  asc: '사업장 관리번호 가나다순',
                  desc: '사업장 관리번호 역순',
                })}
              />
            ) : null}
            <SortableHeaderCell
              column={{ key: 'project_kind' }}
              current={sort}
              label="공사 종류"
              onChange={onSortChange}
              sortMenuOptions={buildSortMenuOptions('project_kind', {
                asc: '공사 종류 가나다순',
                desc: '공사 종류 역순',
              })}
            />
            <SortableHeaderCell
              column={{ key: 'site_address' }}
              current={sort}
              label="주소"
              onChange={onSortChange}
            />
            <SortableHeaderCell
              column={{ key: 'project_amount' }}
              current={sort}
              defaultDirection="desc"
              label="공사 금액"
              onChange={onSortChange}
              sortMenuOptions={buildSortMenuOptions('project_amount', {
                asc: '공사 금액 낮은순',
                desc: '공사 금액 높은순',
              })}
            />
            <SortableHeaderCell
              column={{ key: 'status' }}
              current={sort}
              label="상태"
              onChange={onSortChange}
              sortMenuOptions={buildSortMenuOptions('status', {
                asc: '상태 오름차순',
                desc: '상태 내림차순',
              })}
            />
            <SortableHeaderCell
              column={{ key: 'last_visit_date' }}
              current={sort}
              defaultDirection="desc"
              label="마지막 방문일"
              onChange={onSortChange}
              sortMenuOptions={buildSortMenuOptions('last_visit_date', {
                asc: '마지막 방문일 오래된순',
                desc: '마지막 방문일 최신순',
              })}
            />
            <th>메뉴</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => {
            return (
              <tr
                key={site.id}
                className={styles.tableClickableRow}
                tabIndex={busy ? -1 : 0}
                role="link"
                onClick={(event) => {
                  if (busy || shouldIgnoreRowClick(event.target)) return;
                  onOpenSiteEntry(site);
                }}
                onKeyDown={(event) => {
                  if (busy || shouldIgnoreRowClick(event.target)) return;
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  onOpenSiteEntry(site);
                }}
              >
                <td>
                  <div className={styles.tablePrimary}>{site.site_name}</div>
                </td>
                {showHeadquarterColumn ? (
                  <td>
                    <div className={styles.tablePrimary}>
                      {site.headquarter_detail?.management_number || '-'}
                    </div>
                  </td>
                ) : null}
                <td>
                  <div className={styles.tablePrimary}>{site.project_kind || '-'}</div>
                </td>
                <td>
                  <div className={styles.tablePrimary}>{site.site_address || '-'}</div>
                </td>
                <td>
                  <div className={styles.tablePrimary}>{formatCurrencyValue(site.project_amount)}</div>
                  <div className={styles.tableSecondary}>
                    기간 {formatMonthValue(site.project_start_date)} ~ {formatMonthValue(site.project_end_date)}
                  </div>
                </td>
                <td>{getSiteStatusLabel(site.status)}</td>
                <td>{formatDateOnly(site.last_visit_date)}</td>
                <td>
                  <div
                    className={styles.tableActionMenuWrap}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <ActionMenu
                      label={`${site.site_name} 현장 작업 메뉴 열기`}
                      items={[
                        ...(hasCustomEntry
                          ? [
                              {
                                label: '현장 메인',
                                onSelect: () => onOpenSiteEntry(site),
                              },
                            ]
                          : [
                              {
                                label: '보고서',
                                href: `/sites/${encodeURIComponent(site.id)}`,
                              },
                            ]),
                        {
                          label: '지도요원 배정',
                          onSelect: () => {
                            if (!busy) onOpenAssignmentModal(site.id);
                          },
                        },
                        {
                          label: '사진첩 보기',
                          href: getAdminSectionHref('photos', {
                            headquarterId: site.headquarter_id,
                            siteId: site.id,
                          }),
                        },
                        {
                          label: '기초자료 출력',
                          onSelect: () => {
                            if (!busy) onDownloadBasicMaterial(site);
                          },
                        },
                        {
                          label: '수정',
                          onSelect: () => {
                            if (!busy) onOpenEdit(site);
                          },
                        },
                        ...SITE_STATUS_OPTIONS.filter(
                          (option) => option.value !== normalizeSiteStatusForDisplay(site.status),
                        ).map((option) => ({
                          label: `상태 변경: ${option.label}`,
                          onSelect: () => {
                            if (!busy) onUpdateStatus(site, option.value);
                          },
                        })),
                        ...(canDelete
                          ? [
                              {
                                label: '삭제',
                                tone: 'danger' as const,
                                onSelect: () => {
                                  if (!busy) onDeleteSite(site);
                                },
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
      {totalCount > 0 ? (
        <div className={styles.paginationRow}>
          <span>
            {page} / {totalPages} 페이지 · 총 {totalCount}건
          </span>
          <div className={styles.tableActions}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              이전
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              다음
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
