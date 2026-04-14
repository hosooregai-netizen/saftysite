'use client';

import ActionMenu from '@/components/ui/ActionMenu';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  formatCurrencyValue,
  formatTimestamp,
  getAdminSectionHref,
  getSiteStatusLabel,
  normalizeSiteStatusForDisplay,
  SITE_CONTRACT_STATUS_LABELS,
  SITE_CONTRACT_TYPE_LABELS,
  SITE_STATUS_OPTIONS,
} from '@/lib/admin';
import { parseSiteRequiredCompletionFields, resolveSiteRevenueProfile } from '@/lib/admin/siteContractProfile';
import type { TableSortState } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SafetyAssignment, SafetySiteStatus } from '@/types/controller';
import {
  formatAssignedUsers,
  getSiteManagementMissingFields,
  shouldIgnoreRowClick,
} from './siteSectionHelpers';

interface SitesTableProps {
  activeAssignmentsBySiteId: Map<string, SafetyAssignment[]>;
  busy: boolean;
  canDelete: boolean;
  hasCustomEntry: boolean;
  onDeleteSite: (site: SafetySite) => void;
  onDownloadBasicMaterial: (site: SafetySite) => void;
  onOpenAssignmentModal: (siteId: string) => void;
  onOpenEdit: (site: SafetySite) => void;
  onOpenSiteEntry: (site: SafetySite) => void;
  onUpdateStatus: (site: SafetySite, status: SafetySiteStatus) => void;
  showHeadquarterColumn: boolean;
  sites: SafetySite[];
  sort: TableSortState;
  usersById: Map<string, SafetyUser>;
  onSortChange: (value: TableSortState) => void;
}

function formatMissingFieldPreview(fields: string[]) {
  if (fields.length <= 2) return fields.join(', ');
  return `${fields.slice(0, 2).join(', ')} 외 ${fields.length - 2}건`;
}

export function SitesTable({
  activeAssignmentsBySiteId,
  busy,
  canDelete,
  hasCustomEntry,
  onDeleteSite,
  onDownloadBasicMaterial,
  onOpenAssignmentModal,
  onOpenEdit,
  onOpenSiteEntry,
  onUpdateStatus,
  showHeadquarterColumn,
  sites,
  sort,
  usersById,
  onSortChange,
}: SitesTableProps) {
  return (
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
                label="사업장"
                onChange={onSortChange}
                sortMenuOptions={buildSortMenuOptions('headquarter_name', {
                  asc: '사업장 가나다순',
                  desc: '사업장 역순',
                })}
              />
            ) : null}
            <SortableHeaderCell
              column={{ key: 'contract_signed_date' }}
              current={sort}
              defaultDirection="desc"
              label="계약 / 기술지도"
              onChange={onSortChange}
              sortMenuOptions={buildSortMenuOptions('contract_signed_date', {
                asc: '계약 체결일 오래된순',
                desc: '계약 체결일 최신순',
              })}
            />
            <SortableHeaderCell
              column={{ key: 'manager_name' }}
              current={sort}
              label="운영 담당"
              onChange={onSortChange}
              sortMenuOptions={buildSortMenuOptions('manager_name', {
                asc: '운영 담당 가나다순',
                desc: '운영 담당 역순',
              })}
            />
            <SortableHeaderCell
              column={{ key: 'updated_at' }}
              current={sort}
              defaultDirection="desc"
              label="수정일"
              onChange={onSortChange}
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
            <th>메뉴</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => {
            const siteAssignments = activeAssignmentsBySiteId.get(site.id) ?? [];
            const revenueProfile = resolveSiteRevenueProfile(site);
            const requiredCompletionFields =
              site.required_completion_fields?.length
                ? site.required_completion_fields
                : parseSiteRequiredCompletionFields(site);
            const managementMissingFields = getSiteManagementMissingFields(site);
            const combinedMissingFields = Array.from(
              new Set([...requiredCompletionFields, ...managementMissingFields]),
            );
            const assignedUsers = siteAssignments
              .map((assignment) => usersById.get(assignment.user_id))
              .filter((user): user is SafetyUser => Boolean(user));
            const fallbackAssignedUsers =
              assignedUsers.length === 0 && site.assigned_user
                ? [usersById.get(site.assigned_user.id) ?? site.assigned_user].filter(Boolean)
                : [];
            const contractTypeLabel =
              SITE_CONTRACT_TYPE_LABELS[
                (site.contract_type ?? '') as keyof typeof SITE_CONTRACT_TYPE_LABELS
              ] || '미입력';
            const contractStatusLabel =
              SITE_CONTRACT_STATUS_LABELS[
                (site.contract_status ?? '') as keyof typeof SITE_CONTRACT_STATUS_LABELS
              ] || '미입력';

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
                  <div className={styles.tableSecondary}>{site.site_address || '주소 미입력'}</div>
                  <div className={styles.tableBadgeRow}>
                    <span className={`${styles.tableBadge} ${styles.tableBadgeAccent}`}>
                      코드 {site.site_code || '-'}
                    </span>
                    <span className={styles.tableBadge}>관리번호 {site.management_number || '-'}</span>
                    {site.is_high_risk_site ? (
                      <span className={`${styles.tableBadge} ${styles.tableBadgeWarning}`}>고위험</span>
                    ) : null}
                  </div>
                  {combinedMissingFields.length ? (
                    <div className={styles.tableSecondary}>
                      보완 {formatMissingFieldPreview(combinedMissingFields)}
                    </div>
                  ) : null}
                </td>
                {showHeadquarterColumn ? (
                  <td>
                    <div className={styles.tablePrimary}>
                      {site.headquarter_detail?.name || site.headquarter?.name || '-'}
                    </div>
                    <div className={styles.tableSecondary}>
                      관리번호 {site.headquarter_detail?.management_number || '-'}
                    </div>
                    <div className={styles.tableSecondary}>
                      개시번호 {site.headquarter_detail?.opening_number || '-'}
                    </div>
                  </td>
                ) : null}
                <td>
                  <div className={styles.tablePrimary}>
                    {contractTypeLabel} / {contractStatusLabel}
                  </div>
                  <div className={styles.tableSecondary}>
                    계약 {site.contract_start_date || '-'} ~ {site.contract_end_date || '-'}
                  </div>
                  <div className={styles.tableSecondary}>
                    체결일 {site.contract_signed_date || site.contract_date || '-'}
                  </div>
                  <div className={styles.tableSecondary}>
                    기술지도 대가 {formatCurrencyValue(site.total_contract_amount)} / 횟수 {site.total_rounds ?? '-'}
                  </div>
                  <div className={styles.tableSecondary}>
                    회차당 단가{' '}
                    {revenueProfile.resolvedPerVisitAmount != null
                      ? `${formatCurrencyValue(revenueProfile.resolvedPerVisitAmount)}${
                          revenueProfile.source === 'derived' ? ' (자동 계산)' : ''
                        }`
                      : '-'}
                  </div>
                  <div className={styles.tableSecondary}>
                    구분 {site.technical_guidance_kind || '-'} / 공사금액 {formatCurrencyValue(site.project_amount)}
                  </div>
                </td>
                <td>
                  <div className={styles.tablePrimary}>
                    현장소장 {site.manager_name || '-'}
                  </div>
                  <div className={styles.tableSecondary}>
                    연락처 {site.manager_phone || '-'}
                  </div>
                  <div className={styles.tableSecondary}>
                    발송 메일 {site.site_contact_email || '미등록'}
                  </div>
                  <div className={styles.tableSecondary}>
                    배정요원{' '}
                    {assignedUsers.length > 0
                      ? formatAssignedUsers(assignedUsers)
                      : fallbackAssignedUsers.length > 0
                        ? fallbackAssignedUsers.map((user) => user.name).join(', ')
                        : '-'}
                  </div>
                </td>
                <td>{formatTimestamp(site.updated_at)}</td>
                <td>{getSiteStatusLabel(site.status)}</td>
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
  );
}
