'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import SignaturePad from '@/components/ui/SignaturePad';
import {
  ACCIDENT_TYPE_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  FUTURE_PROCESS_LIBRARY,
  INSPECTION_SECTIONS,
  LEGAL_REFERENCE_LIBRARY,
  NOTIFICATION_METHOD_OPTIONS,
  WORK_PLAN_ITEMS,
  WORK_PLAN_STATUS_OPTIONS,
  areFollowUpItemsEqual,
  buildDerivedFollowUpItems,
  createActivityRecord,
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createMeasurementCheckItem,
  createPreviousGuidanceFollowUpItem,
  createSafetyEducationRecord,
  getRecommendedCausativeAgentKeys,
  getSectionCompletion,
  getSessionProgress,
  getSessionSiteKey,
  getSessionTitle,
  getSiteDisplayTitle,
  touchDocumentMeta,
} from '@/constants/inspectionSession';
import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import { calculateRiskAssessmentResult } from '@/lib/riskAssessment';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import type {
  ChecklistQuestion,
  ChecklistRating,
  CurrentHazardFinding,
  InspectionDocumentSource,
  InspectionSectionKey,
  InspectionSession,
} from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';
import styles from './InspectionSessionWorkspace.module.css';

interface InspectionSessionWorkspaceProps {
  sessionId: string;
}

interface ChartEntry {
  count: number;
  label: string;
}

interface UploadBoxProps {
  accept?: string;
  fileName?: string;
  id: string;
  label: string;
  mode?: 'image' | 'file';
  onClear?: () => void;
  onSelect: (file: File) => Promise<void> | void;
  value: string;
}

const DOCUMENT_SOURCE_LABELS: Record<InspectionDocumentSource, string> = {
  manual: '수동 입력',
  api: 'API/DB 연동',
  admin: '관리자 기준',
  derived: '자동 파생',
  readonly: '읽기 전용',
};

const DOCUMENT_STATUS_LABELS = {
  not_started: '미작성',
  in_progress: '작성 중',
  completed: '완료',
} as const;

const PREVIOUS_IMPLEMENTATION_OPTIONS = [
  { value: '', label: '선택' },
  { value: 'implemented', label: '이행' },
  { value: 'partial', label: '부분 이행' },
  { value: 'not_implemented', label: '미이행' },
] as const;

const ACCIDENT_OCCURRENCE_OPTIONS = [
  { value: '', label: '선택' },
  { value: 'yes', label: '발생' },
  { value: 'no', label: '미발생' },
] as const;

const CHECKLIST_RATING_OPTIONS: Array<{ label: string; value: ChecklistRating }> = [
  { value: 'good', label: '양호' },
  { value: 'average', label: '보통' },
  { value: 'poor', label: '미흡' },
];

const RISK_SCALE_OPTIONS = [
  { value: '', label: '선택' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
] as const;

const META_TOUCH_FALLBACK_SECTION: InspectionSectionKey = 'doc2';

const SECTION_DESCRIPTIONS: Record<InspectionSectionKey, string> = {
  doc1: '관리자 기준 현장 스냅샷을 읽기 전용으로 보여줍니다.',
  doc2: '기술지도 개요와 작업계획서 13종, 재해 및 특이사항을 입력합니다.',
  doc3: '현장 전경 사진을 최대 6장까지 관리하고 주요 진행공정을 함께 기록합니다.',
  doc4: '이전 보고서의 후속조치 대상과 시정 결과를 before/after 카드로 확인합니다.',
  doc5: '문서 7 데이터로 자동 집계된 4개 차트와 기술지도 총평을 관리합니다.',
  doc6: '문서 7의 재해유형/기인물 기준 추천을 반영한 14개 핵심 조치를 체크합니다.',
  doc7: '현존 유해·위험요인을 반복 카드로 입력하고 법령/참고자료를 연동합니다.',
  doc8: '향후 작업공정 선택 시 위험요인과 안전대책을 자동 채움한 뒤 수정합니다.',
  doc9: 'TBM과 위험성평가 고정 문항 5개씩을 매트릭스로 기록합니다.',
  doc10: '조도계 중심 계측점검 3행을 기본 제공하고 행을 추가할 수 있습니다.',
  doc11: '교육 사진, 교육 자료, 참석인원, 교육내용을 한 카드로 기록합니다.',
  doc12: '활동 사진과 활동구분, 활동내용을 카드 단위로 관리합니다.',
  doc13: '관제실 재해 사례 피드를 2x2 카드로 읽기 전용 표시합니다.',
  doc14: '안전 정보 단일 패널을 공지형으로 읽기 전용 표시합니다.',
};

const CAUSATIVE_AGENT_OPTIONS = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
  section.rows.flatMap((row) => [row.left, row.right])
);

const CAUSATIVE_AGENT_LABELS = CAUSATIVE_AGENT_OPTIONS.reduce<
  Record<CausativeAgentKey, string>
>((accumulator, item) => {
  accumulator[item.key] = item.label;
  return accumulator;
}, {} as Record<CausativeAgentKey, string>);

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function isImageValue(value: string): boolean {
  return /^data:image\//.test(value) || /\.(png|jpe?g|gif|webp|svg)$/i.test(value);
}

function formatDateTime(value: string | null): string {
  if (!value) return '저장 대기 중';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}

function getMetaTouchSection(currentSection: InspectionSectionKey): InspectionSectionKey {
  if (currentSection === 'doc1' || currentSection === 'doc13' || currentSection === 'doc14') {
    return META_TOUCH_FALLBACK_SECTION;
  }

  return currentSection;
}

function hasFindingContent(item: CurrentHazardFinding): boolean {
  return Boolean(
    normalizeText(item.photoUrl) ||
      normalizeText(item.location) ||
      normalizeText(item.likelihood) ||
      normalizeText(item.severity) ||
      normalizeText(item.accidentType) ||
      normalizeText(item.causativeAgentKey) ||
      normalizeText(item.inspector) ||
      normalizeText(item.emphasis) ||
      normalizeText(item.improvementPlan) ||
      normalizeText(item.legalReferenceTitle)
  );
}

function buildCountEntries(
  items: CurrentHazardFinding[],
  getLabel: (item: CurrentHazardFinding) => string
): ChartEntry[] {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const label = normalizeText(getLabel(item));
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label, 'ko-KR');
    });
}

function UploadBox({
  accept = 'image/*',
  fileName,
  id,
  label,
  mode = 'image',
  onClear,
  onSelect,
  value,
}: UploadBoxProps) {
  const hasValue = Boolean(value);
  const isImage = mode === 'image' && isImageValue(value);

  return (
    <div className={styles.uploadBox}>
      <div className={styles.uploadHeader}>
        <span className={styles.uploadLabel}>{label}</span>
        {hasValue && onClear ? (
          <button type="button" className={styles.inlineDangerButton} onClick={onClear}>
            삭제
          </button>
        ) : null}
      </div>
      <div className={styles.uploadBody}>
        {hasValue ? (
          isImage ? (
            <img src={value} alt={label} className={styles.uploadPreview} />
          ) : (
            <div className={styles.filePreview}>
              <strong className={styles.filePreviewTitle}>{fileName || '업로드된 자료'}</strong>
              <p className={styles.filePreviewText}>자료 파일이 연결되어 있습니다.</p>
              <a href={value} download={fileName || 'material'} className={styles.fileLink}>
                파일 열기
              </a>
            </div>
          )
        ) : (
          <label htmlFor={id} className={styles.uploadPlaceholder}>
            <span>{mode === 'image' ? '이미지 업로드' : '자료 파일 업로드'}</span>
            <span className={styles.uploadHint}>
              {mode === 'image'
                ? '클릭해서 사진을 선택하세요.'
                : 'PDF, 이미지 등 자료 파일을 연결할 수 있습니다.'}
            </span>
          </label>
        )}
      </div>
      <div className={styles.uploadActions}>
        <label htmlFor={id} className="app-button app-button-secondary">
          {hasValue ? '교체' : '파일 선택'}
        </label>
        {hasValue && onClear ? (
          <button type="button" className="app-button app-button-danger" onClick={onClear}>
            비우기
          </button>
        ) : null}
      </div>
      <input
        id={id}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) {
            void Promise.resolve(onSelect(file));
          }
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}

function ChartCard({ entries, title }: { entries: ChartEntry[]; title: string }) {
  const max = entries.reduce((current, item) => Math.max(current, item.count), 0);

  return (
    <article className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      {entries.length > 0 ? (
        <div className={styles.chartList}>
          {entries.map((item) => (
            <div key={item.label} className={styles.chartRow}>
              <div className={styles.chartMeta}>
                <span className={styles.chartLabel}>{item.label}</span>
                <span className={styles.chartCount}>{item.count}</span>
              </div>
              <div className={styles.chartTrack} aria-hidden="true">
                <span
                  className={styles.chartFill}
                  style={{
                    width: `${max > 0 ? Math.max(14, (item.count / max) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyInline}>집계할 위험요인 데이터가 없습니다.</div>
      )}
    </article>
  );
}

export default function InspectionSessionWorkspace({
  sessionId,
}: InspectionSessionWorkspaceProps) {
  const {
    getSessionById,
    getSiteById,
    isReady,
    isAuthenticated,
    authError,
    login,
    saveNow,
    sessions,
    updateSession,
    masterData,
    syncError,
    isSaving,
  } = useInspectionSessions();
  const session = getSessionById(sessionId);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const legalReferenceLibrary =
    masterData.legalReferences.length > 0
      ? masterData.legalReferences
      : LEGAL_REFERENCE_LIBRARY;
  const correctionResultOptions = masterData.correctionResultOptions;

  useEffect(
    () => () => {
      void saveNow();
    },
    [saveNow]
  );

  useEffect(() => {
    if (!session) return;

    const nextFollowUps = buildDerivedFollowUpItems(session, sessions);
    if (areFollowUpItemsEqual(session.document4FollowUps, nextFollowUps)) return;

    updateSession(session.id, (current) => ({
      ...current,
      document4FollowUps: nextFollowUps,
    }));
  }, [session, sessions, updateSession]);

  useEffect(() => {
    if (!session) return;
    if (session.documentsMeta.doc6.source === 'manual') return;

    const recommended = getRecommendedCausativeAgentKeys(session.document7Findings);
    const isSame = session.document6Measures.every(
      (item) => item.checked === recommended.has(item.key)
    );
    if (isSame) return;

    updateSession(session.id, (current) =>
      touchDocumentMeta(
        {
          ...current,
          document6Measures: current.document6Measures.map((item) => ({
            ...item,
            checked: recommended.has(item.key),
          })),
        },
        'doc6',
        'derived'
      )
    );
  }, [session, updateSession]);

  const site = session ? getSiteById(getSessionSiteKey(session)) : null;
  const progress = session ? getSessionProgress(session) : null;
  const currentSection = session?.currentSection ?? 'doc1';
  const currentSectionMeta = session?.documentsMeta[currentSection] ?? null;
  const currentSectionIndex = session
    ? INSPECTION_SECTIONS.findIndex((item) => item.key === currentSection)
    : -1;

  const siteSessions = useMemo(() => {
    if (!session) return [];

    const siteKey = getSessionSiteKey(session);
    return sessions
      .filter((item) => getSessionSiteKey(item) === siteKey)
      .sort((left, right) => left.reportNumber - right.reportNumber);
  }, [session, sessions]);

  const currentFindings = useMemo(
    () => (session ? session.document7Findings.filter((item) => hasFindingContent(item)) : []),
    [session]
  );

  const cumulativeFindings = useMemo(() => {
    if (!session) return [];

    return siteSessions
      .filter((item) => item.reportNumber <= session.reportNumber)
      .flatMap((item) => item.document7Findings.filter((finding) => hasFindingContent(finding)));
  }, [session, siteSessions]);

  const currentAccidentEntries = useMemo(
    () => buildCountEntries(currentFindings, (item) => item.accidentType),
    [currentFindings]
  );
  const cumulativeAccidentEntries = useMemo(
    () => buildCountEntries(cumulativeFindings, (item) => item.accidentType),
    [cumulativeFindings]
  );
  const currentAgentEntries = useMemo(
    () =>
      buildCountEntries(currentFindings, (item) =>
        item.causativeAgentKey
          ? CAUSATIVE_AGENT_LABELS[item.causativeAgentKey] ?? item.causativeAgentKey
          : ''
      ),
    [currentFindings]
  );
  const cumulativeAgentEntries = useMemo(
    () =>
      buildCountEntries(cumulativeFindings, (item) =>
        item.causativeAgentKey
          ? CAUSATIVE_AGENT_LABELS[item.causativeAgentKey] ?? item.causativeAgentKey
          : ''
      ),
    [cumulativeFindings]
  );

  const recommendedAgentKeys = useMemo(
    () => (session ? getRecommendedCausativeAgentKeys(session.document7Findings) : new Set()),
    [session]
  );

  const backHref = site ? `/sites/${encodeURIComponent(site.id)}` : '/';
  const metaTouchSection = getMetaTouchSection(currentSection);

  const applyDocumentUpdate = (
    key: InspectionSectionKey,
    source: InspectionDocumentSource,
    updater: (current: InspectionSession) => InspectionSession,
    options?: { touch?: boolean }
  ) => {
    updateSession(sessionId, (current) => {
      const next = updater(current);
      if (options?.touch === false) return next;
      return touchDocumentMeta(next, key, source);
    });
  };

  const withFileData = async (
    file: File,
    onLoaded: (dataUrl: string, selectedFile: File) => void
  ) => {
    try {
      setUploadError(null);
      const dataUrl = await readFileAsDataUrl(file);
      onLoaded(dataUrl, file);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : '파일을 불러오는 중 오류가 발생했습니다.'
      );
    }
  };

  const handleMetaChange = (
    field: keyof InspectionSession['meta'],
    value: string
  ) => {
    applyDocumentUpdate(metaTouchSection, 'manual', (current) => {
      const previousReportDate = current.meta.reportDate;
      const previousDrafter = current.meta.drafter;

      return {
        ...current,
        meta: {
          ...current.meta,
          [field]: value,
        },
        document2Overview: {
          ...current.document2Overview,
          guidanceDate:
            field === 'reportDate' &&
            (!current.document2Overview.guidanceDate ||
              current.document2Overview.guidanceDate === previousReportDate)
              ? value
              : current.document2Overview.guidanceDate,
          assignee:
            field === 'drafter' &&
            (!current.document2Overview.assignee ||
              current.document2Overview.assignee === previousDrafter)
              ? value
              : current.document2Overview.assignee,
        },
        document4FollowUps:
          field === 'reportDate'
            ? current.document4FollowUps.map((item) => ({
                ...item,
                confirmationDate:
                  !item.confirmationDate || item.confirmationDate === previousReportDate
                    ? value
                    : item.confirmationDate,
              }))
            : current.document4FollowUps,
        document7Findings:
          field === 'drafter'
            ? current.document7Findings.map((item) => ({
                ...item,
                inspector:
                  !item.inspector || item.inspector === previousDrafter
                    ? value
                    : item.inspector,
              }))
            : current.document7Findings,
      };
    });
  };

  const moveSection = (direction: -1 | 1) => {
    const nextIndex = currentSectionIndex + direction;
    if (nextIndex < 0 || nextIndex >= INSPECTION_SECTIONS.length) return;

    updateSession(sessionId, (current) => ({
      ...current,
      currentSection: INSPECTION_SECTIONS[nextIndex].key,
    }));
  };

  const renderInfoTable = (
    title: string,
    rows: Array<{ label: string; value: string }>
  ) => (
    <section className={styles.infoTable}>
      <div className={styles.infoTableHeader}>{title}</div>
      <div className={styles.infoTableBody}>
        {rows.map((row) => (
          <div key={row.label} className={styles.infoRow}>
            <div className={styles.infoLabel}>{row.label}</div>
            <div className={styles.infoValue}>{row.value || '미입력'}</div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderChecklistTable = (
    title: string,
    items: ChecklistQuestion[],
    onChange: (itemId: string, patch: Partial<ChecklistQuestion>) => void
  ) => (
    <section className={styles.matrixCard}>
      <div className={styles.matrixHeader}>
        <h3 className={styles.matrixTitle}>{title}</h3>
      </div>
      <div className={styles.checklistTable}>
        <div className={styles.checklistHead}>
          <span>문항</span>
          <span>양호</span>
          <span>보통</span>
          <span>미흡</span>
          <span>비고</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className={styles.checklistRow}>
            <div className={styles.checklistPrompt}>{item.prompt}</div>
            {CHECKLIST_RATING_OPTIONS.map((option) => (
              <label key={option.value} className={styles.ratingCell}>
                <input
                  type="radio"
                  className={styles.appRadio}
                  name={item.id}
                  checked={item.rating === option.value}
                  onChange={() => onChange(item.id, { rating: option.value })}
                />
                <span className={styles.ratingLabel}>{option.label}</span>
              </label>
            ))}
            <input
              type="text"
              className="app-input"
              value={item.note}
              onChange={(event) => onChange(item.id, { note: event.target.value })}
            />
          </div>
        ))}
      </div>
    </section>
  );

  const renderSectionBody = () => {
    if (!session) return null;

    switch (currentSection) {
      case 'doc1': {
        const snapshot = session.adminSiteSnapshot;

        return (
          <div className={styles.sectionStack}>
            <div className={styles.readonlyBanner}>
              문서 1은 관리자 기준 현장 정보 스냅샷입니다. 현장 사용자는 수정할 수 없습니다.
            </div>
            <div className={styles.infoTableGrid}>
              {renderInfoTable('현장 정보', [
                { label: '현장명', value: snapshot.siteName },
                {
                  label: '사업장관리번호(사업개시번호)',
                  value:
                    snapshot.siteManagementNumber || snapshot.businessStartNumber,
                },
                { label: '공사기간', value: snapshot.constructionPeriod },
                { label: '공사금액', value: snapshot.constructionAmount },
                { label: '책임자', value: snapshot.siteManagerName },
                { label: '연락처(이메일)', value: snapshot.siteContactEmail },
                { label: '현장주소', value: snapshot.siteAddress },
              ])}
              {renderInfoTable('본사 정보', [
                { label: '회사명', value: snapshot.companyName || snapshot.customerName },
                {
                  label: '법인등록번호(사업자등록번호)',
                  value:
                    snapshot.corporationRegistrationNumber ||
                    snapshot.businessRegistrationNumber,
                },
                { label: '면허번호', value: snapshot.licenseNumber },
                { label: '연락처', value: snapshot.headquartersContact },
                { label: '본사주소', value: snapshot.headquartersAddress },
              ])}
            </div>
          </div>
        );
      }

      case 'doc2':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>실시일</span>
                <input
                  type="date"
                  className="app-input"
                  value={session.document2Overview.guidanceDate}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        guidanceDate: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>공정율</span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.progressRate}
                  placeholder="예: 45%"
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        progressRate: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>회차</span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.visitCount}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        visitCount: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>총회차</span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.totalVisitCount}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        totalVisitCount: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>담당요원</span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.assignee}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        assignee: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>이전기술지도 이행여부</span>
                <select
                  className="app-select"
                  value={session.document2Overview.previousImplementationStatus}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        previousImplementationStatus:
                          event.target.value as typeof current.document2Overview.previousImplementationStatus,
                      },
                    }))
                  }
                >
                  {PREVIOUS_IMPLEMENTATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>연락처</span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.contact}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        contact: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>지도기관명</span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.guidanceAgencyName}
                  readOnly
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>구분</span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.constructionType}
                  readOnly
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>통보방법</span>
                <select
                  className="app-select"
                  value={session.document2Overview.notificationMethod}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        notificationMethod:
                          event.target.value as typeof current.document2Overview.notificationMethod,
                      },
                    }))
                  }
                >
                  <option value="">선택</option>
                  {NOTIFICATION_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {session.document2Overview.notificationMethod === 'direct' ? (
                <>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>직접전달 성함</span>
                    <input
                      type="text"
                      className="app-input"
                      value={session.document2Overview.notificationRecipientName}
                      onChange={(event) =>
                        applyDocumentUpdate('doc2', 'manual', (current) => ({
                          ...current,
                          document2Overview: {
                            ...current.document2Overview,
                            notificationRecipientName: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <div className={`${styles.field} ${styles.fieldWide}`}>
                    <SignaturePad
                      label="직접전달 서명"
                      value={session.document2Overview.notificationRecipientSignature}
                      onChange={(nextValue) =>
                        applyDocumentUpdate('doc2', 'manual', (current) => ({
                          ...current,
                          document2Overview: {
                            ...current.document2Overview,
                            notificationRecipientSignature: nextValue,
                          },
                        }))
                      }
                    />
                  </div>
                </>
              ) : null}
              {session.document2Overview.notificationMethod === 'other' ? (
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>기타 통보방법</span>
                  <input
                    type="text"
                    className="app-input"
                    value={session.document2Overview.otherNotificationMethod}
                    onChange={(event) =>
                      applyDocumentUpdate('doc2', 'manual', (current) => ({
                        ...current,
                        document2Overview: {
                          ...current.document2Overview,
                          otherNotificationMethod: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              ) : null}
            </div>

            <section className={styles.matrixCard}>
              <div className={styles.matrixHeader}>
                <h3 className={styles.matrixTitle}>작업계획서 13종 상태</h3>
              </div>
              <div className={styles.planTable}>
                {WORK_PLAN_ITEMS.map((item) => (
                  <div key={item.key} className={styles.planRow}>
                    <div className={styles.planLabel}>{item.label}</div>
                    <select
                      className="app-select"
                      value={session.document2Overview.workPlanChecks[item.key]}
                      onChange={(event) =>
                        applyDocumentUpdate('doc2', 'manual', (current) => ({
                          ...current,
                          document2Overview: {
                            ...current.document2Overview,
                            workPlanChecks: {
                              ...current.document2Overview.workPlanChecks,
                              [item.key]: event.target.value as
                                typeof current.document2Overview.workPlanChecks[typeof item.key],
                            },
                          },
                        }))
                      }
                    >
                      {WORK_PLAN_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>산업재해 발생유무</span>
                <select
                  className="app-select"
                  value={session.document2Overview.accidentOccurred}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        accidentOccurred:
                          event.target.value as typeof current.document2Overview.accidentOccurred,
                      },
                    }))
                  }
                >
                  {ACCIDENT_OCCURRENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>최근 발생일자</span>
                <input
                  type="date"
                  className="app-input"
                  disabled={session.document2Overview.accidentOccurred !== 'yes'}
                  value={session.document2Overview.recentAccidentDate}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        recentAccidentDate: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>재해형태</span>
                <select
                  className="app-select"
                  disabled={session.document2Overview.accidentOccurred !== 'yes'}
                  value={session.document2Overview.accidentType}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        accidentType: event.target.value,
                      },
                    }))
                  }
                >
                  <option value="">선택</option>
                  {ACCIDENT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.fieldLabel}>재해개요</span>
                <textarea
                  className="app-textarea"
                  disabled={session.document2Overview.accidentOccurred !== 'yes'}
                  value={session.document2Overview.accidentSummary}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        accidentSummary: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.fieldLabel}>진행공정 및 특이사항</span>
                <textarea
                  className="app-textarea"
                  value={session.document2Overview.processAndNotes}
                  onChange={(event) =>
                    applyDocumentUpdate('doc2', 'manual', (current) => ({
                      ...current,
                      document2Overview: {
                        ...current.document2Overview,
                        processAndNotes: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            </div>
          </div>
        );

      case 'doc3':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.sectionToolbar}>
              <span className="app-chip">최대 6장</span>
              <span className="app-chip">1~2번 우선 입력</span>
            </div>
            <div className={styles.dualUploadGrid}>
              {session.document3Scenes.map((item, index) => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {item.title || `현장 전경 사진 ${index + 1}`}
                    </h3>
                  </div>
                  <UploadBox
                    id={`scene-photo-${item.id}`}
                    label="사진"
                    value={item.photoUrl}
                    onClear={() =>
                      applyDocumentUpdate('doc3', 'manual', (current) => ({
                        ...current,
                        document3Scenes: current.document3Scenes.map((scene, sceneIndex) =>
                          sceneIndex === index ? { ...scene, photoUrl: '' } : scene
                        ),
                      }))
                    }
                    onSelect={async (file) =>
                      withFileData(file, (dataUrl) =>
                        applyDocumentUpdate('doc3', 'manual', (current) => ({
                          ...current,
                          document3Scenes: current.document3Scenes.map((scene, sceneIndex) =>
                            sceneIndex === index ? { ...scene, photoUrl: dataUrl } : scene
                          ),
                        }))
                      )
                    }
                  />
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>사진 설명</span>
                    <input
                      type="text"
                      className="app-input"
                      value={item.description}
                      onChange={(event) =>
                        applyDocumentUpdate('doc3', 'manual', (current) => ({
                          ...current,
                          document3Scenes: current.document3Scenes.map((scene, sceneIndex) =>
                            sceneIndex === index
                              ? { ...scene, description: event.target.value }
                              : scene
                          ),
                        }))
                      }
                    />
                  </label>
                </article>
              ))}
            </div>
          </div>
        );

      case 'doc4':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.sectionToolbar}>
              <span className="app-chip">기본 3블록</span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() =>
                  applyDocumentUpdate('doc4', 'manual', (current) => ({
                    ...current,
                    document4FollowUps: [
                      ...current.document4FollowUps,
                      createPreviousGuidanceFollowUpItem({
                        confirmationDate: current.meta.reportDate,
                      }),
                    ],
                  }))
                }
              >
                블록 추가
              </button>
            </div>
            {session.document4FollowUps.map((item, index) => {
              const isDerived = Boolean(item.sourceSessionId && item.sourceFindingId);
              const canRemove = !isDerived && session.document4FollowUps.length > 3;

              return (
                <article key={item.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardEyebrow}>
                        {isDerived ? '이전 보고서 연동' : '수동 블록'}
                      </div>
                      <h3 className={styles.cardTitle}>{`후속조치 ${index + 1}`}</h3>
                    </div>
                    {canRemove ? (
                      <button
                        type="button"
                        className="app-button app-button-danger"
                        onClick={() =>
                          applyDocumentUpdate('doc4', 'manual', (current) => ({
                            ...current,
                            document4FollowUps: current.document4FollowUps.filter(
                              (followUp) => followUp.id !== item.id
                            ),
                          }))
                        }
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>

                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>유해·위험장소</span>
                      <input
                        type="text"
                        className="app-input"
                        value={item.location}
                        onChange={(event) =>
                          applyDocumentUpdate('doc4', 'manual', (current) => ({
                            ...current,
                            document4FollowUps: current.document4FollowUps.map((followUp) =>
                              followUp.id === item.id
                                ? { ...followUp, location: event.target.value }
                                : followUp
                            ),
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>지도일</span>
                      <input
                        type="date"
                        className="app-input"
                        value={item.guidanceDate}
                        readOnly={isDerived}
                        onChange={(event) =>
                          applyDocumentUpdate('doc4', 'manual', (current) => ({
                            ...current,
                            document4FollowUps: current.document4FollowUps.map((followUp) =>
                              followUp.id === item.id
                                ? { ...followUp, guidanceDate: event.target.value }
                                : followUp
                            ),
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>확인일</span>
                      <input
                        type="date"
                        className="app-input"
                        value={item.confirmationDate}
                        onChange={(event) =>
                          applyDocumentUpdate('doc4', 'manual', (current) => ({
                            ...current,
                            document4FollowUps: current.document4FollowUps.map((followUp) =>
                              followUp.id === item.id
                                ? { ...followUp, confirmationDate: event.target.value }
                                : followUp
                            ),
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className={styles.dualUploadGrid}>
                    <UploadBox
                      id={`follow-up-before-${item.id}`}
                      label="시정 전 사진"
                      value={item.beforePhotoUrl}
                      onClear={
                        isDerived
                          ? undefined
                          : () =>
                              applyDocumentUpdate('doc4', 'manual', (current) => ({
                                ...current,
                                document4FollowUps: current.document4FollowUps.map((followUp) =>
                                  followUp.id === item.id
                                    ? { ...followUp, beforePhotoUrl: '' }
                                    : followUp
                                ),
                              }))
                      }
                      onSelect={async (file) => {
                        if (isDerived) return;

                        await withFileData(file, (dataUrl) =>
                          applyDocumentUpdate('doc4', 'manual', (current) => ({
                            ...current,
                            document4FollowUps: current.document4FollowUps.map((followUp) =>
                              followUp.id === item.id
                                ? { ...followUp, beforePhotoUrl: dataUrl }
                                : followUp
                            ),
                          }))
                        );
                      }}
                    />
                    <UploadBox
                      id={`follow-up-after-${item.id}`}
                      label="시정 후 사진"
                      value={item.afterPhotoUrl}
                      onClear={() =>
                        applyDocumentUpdate('doc4', 'manual', (current) => ({
                          ...current,
                          document4FollowUps: current.document4FollowUps.map((followUp) =>
                            followUp.id === item.id
                              ? { ...followUp, afterPhotoUrl: '' }
                              : followUp
                          ),
                        }))
                      }
                      onSelect={async (file) =>
                        withFileData(file, (dataUrl) =>
                          applyDocumentUpdate('doc4', 'manual', (current) => ({
                            ...current,
                            document4FollowUps: current.document4FollowUps.map((followUp) =>
                              followUp.id === item.id
                                ? { ...followUp, afterPhotoUrl: dataUrl }
                                : followUp
                            ),
                          }))
                        )
                      }
                    />
                  </div>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>시정조치 결과</span>
                    <input
                      type="text"
                      list={`correction-result-options-${item.id}`}
                      className="app-input"
                      value={item.result}
                      onChange={(event) =>
                        applyDocumentUpdate('doc4', 'manual', (current) => ({
                          ...current,
                          document4FollowUps: current.document4FollowUps.map((followUp) =>
                            followUp.id === item.id
                              ? { ...followUp, result: event.target.value }
                              : followUp
                          ),
                        }))
                      }
                    />
                    {correctionResultOptions.length > 0 ? (
                      <datalist id={`correction-result-options-${item.id}`}>
                        {correctionResultOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    ) : null}
                  </label>
                </article>
              );
            })}
          </div>
        );

      case 'doc5':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.chartGrid}>
              <ChartCard title="지적유형별 금회" entries={currentAccidentEntries} />
              <ChartCard title="지적유형별 누적" entries={cumulativeAccidentEntries} />
              <ChartCard title="기인물별 금회" entries={currentAgentEntries} />
              <ChartCard title="기인물별 누적" entries={cumulativeAgentEntries} />
            </div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>기술지도 총평</span>
              <textarea
                className="app-textarea"
                value={session.document5Summary.summaryText}
                onChange={(event) =>
                  applyDocumentUpdate('doc5', 'manual', (current) => ({
                    ...current,
                    document5Summary: {
                      ...current.document5Summary,
                      summaryText: event.target.value,
                    },
                  }))
                }
              />
            </label>
          </div>
        );

      case 'doc6':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.sectionToolbar}>
              <span className="app-chip">추천 {recommendedAgentKeys.size}건</span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() =>
                  applyDocumentUpdate('doc6', 'derived', (current) => ({
                    ...current,
                    document6Measures: current.document6Measures.map((measure) => ({
                      ...measure,
                      checked: recommendedAgentKeys.has(measure.key),
                    })),
                  }))
                }
              >
                추천값 다시 반영
              </button>
            </div>
            <div className={styles.measureTable}>
              {CAUSATIVE_AGENT_SECTIONS.flatMap((section) => section.rows).map((row) => (
                <div key={`${row.left.key}-${row.right.key}`} className={styles.measureRow}>
                  {[row.left, row.right].map((item) => {
                    const currentMeasure = session.document6Measures.find(
                      (measure) => measure.key === item.key
                    );

                    return (
                      <label key={item.key} className={styles.measureCell}>
                        <div className={styles.measureMain}>
                          <input
                            type="checkbox"
                            className="app-checkbox"
                            checked={currentMeasure?.checked ?? false}
                            onChange={(event) =>
                              applyDocumentUpdate('doc6', 'manual', (current) => ({
                                ...current,
                                document6Measures: current.document6Measures.map((measure) =>
                                  measure.key === item.key
                                    ? { ...measure, checked: event.target.checked }
                                    : measure
                                ),
                              }))
                            }
                          />
                          <div>
                            <div className={styles.measureTitle}>
                              <span className={styles.measureNumber}>{item.number}</span>
                              <span>{item.label}</span>
                            </div>
                            <p className={styles.measureText}>{item.guidance}</p>
                          </div>
                        </div>
                        {recommendedAgentKeys.has(item.key) ? (
                          <span className={styles.recommendBadge}>추천</span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );

      case 'doc7':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.sectionToolbar}>
              <span className="app-chip">기본 1블록</span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() =>
                  applyDocumentUpdate('doc7', 'manual', (current) => ({
                    ...current,
                    document7Findings: [
                      ...current.document7Findings,
                      createCurrentHazardFinding({ inspector: current.meta.drafter }),
                    ],
                  }))
                }
              >
                위험요인 추가
              </button>
            </div>
            {session.document7Findings.map((item, index) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardEyebrow}>반복 카드</div>
                    <h3 className={styles.cardTitle}>{`위험요인 ${index + 1}`}</h3>
                  </div>
                  {session.document7Findings.length > 1 ? (
                    <button
                      type="button"
                      className="app-button app-button-danger"
                      onClick={() =>
                        applyDocumentUpdate('doc7', 'manual', (current) => ({
                          ...current,
                          document7Findings: current.document7Findings.filter(
                            (finding) => finding.id !== item.id
                          ),
                        }))
                      }
                    >
                      삭제
                    </button>
                  ) : null}
                </div>

                <div className={styles.findingGrid}>
                  <UploadBox
                    id={`finding-photo-${item.id}`}
                    label="현장 사진"
                    value={item.photoUrl}
                    onClear={() =>
                      applyDocumentUpdate('doc7', 'manual', (current) => ({
                        ...current,
                        document7Findings: current.document7Findings.map((finding) =>
                          finding.id === item.id ? { ...finding, photoUrl: '' } : finding
                        ),
                      }))
                    }
                    onSelect={async (file) =>
                      withFileData(file, (dataUrl) =>
                        applyDocumentUpdate('doc7', 'manual', (current) => ({
                          ...current,
                          document7Findings: current.document7Findings.map((finding) =>
                            finding.id === item.id
                              ? { ...finding, photoUrl: dataUrl }
                              : finding
                          ),
                        }))
                      )
                    }
                  />

                  <div className={styles.sectionStack}>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>유해·위험장소</span>
                        <input
                          type="text"
                          className="app-input"
                          value={item.location}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? { ...finding, location: event.target.value }
                                  : finding
                              ),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>가능성</span>
                        <select
                          className="app-select"
                          value={item.likelihood}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) => {
                                if (finding.id !== item.id) return finding;
                                const likelihood = event.target.value;

                                return {
                                  ...finding,
                                  likelihood,
                                  riskLevel: calculateRiskAssessmentResult(
                                    likelihood,
                                    finding.severity
                                  ),
                                };
                              }),
                            }))
                          }
                        >
                          {RISK_SCALE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>중대성</span>
                        <select
                          className="app-select"
                          value={item.severity}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) => {
                                if (finding.id !== item.id) return finding;
                                const severity = event.target.value;

                                return {
                                  ...finding,
                                  severity,
                                  riskLevel: calculateRiskAssessmentResult(
                                    finding.likelihood,
                                    severity
                                  ),
                                };
                              }),
                            }))
                          }
                        >
                          {RISK_SCALE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>위험도 결과</span>
                        <input
                          type="text"
                          className="app-input"
                          value={item.riskLevel}
                          readOnly
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>재해유형</span>
                        <select
                          className="app-select"
                          value={item.accidentType}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? { ...finding, accidentType: event.target.value }
                                  : finding
                              ),
                            }))
                          }
                        >
                          <option value="">선택</option>
                          {ACCIDENT_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>기인물</span>
                        <select
                          className="app-select"
                          value={item.causativeAgentKey}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? {
                                      ...finding,
                                      causativeAgentKey:
                                        event.target.value as CausativeAgentKey | '',
                                    }
                                  : finding
                              ),
                            }))
                          }
                        >
                          <option value="">선택</option>
                          {CAUSATIVE_AGENT_OPTIONS.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.number}. {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>지도요원</span>
                        <input
                          type="text"
                          className="app-input"
                          value={item.inspector}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? { ...finding, inspector: event.target.value }
                                  : finding
                              ),
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div className={styles.formGrid}>
                      <label className={`${styles.field} ${styles.fieldWide}`}>
                        <span className={styles.fieldLabel}>강조사항</span>
                        <textarea
                          className="app-textarea"
                          value={item.emphasis}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? { ...finding, emphasis: event.target.value }
                                  : finding
                              ),
                            }))
                          }
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldWide}`}>
                        <span className={styles.fieldLabel}>개선대책</span>
                        <textarea
                          className="app-textarea"
                          value={item.improvementPlan}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? { ...finding, improvementPlan: event.target.value }
                                  : finding
                              ),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>관계법령 선택</span>
                        <select
                          className="app-select"
                          value={item.legalReferenceId}
                          onChange={(event) => {
                            const reference = legalReferenceLibrary.find(
                              (libraryItem) => libraryItem.id === event.target.value
                            );

                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? {
                                      ...finding,
                                      legalReferenceId: event.target.value,
                                      legalReferenceTitle: reference?.title ?? '',
                                      referenceMaterial1:
                                        reference?.referenceMaterial1 ?? '',
                                      referenceMaterial2:
                                        reference?.referenceMaterial2 ?? '',
                                    }
                                  : finding
                              ),
                            }));
                          }}
                        >
                          <option value="">선택</option>
                          {legalReferenceLibrary.map((libraryItem) => (
                            <option key={libraryItem.id} value={libraryItem.id}>
                              {libraryItem.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>선택 법령</span>
                        <input
                          type="text"
                          className="app-input"
                          value={item.legalReferenceTitle}
                          readOnly
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>참고자료 1</span>
                        <input
                          type="text"
                          className="app-input"
                          value={item.referenceMaterial1}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? { ...finding, referenceMaterial1: event.target.value }
                                  : finding
                              ),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>참고자료 2</span>
                        <input
                          type="text"
                          className="app-input"
                          value={item.referenceMaterial2}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? { ...finding, referenceMaterial2: event.target.value }
                                  : finding
                              ),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.checkboxField}>
                        <input
                          type="checkbox"
                          className="app-checkbox"
                          checked={item.carryForward}
                          onChange={(event) =>
                            applyDocumentUpdate('doc7', 'manual', (current) => ({
                              ...current,
                              document7Findings: current.document7Findings.map((finding) =>
                                finding.id === item.id
                                  ? { ...finding, carryForward: event.target.checked }
                                  : finding
                              ),
                            }))
                          }
                        />
                        <span>이전 기술지도 후속조치 대상에 이관</span>
                      </label>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        );

      case 'doc8':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.sectionToolbar}>
              <span className="app-chip">기본 1행</span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() =>
                  applyDocumentUpdate('doc8', 'manual', (current) => ({
                    ...current,
                    document8Plans: [...current.document8Plans, createFutureProcessRiskPlan()],
                  }))
                }
              >
                행 추가
              </button>
            </div>
            <div className={styles.tableCard}>
              <div className={styles.futureTableHead}>
                <span>향후 주요 작업공정</span>
                <span>위험요인</span>
                <span>안전대책</span>
                <span>비고</span>
                <span>작업</span>
              </div>
              {session.document8Plans.map((item) => (
                <div key={item.id} className={styles.futureTableRow}>
                  <input
                    list="future-process-library"
                    className="app-input"
                    value={item.processName}
                    onChange={(event) => {
                      const matched = FUTURE_PROCESS_LIBRARY.find(
                        (libraryItem) => libraryItem.processName === event.target.value
                      );

                      applyDocumentUpdate(
                        'doc8',
                        matched ? 'api' : 'manual',
                        (current) => ({
                          ...current,
                          document8Plans: current.document8Plans.map((plan) =>
                            plan.id === item.id
                              ? {
                                  ...plan,
                                  processName: event.target.value,
                                  hazard: matched?.hazard ?? plan.hazard,
                                  countermeasure:
                                    matched?.countermeasure ?? plan.countermeasure,
                                  source: matched ? 'api' : 'manual',
                                }
                              : plan
                          ),
                        })
                      );
                    }}
                  />
                  <textarea
                    className={`${styles.tableTextarea} app-textarea`}
                    value={item.hazard}
                    onChange={(event) =>
                      applyDocumentUpdate('doc8', 'manual', (current) => ({
                        ...current,
                        document8Plans: current.document8Plans.map((plan) =>
                          plan.id === item.id
                            ? { ...plan, hazard: event.target.value, source: 'manual' }
                            : plan
                        ),
                      }))
                    }
                  />
                  <textarea
                    className={`${styles.tableTextarea} app-textarea`}
                    value={item.countermeasure}
                    onChange={(event) =>
                      applyDocumentUpdate('doc8', 'manual', (current) => ({
                        ...current,
                        document8Plans: current.document8Plans.map((plan) =>
                          plan.id === item.id
                            ? {
                                ...plan,
                                countermeasure: event.target.value,
                                source: 'manual',
                              }
                            : plan
                        ),
                      }))
                    }
                  />
                  <textarea
                    className={`${styles.tableTextarea} app-textarea`}
                    value={item.note}
                    onChange={(event) =>
                      applyDocumentUpdate('doc8', 'manual', (current) => ({
                        ...current,
                        document8Plans: current.document8Plans.map((plan) =>
                          plan.id === item.id
                            ? { ...plan, note: event.target.value, source: 'manual' }
                            : plan
                        ),
                      }))
                    }
                  />
                  <div className={styles.rowActions}>
                    <span className="app-chip">
                      {item.source === 'api' ? '자동채움' : '수동'}
                    </span>
                    {session.document8Plans.length > 1 ? (
                      <button
                        type="button"
                        className="app-button app-button-danger"
                        onClick={() =>
                          applyDocumentUpdate('doc8', 'manual', (current) => ({
                            ...current,
                            document8Plans: current.document8Plans.filter(
                              (plan) => plan.id !== item.id
                            ),
                          }))
                        }
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              <datalist id="future-process-library">
                {FUTURE_PROCESS_LIBRARY.map((item) => (
                  <option key={item.processName} value={item.processName} />
                ))}
              </datalist>
            </div>
          </div>
        );

      case 'doc9':
        return (
          <div className={styles.sectionStack}>
            {renderChecklistTable('TBM 체크', session.document9SafetyChecks.tbm, (itemId, patch) =>
              applyDocumentUpdate('doc9', 'manual', (current) => ({
                ...current,
                document9SafetyChecks: {
                  ...current.document9SafetyChecks,
                  tbm: current.document9SafetyChecks.tbm.map((item) =>
                    item.id === itemId ? { ...item, ...patch } : item
                  ),
                },
              }))
            )}
            {renderChecklistTable(
              '위험성평가 체크',
              session.document9SafetyChecks.riskAssessment,
              (itemId, patch) =>
                applyDocumentUpdate('doc9', 'manual', (current) => ({
                  ...current,
                  document9SafetyChecks: {
                    ...current.document9SafetyChecks,
                    riskAssessment: current.document9SafetyChecks.riskAssessment.map(
                      (item) => (item.id === itemId ? { ...item, ...patch } : item)
                    ),
                  },
                }))
            )}
            <section className={styles.readonlyLegalCard}>
              <h3 className={styles.matrixTitle}>법령 본문</h3>
              <div className={styles.legalTextList}>
                {legalReferenceLibrary.map((item) => (
                  <article key={item.id} className={styles.legalTextItem}>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        );

      case 'doc10':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.sectionToolbar}>
              <span className="app-chip">기본 3행</span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() =>
                  applyDocumentUpdate('doc10', 'manual', (current) => ({
                    ...current,
                    document10Measurements: [
                      ...current.document10Measurements,
                      createMeasurementCheckItem(),
                    ],
                  }))
                }
              >
                행 추가
              </button>
            </div>
            <div className={styles.tableCard}>
              <div className={styles.measurementHead}>
                <span>측정위치</span>
                <span>측정치</span>
                <span>안전기준</span>
                <span>조치여부</span>
                <span>작업</span>
              </div>
              {session.document10Measurements.map((item) => (
                <div key={item.id} className={styles.measurementRow}>
                  <input
                    type="text"
                    className="app-input"
                    value={item.measurementLocation}
                    onChange={(event) =>
                      applyDocumentUpdate('doc10', 'manual', (current) => ({
                        ...current,
                        document10Measurements: current.document10Measurements.map(
                          (measurement) =>
                            measurement.id === item.id
                              ? {
                                  ...measurement,
                                  measurementLocation: event.target.value,
                                }
                              : measurement
                        ),
                      }))
                    }
                  />
                  <input
                    type="text"
                    className="app-input"
                    value={item.measuredValue}
                    onChange={(event) =>
                      applyDocumentUpdate('doc10', 'manual', (current) => ({
                        ...current,
                        document10Measurements: current.document10Measurements.map(
                          (measurement) =>
                            measurement.id === item.id
                              ? { ...measurement, measuredValue: event.target.value }
                              : measurement
                        ),
                      }))
                    }
                  />
                  <textarea
                    className={`${styles.tableTextarea} app-textarea`}
                    value={item.safetyCriteria}
                    onChange={(event) =>
                      applyDocumentUpdate('doc10', 'manual', (current) => ({
                        ...current,
                        document10Measurements: current.document10Measurements.map(
                          (measurement) =>
                            measurement.id === item.id
                              ? { ...measurement, safetyCriteria: event.target.value }
                              : measurement
                        ),
                      }))
                    }
                  />
                  <input
                    type="text"
                    className="app-input"
                    value={item.actionTaken}
                    onChange={(event) =>
                      applyDocumentUpdate('doc10', 'manual', (current) => ({
                        ...current,
                        document10Measurements: current.document10Measurements.map(
                          (measurement) =>
                            measurement.id === item.id
                              ? { ...measurement, actionTaken: event.target.value }
                              : measurement
                        ),
                      }))
                    }
                  />
                  <div className={styles.rowActions}>
                    <span className="app-chip">{item.instrumentType}</span>
                    {session.document10Measurements.length > 3 ? (
                      <button
                        type="button"
                        className="app-button app-button-danger"
                        onClick={() =>
                          applyDocumentUpdate('doc10', 'manual', (current) => ({
                            ...current,
                            document10Measurements: current.document10Measurements.filter(
                              (measurement) => measurement.id !== item.id
                            ),
                          }))
                        }
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'doc11':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.sectionToolbar}>
              <span className="app-chip">기본 1건</span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() =>
                  applyDocumentUpdate('doc11', 'manual', (current) => ({
                    ...current,
                    document11EducationRecords: [
                      ...current.document11EducationRecords,
                      createSafetyEducationRecord(),
                    ],
                  }))
                }
              >
                교육 기록 추가
              </button>
            </div>
            {session.document11EducationRecords.map((item, index) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardEyebrow}>안전교육</div>
                    <h3 className={styles.cardTitle}>{`교육 ${index + 1}`}</h3>
                  </div>
                  {session.document11EducationRecords.length > 1 ? (
                    <button
                      type="button"
                      className="app-button app-button-danger"
                      onClick={() =>
                        applyDocumentUpdate('doc11', 'manual', (current) => ({
                          ...current,
                          document11EducationRecords:
                            current.document11EducationRecords.filter(
                              (record) => record.id !== item.id
                            ),
                        }))
                      }
                    >
                      삭제
                    </button>
                  ) : null}
                </div>

                <div className={styles.dualUploadGrid}>
                  <UploadBox
                    id={`education-photo-${item.id}`}
                    label="교육 사진"
                    value={item.photoUrl}
                    onClear={() =>
                      applyDocumentUpdate('doc11', 'manual', (current) => ({
                        ...current,
                        document11EducationRecords:
                          current.document11EducationRecords.map((record) =>
                            record.id === item.id ? { ...record, photoUrl: '' } : record
                          ),
                      }))
                    }
                    onSelect={async (file) =>
                      withFileData(file, (dataUrl) =>
                        applyDocumentUpdate('doc11', 'manual', (current) => ({
                          ...current,
                          document11EducationRecords:
                            current.document11EducationRecords.map((record) =>
                              record.id === item.id
                                ? { ...record, photoUrl: dataUrl }
                                : record
                            ),
                        }))
                      )
                    }
                  />
                  <UploadBox
                    id={`education-material-${item.id}`}
                    label="교육 자료"
                    value={item.materialUrl}
                    fileName={item.materialName}
                    mode="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                    onClear={() =>
                      applyDocumentUpdate('doc11', 'manual', (current) => ({
                        ...current,
                        document11EducationRecords:
                          current.document11EducationRecords.map((record) =>
                            record.id === item.id
                              ? { ...record, materialUrl: '', materialName: '' }
                              : record
                          ),
                      }))
                    }
                    onSelect={async (file) =>
                      withFileData(file, (dataUrl, selectedFile) =>
                        applyDocumentUpdate('doc11', 'manual', (current) => ({
                          ...current,
                          document11EducationRecords:
                            current.document11EducationRecords.map((record) =>
                              record.id === item.id
                                ? {
                                    ...record,
                                    materialUrl: dataUrl,
                                    materialName: selectedFile.name,
                                  }
                                : record
                            ),
                        }))
                      )
                    }
                  />
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>참석인원</span>
                    <input
                      type="text"
                      className="app-input"
                      value={item.attendeeCount}
                      onChange={(event) =>
                        applyDocumentUpdate('doc11', 'manual', (current) => ({
                          ...current,
                          document11EducationRecords:
                            current.document11EducationRecords.map((record) =>
                              record.id === item.id
                                ? { ...record, attendeeCount: event.target.value }
                                : record
                            ),
                        }))
                      }
                    />
                  </label>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span className={styles.fieldLabel}>교육내용</span>
                    <textarea
                      className="app-textarea"
                      value={item.content}
                      onChange={(event) =>
                        applyDocumentUpdate('doc11', 'manual', (current) => ({
                          ...current,
                          document11EducationRecords:
                            current.document11EducationRecords.map((record) =>
                              record.id === item.id
                                ? { ...record, content: event.target.value }
                                : record
                            ),
                        }))
                      }
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        );

      case 'doc12':
        return (
          <div className={styles.sectionStack}>
            <div className={styles.sectionToolbar}>
              <span className="app-chip">기본 1건</span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() =>
                  applyDocumentUpdate('doc12', 'manual', (current) => ({
                    ...current,
                    document12Activities: [
                      ...current.document12Activities,
                      createActivityRecord(),
                    ],
                  }))
                }
              >
                활동 추가
              </button>
            </div>
            {session.document12Activities.map((item, index) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardEyebrow}>활동 실적</div>
                    <h3 className={styles.cardTitle}>{`활동 ${index + 1}`}</h3>
                  </div>
                  {session.document12Activities.length > 1 ? (
                    <button
                      type="button"
                      className="app-button app-button-danger"
                      onClick={() =>
                        applyDocumentUpdate('doc12', 'manual', (current) => ({
                          ...current,
                          document12Activities: current.document12Activities.filter(
                            (activity) => activity.id !== item.id
                          ),
                        }))
                      }
                    >
                      삭제
                    </button>
                  ) : null}
                </div>

                <div className={styles.formGrid}>
                  <UploadBox
                    id={`activity-photo-${item.id}`}
                    label="활동 사진"
                    value={item.photoUrl}
                    onClear={() =>
                      applyDocumentUpdate('doc12', 'manual', (current) => ({
                        ...current,
                        document12Activities: current.document12Activities.map((activity) =>
                          activity.id === item.id ? { ...activity, photoUrl: '' } : activity
                        ),
                      }))
                    }
                    onSelect={async (file) =>
                      withFileData(file, (dataUrl) =>
                        applyDocumentUpdate('doc12', 'manual', (current) => ({
                          ...current,
                          document12Activities: current.document12Activities.map((activity) =>
                            activity.id === item.id
                              ? { ...activity, photoUrl: dataUrl }
                              : activity
                          ),
                        }))
                      )
                    }
                  />

                  <div className={styles.sectionStack}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>활동구분</span>
                      <select
                        className="app-select"
                        value={item.activityType}
                        onChange={(event) =>
                          applyDocumentUpdate('doc12', 'manual', (current) => ({
                            ...current,
                            document12Activities: current.document12Activities.map((activity) =>
                              activity.id === item.id
                                ? { ...activity, activityType: event.target.value }
                                : activity
                            ),
                          }))
                        }
                      >
                        <option value="">선택</option>
                        {ACTIVITY_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>활동내용</span>
                      <textarea
                        className="app-textarea"
                        value={item.content}
                        onChange={(event) =>
                          applyDocumentUpdate('doc12', 'manual', (current) => ({
                            ...current,
                            document12Activities: current.document12Activities.map((activity) =>
                              activity.id === item.id
                                ? { ...activity, content: event.target.value }
                                : activity
                            ),
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              </article>
            ))}
          </div>
        );

      case 'doc13': {
        const cards = [...session.document13Cases];
        while (cards.length < 4) {
          cards.push({
            id: `placeholder-${cards.length + 1}`,
            title: '자료 없음',
            summary: '표시할 사례 데이터가 아직 없습니다.',
            imageUrl: '',
          });
        }

        return (
          <div className={styles.caseGrid}>
            {cards.slice(0, 4).map((item) => (
              <article key={item.id} className={styles.caseCard}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className={styles.caseImage} />
                ) : (
                  <div className={styles.casePlaceholder}>자료 없음</div>
                )}
                <div className={styles.caseBody}>
                  <h3 className={styles.caseTitle}>{item.title}</h3>
                  <p className={styles.caseSummary}>{item.summary}</p>
                </div>
              </article>
            ))}
          </div>
        );
      }

      case 'doc14': {
        const info = session.document14SafetyInfos[0];
        return (
          <article className={styles.noticeCard}>
            {info?.imageUrl ? (
              <img src={info.imageUrl} alt={info.title} className={styles.noticeImage} />
            ) : null}
            <div className={styles.noticeBody}>
              <div className={styles.cardEyebrow}>안전 정보</div>
              <h3 className={styles.noticeTitle}>{info?.title || '안전 정보'}</h3>
              <p className={styles.noticeText}>
                {info?.body || '표시할 안전 정보가 아직 없습니다.'}
              </p>
            </div>
          </article>
        );
      }

      default:
        return <div className={styles.emptyInline}>이 문서 섹션은 이어서 연결 중입니다.</div>;
    }
  };

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={`app-shell ${styles.shell}`}>
            <div className={styles.statePanel}>
              <h1 className={styles.stateTitle}>보고서를 불러오는 중입니다.</h1>
              <p className={styles.stateDescription}>세션 데이터를 준비하고 있습니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="보고서 작성 로그인"
        description="작성 중인 보고서를 서버 자동저장 기준으로 복구하려면 로그인해 주세요."
      />
    );
  }

  if (!session || !progress || !currentSectionMeta) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={`app-shell ${styles.shell}`}>
            <div className={styles.statePanel}>
              <h1 className={styles.stateTitle}>보고서를 찾을 수 없습니다.</h1>
              <p className={styles.stateDescription}>
                삭제되었거나 아직 로드되지 않은 세션입니다.
              </p>
              <Link href="/" className="app-button app-button-primary">
                현장 목록으로 이동
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.header}>
            <div className={styles.headerMain}>
              <Link href={backHref} className={styles.backLink}>
                보고서 목록으로
              </Link>
              <div>
                <div className={styles.headerMeta}>
                  <span className="app-chip">HWPX 14문서</span>
                  <span className="app-chip">
                    {site ? getSiteDisplayTitle(site) : session.meta.siteName || '현장'}
                  </span>
                </div>
                <h1 className={styles.headerTitle}>{session.meta.siteName || '보고서'}</h1>
                <p className={styles.headerDescription}>{getSessionTitle(session)}</p>
              </div>
            </div>

            <div className={styles.headerSide}>
              <div className={styles.progressCard}>
                <div className={styles.progressMeta}>
                  <span className={styles.progressLabel}>문서 진행률</span>
                  <strong className={styles.progressValue}>
                    {progress.completed}/{progress.total} ({progress.percentage}%)
                  </strong>
                </div>
                <div className={styles.progressTrack} aria-hidden="true">
                  <span
                    className={styles.progressFill}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
              <div className={styles.headerActions}>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={() => void saveNow()}
                >
                  {isSaving ? '저장 중...' : '지금 저장'}
                </button>
              </div>
              {uploadError ? <p className={styles.headerError}>{uploadError}</p> : null}
              {syncError ? <p className={styles.headerError}>{syncError}</p> : null}
            </div>
          </header>

          <div className={styles.workspace}>
            <aside className={styles.sidebar}>
              <section className={styles.sidebarCard}>
                <h2 className={styles.sidebarTitle}>상단 요약</h2>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>현장</span>
                    <strong className={styles.summaryValue}>
                      {session.meta.siteName || '미입력'}
                    </strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>작성일</span>
                    <strong className={styles.summaryValue}>
                      {session.meta.reportDate || '미입력'}
                    </strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>작성자</span>
                    <strong className={styles.summaryValue}>
                      {session.meta.drafter || '미입력'}
                    </strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>마지막 저장</span>
                    <strong className={styles.summaryValue}>
                      {formatDateTime(session.lastSavedAt)}
                    </strong>
                  </div>
                </div>
              </section>

              <nav className={styles.sidebarCard}>
                <h2 className={styles.sidebarTitle}>문서 네비</h2>
                <div className={styles.navList}>
                  {INSPECTION_SECTIONS.map((section) => {
                    const isActive = section.key === currentSection;
                    const isCompleted = getSectionCompletion(session, section.key);
                    const meta = session.documentsMeta[section.key];

                    return (
                      <button
                        key={section.key}
                        type="button"
                        className={[
                          styles.navButton,
                          isActive ? styles.navButtonActive : '',
                          isCompleted ? styles.navButtonCompleted : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() =>
                          updateSession(sessionId, (current) => ({
                            ...current,
                            currentSection: section.key,
                          }))
                        }
                      >
                        <span className={styles.navIndex}>{section.compactLabel}</span>
                        <span className={styles.navText}>
                          <strong>{section.shortLabel}</strong>
                          <span>
                            {DOCUMENT_STATUS_LABELS[meta.status]} ·{' '}
                            {DOCUMENT_SOURCE_LABELS[meta.source]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </aside>

            <section className={styles.editor}>
              <div className={styles.metaBar}>
                <div className={styles.metaGrid}>
                  <label className={styles.metaField}>
                    <span className={styles.metaLabel}>현장명</span>
                    <input
                      type="text"
                      className="app-input"
                      value={session.meta.siteName}
                      onChange={(event) => handleMetaChange('siteName', event.target.value)}
                    />
                  </label>
                  <label className={styles.metaField}>
                    <span className={styles.metaLabel}>작성일</span>
                    <input
                      type="date"
                      className="app-input"
                      value={session.meta.reportDate}
                      onChange={(event) => handleMetaChange('reportDate', event.target.value)}
                    />
                  </label>
                  <label className={styles.metaField}>
                    <span className={styles.metaLabel}>담당</span>
                    <input
                      type="text"
                      className="app-input"
                      value={session.meta.drafter}
                      onChange={(event) => handleMetaChange('drafter', event.target.value)}
                    />
                  </label>
                  <label className={styles.metaField}>
                    <span className={styles.metaLabel}>검토</span>
                    <input
                      type="text"
                      className="app-input"
                      value={session.meta.reviewer}
                      onChange={(event) => handleMetaChange('reviewer', event.target.value)}
                    />
                  </label>
                  <label className={styles.metaField}>
                    <span className={styles.metaLabel}>승인</span>
                    <input
                      type="text"
                      className="app-input"
                      value={session.meta.approver}
                      onChange={(event) => handleMetaChange('approver', event.target.value)}
                    />
                  </label>
                </div>
                <div className={styles.metaStatus}>
                  <span className="app-chip">
                    {DOCUMENT_SOURCE_LABELS[currentSectionMeta.source]}
                  </span>
                  <span className="app-chip">
                    {DOCUMENT_STATUS_LABELS[currentSectionMeta.status]}
                  </span>
                </div>
              </div>

              <div className={styles.editorCard}>
                <div className={styles.editorHeader}>
                  <div>
                    <div className={styles.cardEyebrow}>우측 단일 편집영역</div>
                    <h2 className={styles.editorTitle}>
                      {
                        INSPECTION_SECTIONS.find((section) => section.key === currentSection)
                          ?.label
                      }
                    </h2>
                    <p className={styles.editorDescription}>
                      {SECTION_DESCRIPTIONS[currentSection]}
                    </p>
                  </div>
                </div>
                <div className={styles.editorBody}>{renderSectionBody()}</div>
              </div>
            </section>
          </div>

          <footer className={styles.bottomBar}>
            <div className={styles.bottomMeta}>
              자동 저장 기준으로 동작합니다. 마지막 저장 시각: {formatDateTime(session.lastSavedAt)}
              {isSaving ? ' · 서버 저장 중' : ''}
            </div>
            <div className={styles.bottomActions}>
              <button
                type="button"
                className="app-button app-button-secondary"
                disabled={currentSectionIndex <= 0}
                onClick={() => moveSection(-1)}
              >
                이전 문서
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void saveNow()}
              >
                {isSaving ? '저장 중' : '저장'}
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                disabled={currentSectionIndex >= INSPECTION_SECTIONS.length - 1}
                onClick={() => moveSection(1)}
              >
                다음 문서
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
