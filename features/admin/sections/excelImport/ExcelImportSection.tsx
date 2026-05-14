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
  ExcelImportSheetPreview,
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
  contact_email: '건설사 담당자 이메일',
  contact_name: '건설사 담당자명',
  contact_phone: '건설사 담당자 연락처',
  contract_date: '계약일',
  contract_type: '계약유형',
  corporate_registration_no: '법인등록번호',
  headquarter_management_number: '사업장관리번호',
  headquarter_name: '건설사명',
  headquarter_opening_number: '사업개시번호',
  license_no: '면허번호',
  management_number: '사업장관리번호',
  manager_name: '현장소장명',
  manager_phone: '현장소장 연락처',
  per_visit_amount: '회당 단가',
  project_amount: '공사금액',
  project_end_date: '공사종료일',
  project_start_date: '공사시작일',
  progress_rate: '공정률',
  road_address: '도로명주소',
  round_no: '회차',
  site_address: '현장 주소',
  site_code: '사업개시번호',
  site_name: '현장명',
  completion_status: '완료여부',
  total_contract_amount: '총 계약금액',
  total_rounds: '총 회차',
  visit_date: '기술지도일',
};

interface K2bPreviewRow {
  companyName: string;
  contractPeriod: string;
  contractSignedDate: string;
  projectAmount: string;
  rowIndex: number;
  siteName: string;
  totalRounds: string;
}

function buildScopeSummary(scope: ExcelImportScope): ExcelImportScopeSummary {
  return {
    ...scope,
    label: scope.siteId ? '현장 1곳' : scope.headquarterId ? '건설사 1곳' : '전체',
  };
}

function formatApplyNotice(preview: ExcelImportPreview, result: ExcelApplyResult) {
  return [
    `${preview.fileName} 반영이 완료되었습니다.`,
    `포함 행 ${result.rows.length}건`,
    `건설사 생성 ${result.summary.createdHeadquarterCount}건`,
    `건설사 갱신 ${result.summary.updatedHeadquarterCount}건`,
    `현장 생성 ${result.summary.createdSiteCount}건`,
    `현장 갱신 ${result.summary.updatedSiteCount}건`,
    `기존 지도요원 매칭 ${result.summary.matchedExistingUserCount ?? 0}건`,
    `지도요원 가계정 생성 ${result.summary.createdPlaceholderUserCount ?? 0}건`,
    `지도요원 배정 연결 ${result.summary.createdAssignmentCount ?? 0}건`,
    `동명이인 보류 ${result.summary.ambiguousWorkerMatchCount ?? 0}건`,
    `회차 일정 생성 ${result.summary.createdScheduleCount ?? 0}건`,
    `기존 회차 재사용 ${result.summary.reusedScheduleCount ?? 0}건`,
    `보고서 생성 ${result.summary.createdReportCount ?? 0}건`,
    `기존 보고서 재사용 ${result.summary.reusedReportCount ?? 0}건`,
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

function getFieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field;
}

function displayValue(value: string | null | undefined) {
  const normalized = (value ?? '').trim();
  return normalized || '-';
}

function getMappedRowValue(
  row: ExcelImportPreviewRow,
  selectedSheet: ExcelImportSheetPreview | null,
  field: string,
) {
  const header = selectedSheet?.suggestedMapping[field]?.trim();
  if (!header) return '';
  return row.values[header]?.trim() ?? '';
}

function formatContractPeriod(startDate: string, endDate: string) {
  if (!startDate && !endDate) return '-';
  return `${displayValue(startDate)} ~ ${displayValue(endDate)}`;
}

function buildK2bPreviewRow(
  row: ExcelImportPreviewRow,
  selectedSheet: ExcelImportSheetPreview | null,
): K2bPreviewRow {
  const projectAmount =
    getMappedRowValue(row, selectedSheet, 'project_amount') ||
    getMappedRowValue(row, selectedSheet, 'total_contract_amount');
  return {
    companyName: displayValue(getMappedRowValue(row, selectedSheet, 'headquarter_name')),
    contractPeriod: formatContractPeriod(
      getMappedRowValue(row, selectedSheet, 'contract_start_date'),
      getMappedRowValue(row, selectedSheet, 'contract_end_date'),
    ),
    contractSignedDate: displayValue(getMappedRowValue(row, selectedSheet, 'contract_signed_date')),
    projectAmount: displayValue(projectAmount),
    rowIndex: row.rowIndex,
    siteName: displayValue(getMappedRowValue(row, selectedSheet, 'site_name')),
    totalRounds: displayValue(getMappedRowValue(row, selectedSheet, 'total_rounds')),
  };
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

  const isK2bImport = scope.importKind === 'k2b_guidance';
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
  const k2bPreviewRows = useMemo(
    () => includedRows.map((row) => buildK2bPreviewRow(row, selectedSheet)),
    [includedRows, selectedSheet],
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
      setNotice(
        isK2bImport
          ? 'K2B 엑셀 파일을 읽었습니다. 포함 행은 건설사, 현장, 회차 일정, 기술지도 보고서로 반영됩니다.'
          : '엑셀 파일을 읽었습니다. 포함 행과 제외 행을 확인한 뒤 반영할 수 있습니다.',
      );
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
              {isK2bImport
                ? '회차와 기술지도일이 있는 K2B 행만 자동등록 대상에 포함됩니다.'
                : (
                  <>
                    현재 스코프 <strong>{scopeSummary.label}</strong>에 맞는 행만 메인 미리보기에 표시되고,
                    제외된 행은 별도 표에서 확인할 수 있습니다.
                  </>
                )}
            </p>
          </div>
          <div className={sharedStyles.sectionHeaderActions}>
            {!isK2bImport ? <span className="app-chip">{scopeSummary.label}</span> : null}
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
              {!isK2bImport ? (
                <p className={styles.stepDescription}>
                  포함 행만 반영됩니다. 제외된 행은 반영 대상에 포함되지 않습니다.
                </p>
              ) : null}
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
                disabled={
                  applying ||
                  loading ||
                  selectedSheet.includedRowCount === 0 ||
                  selectedSheet.hasRiskyMapping
                }
              >
                {applying ? '업데이트 중...' : '업데이트'}
              </button>
            </div>
          </div>
          <div className={sharedStyles.sectionBody}>
            {!isK2bImport || preview.sheets.length > 1 ? (
              <div className={styles.inlineActions}>
                {!isK2bImport ? (
                  <>
                    <span className="app-chip">{preview.fileName}</span>
                    <span className="app-chip">{scopeSummary.label}</span>
                  </>
                ) : null}
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
                ) : !isK2bImport ? (
                  <span className="app-chip">시트 {selectedSheet.name}</span>
                ) : null}
              </div>
            ) : null}

            {!isK2bImport && missingFieldLabels.length > 0 ? (
              <div className={styles.mappingHint}>
                자동 감지되지 않은 필드: {missingFieldLabels.join(', ')}. 이 파일에서 값이 비어 있으면 기존
                DB 값은 유지됩니다.
              </div>
            ) : null}

            {selectedSheet.mappingWarnings.length > 0 ? (
              <div className={styles.warningBox}>{selectedSheet.mappingWarnings.join(' ')}</div>
            ) : null}

            {!isK2bImport && (selectedSheet.detectedMappings.length > 0 || selectedSheet.ignoredHeaders.length > 0) ? (
              <div className={styles.mappingGrid}>
                <article className={styles.mappingCard}>
                  <h3 className={styles.mappingTitle}>자동 감지된 매핑</h3>
                  {selectedSheet.detectedMappings.length > 0 ? (
                    <div className={styles.mappingList}>
                      {selectedSheet.detectedMappings.map((mapping) => (
                        <div key={`${mapping.field}-${mapping.header}`} className={styles.mappingItem}>
                          <strong>{getFieldLabel(mapping.field)}</strong>
                          <span>{mapping.header}</span>
                          {mapping.note ? (
                            <span className={styles.mappingNote}>{mapping.note}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.summaryMeta}>자동 매핑된 컬럼이 없습니다.</div>
                  )}
                </article>

                <article className={styles.mappingCard}>
                  <h3 className={styles.mappingTitle}>자동 제외된 컬럼</h3>
                  {selectedSheet.ignoredHeaders.length > 0 ? (
                    <div className={styles.mappingList}>
                      {selectedSheet.ignoredHeaders.map((ignored) => (
                        <div key={ignored.header} className={styles.mappingItem}>
                          <strong>{ignored.header}</strong>
                          <span className={styles.mappingNote}>{ignored.reason}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.summaryMeta}>자동 제외된 컬럼이 없습니다.</div>
                  )}
                </article>
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
                <span className={styles.summaryLabel}>자동 건설사 갱신</span>
                <strong className={styles.summaryValue}>{selectedSheet.summary.updateHeadquarterCount}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>자동 현장 갱신</span>
                <strong className={styles.summaryValue}>{selectedSheet.summary.updateSiteCount}</strong>
              </article>
            </div>

            {selectedSheet.includedRowCount === 0 ? (
              <div className={styles.emptyState}>현재 스코프에 맞는 반영 대상 행이 없습니다.</div>
            ) : isK2bImport ? (
              <div className={styles.k2bPreviewSection}>
                <div className={styles.k2bPreviewList} role="table" aria-label="K2B 엑셀 포함 행 미리보기">
                  <div className={`${styles.k2bPreviewRow} ${styles.k2bPreviewHeader}`} role="row">
                    <span className={styles.k2bPreviewCell} role="columnheader">회사명</span>
                    <span className={styles.k2bPreviewCell} role="columnheader">현장명</span>
                    <span className={styles.k2bPreviewCell} role="columnheader">공사금액</span>
                    <span className={styles.k2bPreviewCell} role="columnheader">계약기간</span>
                    <span className={styles.k2bPreviewCell} role="columnheader">계약체결일</span>
                    <span className={styles.k2bPreviewCell} role="columnheader">총 지도 회차 수</span>
                  </div>
                  {k2bPreviewRows.map((row) => (
                    <div className={styles.k2bPreviewRow} role="row" key={`k2b-preview-row-${row.rowIndex}`}>
                      <span className={styles.k2bPreviewCell} role="cell" title={row.companyName}>
                        {row.companyName}
                      </span>
                      <span className={styles.k2bPreviewCell} role="cell" title={row.siteName}>
                        {row.siteName}
                      </span>
                      <span className={styles.k2bPreviewCell} role="cell" title={row.projectAmount}>
                        {row.projectAmount}
                      </span>
                      <span className={styles.k2bPreviewCell} role="cell" title={row.contractPeriod}>
                        {row.contractPeriod}
                      </span>
                      <span className={styles.k2bPreviewCell} role="cell" title={row.contractSignedDate}>
                        {row.contractSignedDate}
                      </span>
                      <span className={styles.k2bPreviewCell} role="cell" title={row.totalRounds}>
                        {row.totalRounds}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
