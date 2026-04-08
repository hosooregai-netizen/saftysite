'use client';

import { useMemo, useRef, useState } from 'react';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import { applyExcelWorkbook, parseExcelWorkbook } from '@/lib/excelImport/apiClient';
import type {
  ExcelApplyResult,
  ExcelImportPreview,
  ExcelImportPreviewRow,
  ExcelImportScope,
  ExcelImportScopeSummary,
} from '@/types/excelImport';
import styles from './ExcelImportSection.module.css';

interface ExcelImportSectionProps {
  onReload: (options?: {
    includeContent?: boolean;
    includeReports?: boolean;
    force?: boolean;
  }) => Promise<void>;
  scope: ExcelImportScope;
}

const FIELD_LABELS: Record<string, string> = {
  business_registration_no: '사업자등록번호',
  contact_name: '본사 담당자명',
  contact_phone: '본사 연락처',
  contract_date: '계약일',
  contract_type: '계약유형',
  corporate_registration_no: '법인등록번호',
  headquarter_name: '사업장명',
  license_no: '면허번호',
  management_number: '사업장 관리번호',
  manager_name: '현장소장명',
  manager_phone: '현장소장 연락처',
  per_visit_amount: '회당 단가',
  project_amount: '공사금액',
  project_end_date: '공사종료일',
  project_start_date: '공사시작일',
  road_address: '도로명주소',
  site_address: '현장 주소',
  site_code: '사업장개시번호',
  site_name: '현장명',
  total_contract_amount: '총 계약금액',
  total_rounds: '총 회차',
};

function buildScopeSummary(scope: ExcelImportScope): ExcelImportScopeSummary {
  return {
    ...scope,
    label: scope.siteId ? '현장 1곳' : scope.headquarterId ? '사업장 1곳' : '전체',
  };
}

function formatApplyNotice(preview: ExcelImportPreview, result: ExcelApplyResult) {
  return [
    `${preview.fileName} 반영이 완료되었습니다.`,
    `포함 행 ${result.rows.length}건`,
    `사업장 생성 ${result.summary.createdHeadquarterCount}건`,
    `사업장 갱신 ${result.summary.updatedHeadquarterCount}건`,
    `현장 생성 ${result.summary.createdSiteCount}건`,
    `현장 갱신 ${result.summary.updatedSiteCount}건`,
    `보완 필요 ${result.summary.completionRequiredCount}건`,
  ].join(' · ');
}

function summarizeValues(row: ExcelImportPreviewRow) {
  return Object.entries(row.values)
    .filter(([, value]) => value.trim())
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' / ');
}

export function ExcelImportSection({ onReload, scope }: ExcelImportSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<ExcelImportPreview | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    '업로드할 .xlsx 파일을 선택해 주세요.',
  );

  const scopeSummary = preview?.scope ?? buildScopeSummary(scope);
  const selectedSheet = useMemo(
    () => preview?.sheets.find((sheet) => sheet.name === selectedSheetName) ?? preview?.sheets[0] ?? null,
    [preview, selectedSheetName],
  );

  const includedRows = useMemo<ExcelImportPreviewRow[]>(
    () => selectedSheet?.includedRows ?? [],
    [selectedSheet],
  );
  const excludedRows = useMemo<ExcelImportPreviewRow[]>(
    () => selectedSheet?.excludedRows ?? [],
    [selectedSheet],
  );
  const headers = useMemo(
    () =>
      selectedSheet?.headers ??
      Object.keys(includedRows[0]?.values ?? excludedRows[0]?.values ?? {}),
    [excludedRows, includedRows, selectedSheet],
  );
  const missingFieldLabels = useMemo(
    () =>
      selectedSheet
        ? Object.entries(FIELD_LABELS)
            .filter(([field]) => !selectedSheet.suggestedMapping[field])
            .map(([, label]) => label)
        : [],
    [selectedSheet],
  );

  const handleFileSelection = async (file: File | null) => {
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      setPreview(null);
      setSelectedSheetName('');
      const nextPreview = await parseExcelWorkbook(file, scope);
      setPreview(nextPreview);
      setSelectedSheetName(nextPreview.sheets[0]?.name || '');
      setNotice('엑셀 파일을 읽었습니다. 포함 행과 제외 행을 확인한 뒤 반영할 수 있습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '엑셀 파일을 읽지 못했습니다.');
      setNotice(null);
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleApply = async () => {
    if (!preview || !selectedSheet) return;
    try {
      setApplying(true);
      setError(null);
      const result = await applyExcelWorkbook({
        jobId: preview.jobId,
        scope,
        sheetName: selectedSheet.name,
      });
      setNotice(formatApplyNotice(preview, result));
      await onReload({ force: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '엑셀 내용을 반영하지 못했습니다.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={styles.stepStack}>
      <section className={sharedStyles.sectionCard}>
        <div className={sharedStyles.sectionHeader}>
          <div>
            <h2 className={sharedStyles.sectionTitle}>엑셀 업로드</h2>
            <p className={styles.stepDescription}>
              현재 스코프 <strong>{scopeSummary.label}</strong>에 맞는 행만 메인 미리보기에 표시되고,
              제외된 행은 별도 표에서 확인할 수 있습니다.
            </p>
          </div>
          <div className={sharedStyles.sectionHeaderActions}>
            <span className="app-chip">{scopeSummary.label}</span>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => inputRef.current?.click()}
              disabled={loading || applying}
            >
              {loading ? '엑셀 업로드 중...' : '엑셀 업로드'}
            </button>
          </div>
        </div>
        <div className={sharedStyles.sectionBody}>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={styles.hiddenInput}
            onChange={(event) => {
              void handleFileSelection(event.target.files?.[0] ?? null);
            }}
          />
          {error ? <div className={styles.errorBox}>{error}</div> : null}
          {notice ? <div className={styles.noticeBox}>{notice}</div> : null}
        </div>
      </section>

      {preview && selectedSheet ? (
        <section className={sharedStyles.sectionCard}>
          <div className={sharedStyles.sectionHeader}>
            <div>
              <h2 className={sharedStyles.sectionTitle}>엑셀 미리보기</h2>
              <p className={styles.stepDescription}>
                포함 행만 반영됩니다. 제외된 행은 반영 대상에 포함되지 않습니다.
              </p>
            </div>
            <div className={sharedStyles.sectionHeaderActions}>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => {
                  setPreview(null);
                  setSelectedSheetName('');
                  setError(null);
                  setNotice('업로드할 .xlsx 파일을 선택해 주세요.');
                }}
                disabled={loading || applying}
              >
                취소
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => void handleApply()}
                disabled={applying || loading || selectedSheet.includedRowCount === 0}
              >
                {applying ? '업데이트 중...' : '업데이트'}
              </button>
            </div>
          </div>
          <div className={sharedStyles.sectionBody}>
            <div className={styles.inlineActions}>
              <span className="app-chip">{preview.fileName}</span>
              <span className="app-chip">{scopeSummary.label}</span>
              {preview.sheets.length > 1 ? (
                <label className={styles.selectLabel}>
                  <span className={styles.summaryLabel}>시트</span>
                  <select
                    className="app-select"
                    value={selectedSheet.name}
                    onChange={(event) => setSelectedSheetName(event.target.value)}
                  >
                    {preview.sheets.map((sheet) => (
                      <option key={sheet.name} value={sheet.name}>
                        {sheet.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="app-chip">시트 {selectedSheet.name}</span>
              )}
            </div>

            {missingFieldLabels.length > 0 ? (
              <div className={styles.mappingHint}>
                자동 감지되지 않은 필드: {missingFieldLabels.join(', ')}. 이 파일에서 값이 비어 있으면 기존
                DB 값은 유지됩니다.
              </div>
            ) : null}

            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>총 데이터 행</span>
                <strong className={styles.summaryValue}>{selectedSheet.rowCount}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>포함 행</span>
                <strong className={styles.summaryValue}>{selectedSheet.includedRowCount}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>제외 행</span>
                <strong className={styles.summaryValue}>{selectedSheet.excludedRowCount}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>자동 신규 생성</span>
                <strong className={styles.summaryValue}>{selectedSheet.summary.createCount}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>자동 사업장 갱신</span>
                <strong className={styles.summaryValue}>{selectedSheet.summary.updateHeadquarterCount}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>자동 현장 갱신</span>
                <strong className={styles.summaryValue}>{selectedSheet.summary.updateSiteCount}</strong>
              </article>
            </div>

            {selectedSheet.includedRowCount === 0 ? (
              <div className={styles.emptyState}>현재 스코프에 맞는 반영 대상 행이 없습니다.</div>
            ) : (
              <div className={styles.previewGrid}>
                <table className={styles.rowTable}>
                  <thead>
                    <tr>
                      <th>행</th>
                      <th>요약</th>
                      <th>자동 처리</th>
                      {headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {includedRows.map((row) => (
                      <tr key={`preview-row-${row.rowIndex}`}>
                        <td>{row.rowIndex}</td>
                        <td>{row.summary || '-'}</td>
                        <td>{row.suggestedAction || '-'}</td>
                        {headers.map((header) => (
                          <td key={`${row.rowIndex}-${header}`}>{row.values[header] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {excludedRows.length > 0 ? (
              <details className={styles.excludedPanel}>
                <summary className={styles.excludedSummary}>
                  제외된 행 {excludedRows.length}건 보기
                </summary>
                <div className={styles.previewGrid}>
                  <table className={styles.rowTable}>
                    <thead>
                      <tr>
                        <th>행</th>
                        <th>제외 사유</th>
                        <th>요약</th>
                        <th>원본 값 일부</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excludedRows.map((row) => (
                        <tr key={`excluded-row-${row.rowIndex}`}>
                          <td>{row.rowIndex}</td>
                          <td>{row.exclusionReason || '-'}</td>
                          <td>{row.summary || '-'}</td>
                          <td>{summarizeValues(row) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
