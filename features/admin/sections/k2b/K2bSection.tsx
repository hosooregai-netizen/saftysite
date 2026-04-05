'use client';

import { useMemo, useRef, useState } from 'react';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import { applyK2bWorkbook, parseK2bWorkbook } from '@/lib/k2b/apiClient';
import type { K2bImportPreview, K2bImportPreviewRow } from '@/types/k2b';
import styles from './K2bSection.module.css';

interface K2bSectionProps {
  onReload: (options?: {
    includeContent?: boolean;
    includeReports?: boolean;
    force?: boolean;
  }) => Promise<void>;
}

function formatApplyNotice(preview: K2bImportPreview, summary: {
  createdHeadquarterCount: number;
  updatedHeadquarterCount: number;
  createdSiteCount: number;
  updatedSiteCount: number;
  completionRequiredCount: number;
}) {
  return [
    `${preview.fileName} 반영이 완료되었습니다.`,
    `사업장 생성 ${summary.createdHeadquarterCount}건`,
    `사업장 갱신 ${summary.updatedHeadquarterCount}건`,
    `현장 생성 ${summary.createdSiteCount}건`,
    `현장 갱신 ${summary.updatedSiteCount}건`,
    `보완 필요 ${summary.completionRequiredCount}건`,
  ].join(' · ');
}

export function K2bSection({ onReload }: K2bSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<K2bImportPreview | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    '업로드할 .xlsx 파일을 선택해 주세요.',
  );

  const selectedSheet = useMemo(
    () => preview?.sheets.find((sheet) => sheet.name === selectedSheetName) ?? preview?.sheets[0] ?? null,
    [preview, selectedSheetName],
  );

  const rows = useMemo<K2bImportPreviewRow[]>(() => selectedSheet?.rowPreviews ?? [], [selectedSheet]);
  const headers = useMemo(
    () => selectedSheet?.headers ?? Object.keys(rows[0]?.values ?? {}),
    [rows, selectedSheet],
  );

  const handleFileSelection = async (file: File | null) => {
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      setPreview(null);
      setSelectedSheetName('');
      const nextPreview = await parseK2bWorkbook(file);
      setPreview(nextPreview);
      setSelectedSheetName(nextPreview.sheets[0]?.name || '');
      setNotice('엑셀 파일을 읽었습니다. 미리보기 내용을 확인한 뒤 업데이트할 수 있습니다.');
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
      const result = await applyK2bWorkbook({
        jobId: preview.jobId,
        sheetName: selectedSheet.name,
      });
      setNotice(formatApplyNotice(preview, result.summary));
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
              엑셀 파일을 업로드하면 전체 행을 미리 보여주고, 확인 후 바로 업데이트할 수 있습니다.
            </p>
          </div>
          <div className={sharedStyles.sectionHeaderActions}>
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
                자동 감지 결과를 확인한 뒤 현재 시트를 그대로 업데이트합니다.
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
                disabled={applying || loading || selectedSheet.rowCount === 0}
              >
                {applying ? '업데이트 중...' : '업데이트'}
              </button>
            </div>
          </div>
          <div className={sharedStyles.sectionBody}>
            <div className={styles.inlineActions}>
              <span className="app-chip">{preview.fileName}</span>
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

            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>총 행 수</span>
                <strong className={styles.summaryValue}>{selectedSheet.rowCount}</strong>
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
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>중복 후보로 신규 생성</span>
                <strong className={styles.summaryValue}>{selectedSheet.summary.ambiguousCreateCount}</strong>
              </article>
            </div>

            {selectedSheet.rowCount === 0 ? (
              <div className={styles.emptyState}>선택한 시트에 반영할 데이터 행이 없습니다.</div>
            ) : (
              <div className={styles.previewGrid}>
                <table className={styles.rowTable}>
                  <thead>
                    <tr>
                      <th>행</th>
                      {headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`preview-row-${row.rowIndex}`}>
                        <td>{row.rowIndex}</td>
                        {headers.map((header) => (
                          <td key={`${row.rowIndex}-${header}`}>{row.values[header] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
