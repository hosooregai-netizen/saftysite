'use client';

import { useMemo, useState } from 'react';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  applyK2bWorkbook,
  parseK2bWorkbook,
} from '@/lib/k2b/apiClient';
import type {
  K2bApplyResult,
  K2bColumnMapping,
  K2bImportPreview,
  K2bImportPreviewRow,
  K2bMatchCandidate,
  K2bRowAction,
  K2bRowActionType,
} from '@/types/k2b';
import styles from './K2bSection.module.css';

const K2B_MAPPING_FIELDS: Array<{ key: keyof K2bColumnMapping; label: string }> = [
  { key: 'headquarter_name', label: '사업장명' },
  { key: 'business_registration_no', label: '사업자등록번호' },
  { key: 'corporate_registration_no', label: '법인등록번호' },
  { key: 'site_name', label: '현장명' },
  { key: 'management_number', label: '사업장 관리번호' },
  { key: 'project_start_date', label: '착공일' },
  { key: 'project_end_date', label: '준공일' },
  { key: 'project_amount', label: '공사금액' },
  { key: 'manager_name', label: '현장소장명' },
  { key: 'manager_phone', label: '현장소장 연락처' },
  { key: 'site_address', label: '현장 주소' },
  { key: 'road_address', label: '도로명 주소' },
  { key: 'contract_date', label: '계약일' },
  { key: 'total_rounds', label: '총 회차' },
  { key: 'per_visit_amount', label: '회차당 단가' },
  { key: 'total_contract_amount', label: '총 계약금액' },
  { key: 'contract_type', label: '계약유형' },
];

function normalizeCandidateAction(
  row: K2bImportPreviewRow,
): K2bRowActionType | '' {
  if (
    row.suggestedAction === 'create' ||
    row.suggestedAction === 'update_headquarter' ||
    row.suggestedAction === 'update_site'
  ) {
    return row.suggestedAction;
  }
  return '';
}

function getActionCandidates(
  row: K2bImportPreviewRow,
  action: K2bRowActionType | '',
): K2bMatchCandidate[] {
  if (action === 'update_headquarter') {
    return row.duplicateCandidates.filter((candidate) => candidate.kind === 'headquarter');
  }
  if (action === 'update_site') {
    return row.duplicateCandidates.filter((candidate) => candidate.kind === 'site');
  }
  return [];
}

function buildDefaultRowActions(rows: K2bImportPreview['sheets'][number]['rowPreviews']): K2bRowAction[] {
  return rows
    .map((row) => {
      const action = normalizeCandidateAction(row);
      if (!action) return null;
      const candidates = getActionCandidates(row, action);
      return {
        rowIndex: row.rowIndex,
        action,
        headquarterId:
          action === 'update_headquarter' ? candidates[0]?.headquarterId || null : null,
        siteId:
          action === 'update_site' ? candidates[0]?.siteId || null : null,
      } satisfies K2bRowAction;
    })
    .filter((item): item is K2bRowAction => Boolean(item));
}

interface K2bSectionProps {
  onReload: (options?: {
    includeContent?: boolean;
    includeReports?: boolean;
    force?: boolean;
  }) => Promise<void>;
}

export function K2bSection({ onReload }: K2bSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<K2bImportPreview | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [mapping, setMapping] = useState<K2bColumnMapping>({});
  const [rowActions, setRowActions] = useState<Record<number, K2bRowAction>>({});
  const [result, setResult] = useState<K2bApplyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedSheet = useMemo(
    () => preview?.sheets.find((sheet) => sheet.name === selectedSheetName) ?? preview?.sheets[0] ?? null,
    [preview, selectedSheetName],
  );

  const unresolvedRows = useMemo(() => {
    if (!selectedSheet) return [];
    return selectedSheet.rowPreviews.filter((row) => {
      const nextAction = rowActions[row.rowIndex]?.action || normalizeCandidateAction(row);
      if (!nextAction) return true;
      const candidates = getActionCandidates(row, nextAction);
      if (nextAction === 'update_headquarter') {
        return candidates.length > 0 && !(
          rowActions[row.rowIndex]?.headquarterId || candidates[0]?.headquarterId
        );
      }
      if (nextAction === 'update_site') {
        return candidates.length > 0 && !(
          rowActions[row.rowIndex]?.siteId || candidates[0]?.siteId
        );
      }
      return false;
    });
  }, [rowActions, selectedSheet]);

  const handleSheetChange = (sheetName: string) => {
    if (!preview) return;
    const nextSheet = preview.sheets.find((sheet) => sheet.name === sheetName) ?? preview.sheets[0];
    setSelectedSheetName(nextSheet.name);
    setMapping(nextSheet.suggestedMapping);
    setRowActions(
      Object.fromEntries(
        buildDefaultRowActions(nextSheet.rowPreviews).map((item) => [item.rowIndex, item]),
      ),
    );
    setResult(null);
  };

  const handleParse = async () => {
    if (!selectedFile) {
      setError('업로드할 .xlsx 파일을 먼저 선택해 주세요.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setNotice(null);
      const nextPreview = await parseK2bWorkbook(selectedFile);
      setPreview(nextPreview);
      const nextSheet = nextPreview.sheets[0] ?? null;
      setSelectedSheetName(nextSheet?.name || '');
      setMapping(nextSheet?.suggestedMapping ?? {});
      setRowActions(
        Object.fromEntries(
          buildDefaultRowActions(nextSheet?.rowPreviews ?? []).map((item) => [item.rowIndex, item]),
        ),
      );
      setResult(null);
      setNotice('K2B 업로드 파일을 파싱했습니다. 매핑과 중복 후보를 확인해 주세요.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'K2B 파일을 파싱하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview || !selectedSheet) return;
    if (unresolvedRows.length > 0) {
      setError('중복 후보 선택이 필요한 행이 있습니다. 처리 방식을 먼저 정해 주세요.');
      return;
    }
    try {
      setApplying(true);
      setError(null);
      const nextResult = await applyK2bWorkbook({
        jobId: preview.jobId,
        mapping,
        rowActions: Object.values(rowActions),
        sheetName: selectedSheet.name,
      });
      setResult(nextResult);
      setNotice('K2B 데이터를 사업장/현장에 반영했습니다.');
      await onReload({ force: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'K2B 적용에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={styles.stepStack}>
      <section className={sharedStyles.sectionCard}>
        <div className={sharedStyles.sectionHeader}>
          <div>
            <h2 className={sharedStyles.sectionTitle}>K2B 업로드</h2>
            <p className={styles.stepDescription}>
              K2B 엑셀 파일을 업로드한 뒤 미리보기, 컬럼 매핑, 중복 후보 확인을 거쳐 사업장과 현장을 생성하거나 갱신합니다.
            </p>
          </div>
          <div className={sharedStyles.sectionHeaderActions}>
            <span className="app-chip">1. 파일 선택</span>
            <span className="app-chip">2. 미리보기</span>
            <span className="app-chip">3. 컬럼 매핑</span>
            <span className="app-chip">4. 중복 판정</span>
            <span className="app-chip">5. 적용 결과</span>
          </div>
        </div>
        <div className={sharedStyles.sectionBody}>
          {error ? <div className={styles.errorBox}>{error}</div> : null}
          {notice ? <div className={styles.noticeBox}>{notice}</div> : null}
          <div className={styles.inlineActions}>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleParse()}
              disabled={!selectedFile || loading}
            >
              {loading ? '파싱 중...' : '파일 파싱'}
            </button>
          </div>
        </div>
      </section>

      {preview && selectedSheet ? (
        <>
          <section className={sharedStyles.sectionCard}>
            <div className={sharedStyles.sectionHeader}>
              <div>
                <h2 className={sharedStyles.sectionTitle}>시트/행 미리보기</h2>
              </div>
            </div>
            <div className={sharedStyles.sectionBody}>
              <div className={styles.inlineActions}>
                <label>
                  <span className={styles.summaryLabel}>시트 선택</span>
                  <select
                    className="app-select"
                    value={selectedSheet.name}
                    onChange={(event) => handleSheetChange(event.target.value)}
                  >
                    {preview.sheets.map((sheet) => (
                      <option key={sheet.name} value={sheet.name}>
                        {sheet.name}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="app-chip">총 {selectedSheet.rowCount}행</span>
                <span className="app-chip">{preview.fileName}</span>
              </div>
              <div className={styles.previewGrid}>
                <table className={styles.rowTable}>
                  <thead>
                    <tr>
                      {selectedSheet.headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSheet.sampleRows.map((row, index) => (
                      <tr key={`sample-${index + 1}`}>
                        {selectedSheet.headers.map((header) => (
                          <td key={`${index + 1}-${header}`}>{row[header] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className={sharedStyles.sectionCard}>
            <div className={sharedStyles.sectionHeader}>
              <div>
                <h2 className={sharedStyles.sectionTitle}>컬럼 매핑</h2>
              </div>
            </div>
            <div className={sharedStyles.sectionBody}>
              <div className={styles.mappingGrid}>
                {K2B_MAPPING_FIELDS.map((field) => (
                  <label key={field.key} className={styles.mappingRow}>
                    <span className={styles.summaryLabel}>{field.label}</span>
                    <select
                      className="app-select"
                      value={mapping[field.key] || ''}
                      onChange={(event) =>
                        setMapping((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                    >
                      <option value="">매핑 안 함</option>
                      {selectedSheet.headers.map((header) => (
                        <option key={`${field.key}-${header}`} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className={sharedStyles.sectionCard}>
            <div className={sharedStyles.sectionHeader}>
              <div>
                <h2 className={sharedStyles.sectionTitle}>중복 판정</h2>
                <p className={styles.stepDescription}>
                  사업장 관리번호, 사업자등록번호 + 현장명, 현장명 + 공사기간 순서로 기존 후보를 제안합니다.
                </p>
              </div>
            </div>
            <div className={sharedStyles.sectionBody}>
              <table className={styles.rowTable}>
                <thead>
                  <tr>
                    <th>행</th>
                    <th>요약</th>
                    <th>중복 후보</th>
                    <th>처리 방식</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSheet.rowPreviews.map((row) => {
                    const currentAction = rowActions[row.rowIndex]?.action || normalizeCandidateAction(row);
                    const actionCandidates = getActionCandidates(row, currentAction);
                    return (
                      <tr key={`row-${row.rowIndex}`}>
                        <td>{row.rowIndex}</td>
                        <td>{row.summary || '요약 불가'}</td>
                        <td>
                          <div className={styles.candidateList}>
                            {row.duplicateCandidates.length === 0 ? (
                              <span className="app-chip">중복 후보 없음</span>
                            ) : (
                              row.duplicateCandidates.map((candidate) => (
                                <span key={`${row.rowIndex}-${candidate.kind}-${candidate.id}`} className={styles.candidateChip}>
                                  {candidate.kind === 'site' ? '현장' : '사업장'} · {candidate.label} · {candidate.reason}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.candidateList}>
                            <select
                              className="app-select"
                              value={currentAction}
                              onChange={(event) =>
                                setRowActions((current) => ({
                                  ...current,
                                  [row.rowIndex]: {
                                    ...current[row.rowIndex],
                                    rowIndex: row.rowIndex,
                                    action: event.target.value as K2bRowActionType,
                                  },
                                }))
                              }
                            >
                              <option value="">선택 필요</option>
                              <option value="create">신규 생성</option>
                              <option value="update_headquarter">기존 사업장 갱신</option>
                              <option value="update_site">기존 현장 갱신</option>
                            </select>
                            {currentAction === 'update_headquarter' ? (
                              <select
                                className="app-select"
                                value={rowActions[row.rowIndex]?.headquarterId || actionCandidates[0]?.headquarterId || ''}
                                onChange={(event) =>
                                  setRowActions((current) => ({
                                    ...current,
                                    [row.rowIndex]: {
                                      ...current[row.rowIndex],
                                      rowIndex: row.rowIndex,
                                      action: 'update_headquarter',
                                      headquarterId: event.target.value || null,
                                    },
                                  }))
                                }
                              >
                                <option value="">사업장 선택</option>
                                {actionCandidates.map((candidate) => (
                                  <option key={`${row.rowIndex}-hq-${candidate.id}`} value={candidate.headquarterId || candidate.id}>
                                    {candidate.label} ({candidate.reason})
                                  </option>
                                ))}
                              </select>
                            ) : null}
                            {currentAction === 'update_site' ? (
                              <select
                                className="app-select"
                                value={rowActions[row.rowIndex]?.siteId || actionCandidates[0]?.siteId || ''}
                                onChange={(event) =>
                                  setRowActions((current) => ({
                                    ...current,
                                    [row.rowIndex]: {
                                      ...current[row.rowIndex],
                                      rowIndex: row.rowIndex,
                                      action: 'update_site',
                                      siteId: event.target.value || null,
                                    },
                                  }))
                                }
                              >
                                <option value="">현장 선택</option>
                                {actionCandidates.map((candidate) => (
                                  <option key={`${row.rowIndex}-site-${candidate.id}`} value={candidate.siteId || candidate.id}>
                                    {candidate.label} ({candidate.reason})
                                  </option>
                                ))}
                              </select>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className={sharedStyles.sectionCard}>
            <div className={sharedStyles.sectionHeader}>
              <div>
                <h2 className={sharedStyles.sectionTitle}>적용 결과</h2>
              </div>
              <div className={sharedStyles.sectionHeaderActions}>
                <button
                  type="button"
                  className="app-button app-button-primary"
                  onClick={() => void handleApply()}
                  disabled={applying || unresolvedRows.length > 0}
                >
                  {applying ? '적용 중...' : 'DB에 반영'}
                </button>
              </div>
            </div>
            <div className={sharedStyles.sectionBody}>
              {unresolvedRows.length > 0 ? (
                <div className={styles.errorBox}>
                  처리 방식을 정해야 하는 행이 {unresolvedRows.length}건 있습니다.
                </div>
              ) : null}
              {result ? (
                <>
                  <div className={styles.summaryGrid}>
                    <article className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>사업장 생성</span>
                      <strong className={styles.summaryValue}>{result.summary.createdHeadquarterCount}</strong>
                    </article>
                    <article className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>사업장 갱신</span>
                      <strong className={styles.summaryValue}>{result.summary.updatedHeadquarterCount}</strong>
                    </article>
                    <article className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>현장 생성</span>
                      <strong className={styles.summaryValue}>{result.summary.createdSiteCount}</strong>
                    </article>
                    <article className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>현장 갱신</span>
                      <strong className={styles.summaryValue}>{result.summary.updatedSiteCount}</strong>
                    </article>
                    <article className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>보완 필요</span>
                      <strong className={styles.summaryValue}>{result.summary.completionRequiredCount}</strong>
                    </article>
                  </div>

                  <table className={styles.rowTable}>
                    <thead>
                      <tr>
                        <th>행</th>
                        <th>처리</th>
                        <th>사업장</th>
                        <th>현장</th>
                        <th>보완 필요</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row) => (
                        <tr key={`result-${row.rowIndex}`}>
                          <td>{row.rowIndex}</td>
                          <td>{row.action}</td>
                          <td>{row.headquarterName || '-'}</td>
                          <td>{row.siteName || '-'}</td>
                          <td>{row.requiredCompletionFields.join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className={styles.emptyState}>아직 반영 결과가 없습니다.</div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
