'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import SignaturePad from '@/components/ui/SignaturePad';
import { Doc3SceneSection } from '@/components/session/workspace/Doc3SceneSection';
import { DEFAULT_CONSTRUCTION_TYPE } from '@/constants/inspectionSession/catalog';
import {
  ACCIDENT_OCCURRENCE_OPTIONS,
  NOTIFICATION_METHOD_OPTIONS,
  PREVIOUS_IMPLEMENTATION_OPTIONS,
  WORK_PLAN_ITEMS,
  WORK_PLAN_STATUS_OPTIONS,
  WORK_PLAN_STATUS_OPTIONS_COMPACT,
} from '@/components/session/workspace/constants';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { InfoTable } from '@/components/session/workspace/widgets';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { InspectionSectionKey, WorkPlanCheckKey, WorkPlanCheckStatus } from '@/types/inspectionSession';

export function renderDoc1(session: OverviewSectionProps['session']) {
  const snapshot = session.adminSiteSnapshot;
  return (
    <div className={styles.sectionStack}>
      <div className={styles.infoTableGrid}>
        <InfoTable
          title="현장 정보"
          rows={[
            { label: '현장명', value: snapshot.siteName },
            { label: '사업장관리번호(사업개시번호)', value: snapshot.siteManagementNumber || snapshot.businessStartNumber },
            { label: '공사기간', value: snapshot.constructionPeriod },
            { label: '공사금액', value: snapshot.constructionAmount },
            { label: '책임자', value: snapshot.siteManagerName },
            { label: '연락처(이메일)', value: snapshot.siteContactEmail },
            { label: '현장주소', value: snapshot.siteAddress },
          ]}
        />
        <InfoTable
          title="본사 정보"
          rows={[
            { label: '회사명', value: snapshot.companyName || snapshot.customerName },
            { label: '법인등록번호(사업자등록번호)', value: snapshot.corporationRegistrationNumber || snapshot.businessRegistrationNumber },
            { label: '면허번호', value: snapshot.licenseNumber },
            { label: '연락처', value: snapshot.headquartersContact },
            { label: '본사주소', value: snapshot.headquartersAddress },
          ]}
        />
      </div>
    </div>
  );
}

function updateOverviewField(
  props: OverviewSectionProps,
  key: keyof OverviewSectionProps['session']['document2Overview'],
  value: string,
  source: 'manual' | 'derived' = 'manual'
) {
  props.applyDocumentUpdate('doc2', source, (current) => ({
    ...current,
    document2Overview: { ...current.document2Overview, [key]: value },
  }));
}

const WORK_PLAN_STATUS_FULL_LABEL: Record<WorkPlanCheckStatus, string> = {
  written: '작성',
  not_written: '미작성',
  not_applicable: '해당없음',
};

function daysInMonth(year: number, month1Based: number): number {
  return new Date(year, month1Based, 0).getDate();
}

function parseIsoDate(s: string): { y: number; m: number; d: number } | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [ys, ms, ds] = s.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return { y, m, d };
}

function toIsoDate(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatAccidentDateButton(iso: string): string {
  const p = parseIsoDate(iso);
  if (!p) return '날짜 선택';
  return `${p.y}년 ${p.m}월 ${p.d}일`;
}

function Doc2AccidentDatePicker({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [y, setY] = useState(() => new Date().getFullYear());
  const [m, setM] = useState(() => new Date().getMonth() + 1);
  const [d, setD] = useState(() => new Date().getDate());

  const yearRange = useMemo(() => {
    const end = new Date().getFullYear() + 1;
    const start = 1990;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, []);

  useEffect(() => {
    const max = daysInMonth(y, m);
    setD((prev) => Math.min(prev, max));
  }, [y, m]);

  const maxDay = daysInMonth(y, m);
  const dayOptions = useMemo(() => Array.from({ length: maxDay }, (_, index) => index + 1), [maxDay]);

  const openDialog = () => {
    const parsed = parseIsoDate(value);
    const now = new Date();
    const base = parsed ?? { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
    setY(base.y);
    setM(base.m);
    setD(Math.min(base.d, daysInMonth(base.y, base.m)));
    dialogRef.current?.showModal();
  };

  return (
    <>
      <button type="button" className="app-input text-left" disabled={disabled} onClick={openDialog}>
        {formatAccidentDateButton(value)}
      </button>
      <dialog ref={dialogRef} className={styles.doc2DateDialog} aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.doc2DateDialogTitle}>
          최근 발생일자
        </h2>
        <div className={styles.doc2DateDialogPickers}>
          <label className={styles.doc2DateDialogField}>
            <span className={styles.fieldLabel}>년</span>
            <select className="app-select" value={y} onChange={(event) => setY(Number(event.target.value))}>
              {yearRange.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </label>
          <label className={styles.doc2DateDialogField}>
            <span className={styles.fieldLabel}>월</span>
            <select className="app-select" value={m} onChange={(event) => setM(Number(event.target.value))}>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </select>
          </label>
          <label className={styles.doc2DateDialogField}>
            <span className={styles.fieldLabel}>일</span>
            <select className="app-select" value={d} onChange={(event) => setD(Number(event.target.value))}>
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}일
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.doc2DateDialogActions}>
          <button type="button" className="app-button app-button-secondary" onClick={() => dialogRef.current?.close()}>
            취소
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => {
              onChange(toIsoDate(y, m, d));
              dialogRef.current?.close();
            }}
          >
            확인
          </button>
        </div>
      </dialog>
    </>
  );
}

function Doc2WorkPlanTable({
  session,
  workPlanPairRows,
  updateWorkPlanCheck,
}: {
  session: OverviewSectionProps['session'];
  workPlanPairRows: Array<{
    left: (typeof WORK_PLAN_ITEMS)[number];
    right: (typeof WORK_PLAN_ITEMS)[number];
  }>;
  updateWorkPlanCheck: (key: WorkPlanCheckKey, value: string) => void;
}) {
  const [compactLabels, setCompactLabels] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompactLabels(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const statusOptions = compactLabels ? WORK_PLAN_STATUS_OPTIONS_COMPACT : WORK_PLAN_STATUS_OPTIONS;

  return (
    <div className={styles.workPlanSection}>
      <table className={styles.workPlanTable}>
        <caption className={styles.workPlanCaption}>작업계획서 12종 상태</caption>
        <colgroup>
          <col className={styles.workPlanColTitle} />
          <col className={styles.workPlanColNarrow} />
          <col className={styles.workPlanColTitle} />
          <col className={styles.workPlanColNarrow} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={styles.workPlanThTitle}>
              작업명
            </th>
            <th scope="col" className={styles.workPlanThNarrow}>
              여부
            </th>
            <th scope="col" className={styles.workPlanThTitle}>
              작업명
            </th>
            <th scope="col" className={styles.workPlanThNarrow}>
              여부
            </th>
          </tr>
        </thead>
        <tbody>
          {workPlanPairRows.map(({ left, right }, rowIndex) => (
            <tr key={rowIndex}>
              <td className={styles.workPlanTdLabel}>{left.label}</td>
              <td className={styles.workPlanTdSelect}>
                <select
                  className="app-select"
                  value={session.document2Overview.workPlanChecks[left.key]}
                  onChange={(event) => updateWorkPlanCheck(left.key, event.target.value)}
                  aria-label={`${left.label} 여부`}
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      title={compactLabels ? WORK_PLAN_STATUS_FULL_LABEL[option.value] : undefined}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className={styles.workPlanTdLabel}>{right.label}</td>
              <td className={styles.workPlanTdSelect}>
                <select
                  className="app-select"
                  value={session.document2Overview.workPlanChecks[right.key]}
                  onChange={(event) => updateWorkPlanCheck(right.key, event.target.value)}
                  aria-label={`${right.label} 여부`}
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      title={compactLabels ? WORK_PLAN_STATUS_FULL_LABEL[option.value] : undefined}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function renderDoc2(props: OverviewSectionProps) {
  const { applyDocumentUpdate, session } = props;
  const updateWorkPlanCheck = (key: WorkPlanCheckKey, value: string) =>
    applyDocumentUpdate('doc2', 'manual', (current) => ({
      ...current,
      document2Overview: {
        ...current.document2Overview,
        workPlanChecks: {
          ...current.document2Overview.workPlanChecks,
          [key]: value as (typeof current.document2Overview.workPlanChecks)[WorkPlanCheckKey],
        },
      },
    }));
  const constructionDisplay =
    session.document2Overview.constructionType?.trim() || DEFAULT_CONSTRUCTION_TYPE;

  /** 2개씩 한 행 → 6행 (12종) */
  const workPlanPairRows = Array.from({ length: 6 }, (_, rowIndex) => ({
    left: WORK_PLAN_ITEMS[rowIndex * 2]!,
    right: WORK_PLAN_ITEMS[rowIndex * 2 + 1]!,
  }));

  return (
    <div className={styles.sectionStack}>
      <div className={styles.doc2OverviewForm}>
        <div className={`${styles.doc2OverviewRow} ${styles.doc2OverviewRowDates}`}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>실시일</span>
            <input
              type="date"
              className="app-input"
              value={session.document2Overview.guidanceDate}
              onChange={(event) => updateOverviewField(props, 'guidanceDate', event.target.value)}
            />
          </label>
          <div className={styles.doc2OverviewDatesRight}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>공정률</span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.progressRate}
                placeholder="예: 45%"
                onChange={(event) => updateOverviewField(props, 'progressRate', event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>회차</span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.visitCount}
                onChange={(event) => updateOverviewField(props, 'visitCount', event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>총회차</span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.totalVisitCount}
                onChange={(event) => updateOverviewField(props, 'totalVisitCount', event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className={`${styles.doc2OverviewRow} ${styles.doc2OverviewRowFollow}`}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>이전기술지도 이행여부</span>
            <select
              className="app-select"
              value={session.document2Overview.previousImplementationStatus}
              onChange={(event) => updateOverviewField(props, 'previousImplementationStatus', event.target.value)}
            >
              {PREVIOUS_IMPLEMENTATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>담당요원</span>
            <input
              type="text"
              className="app-input"
              value={session.document2Overview.assignee}
              onChange={(event) => updateOverviewField(props, 'assignee', event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>연락처</span>
            <input
              type="text"
              className="app-input"
              value={session.document2Overview.contact}
              onChange={(event) => updateOverviewField(props, 'contact', event.target.value)}
            />
          </label>
        </div>

        <div className={`${styles.doc2OverviewRow} ${styles.doc2OverviewRowNotify}`}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>공사구분</span>
            <input type="text" className="app-input" value={constructionDisplay} readOnly />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>현장 책임자 통보방법</span>
            <select
              className="app-select"
              value={session.document2Overview.notificationMethod}
              onChange={(event) => updateOverviewField(props, 'notificationMethod', event.target.value)}
            >
              <option value="">선택</option>
              {NOTIFICATION_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {session.document2Overview.notificationMethod === 'direct' ? (
          <div className={styles.doc2OverviewSignatureWrap}>
            <SignaturePad
              label="직접전달 서명"
              value={session.document2Overview.notificationRecipientSignature}
              onChange={(nextValue) => updateOverviewField(props, 'notificationRecipientSignature', nextValue)}
            />
          </div>
        ) : null}

        {session.document2Overview.notificationMethod === 'other' ? (
          <label className={`${styles.field} ${styles.doc2OverviewOtherField}`}>
            <span className={styles.fieldLabel}>기타 통보방법</span>
            <input
              type="text"
              className="app-input"
              value={session.document2Overview.otherNotificationMethod}
              onChange={(event) => updateOverviewField(props, 'otherNotificationMethod', event.target.value)}
            />
          </label>
        ) : null}
      </div>

      <Doc2WorkPlanTable
        session={session}
        workPlanPairRows={workPlanPairRows}
        updateWorkPlanCheck={updateWorkPlanCheck}
      />

      <div className={styles.formGrid}>
        <div className={styles.doc2AccidentRowThree}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>산업재해 발생유무</span>
            <select
              className="app-select"
              value={session.document2Overview.accidentOccurred === 'yes' ? 'yes' : 'no'}
              onChange={(event) => updateOverviewField(props, 'accidentOccurred', event.target.value)}
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
            <Doc2AccidentDatePicker
              value={session.document2Overview.recentAccidentDate}
              disabled={session.document2Overview.accidentOccurred !== 'yes'}
              onChange={(next) => updateOverviewField(props, 'recentAccidentDate', next)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>재해형태</span>
            <input
              type="text"
              className="app-input"
              disabled={session.document2Overview.accidentOccurred !== 'yes'}
              value={session.document2Overview.accidentType}
              onChange={(event) => updateOverviewField(props, 'accidentType', event.target.value)}
              placeholder="예: 추락"
            />
          </label>
        </div>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>재해개요</span>
          <input
            type="text"
            className="app-input"
            disabled={session.document2Overview.accidentOccurred !== 'yes'}
            value={session.document2Overview.accidentSummary}
            onChange={(event) => updateOverviewField(props, 'accidentSummary', event.target.value)}
            placeholder="재해 개요 입력"
          />
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>진행공정 및 특이사항</span>
          <textarea className="app-textarea" value={session.document2Overview.processAndNotes} onChange={(event) => updateOverviewField(props, 'processAndNotes', event.target.value)} />
        </label>
      </div>
    </div>
  );
}

export function renderDoc3(props: OverviewSectionProps) {
  return <Doc3SceneSection {...props} />;
}

export function renderOverviewSection(section: InspectionSectionKey, props: OverviewSectionProps) {
  if (section === 'doc1') return renderDoc1(props.session);
  if (section === 'doc2') return renderDoc2(props);
  if (section === 'doc3') return renderDoc3(props);
  return null;
}
