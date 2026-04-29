import type { ReportPayload } from '@saftysite/contracts';
import { buildDemoReport } from '@/lib/demoReport';

export type DemoReportStatus =
  | 'guided_upload'
  | 'ai_generating'
  | 'draft_ready'
  | 'review_pending'
  | 'exported';

export interface DemoReportListItem {
  id: string;
  reportTitle: string;
  siteName: string;
  customerName: string;
  visitDate: string;
  visitRound: number;
  reportStatus: DemoReportStatus;
  exportStatus: '미출력' | 'PDF 출력' | 'PDF/HWPX 출력';
  lastEditedAt: string;
  draftFindingCount: number;
  reviewPendingCount: number;
}

export interface ReviewQueueGroup {
  key: string;
  title: string;
  tone: 'critical' | 'warning' | 'neutral';
  items: Array<{
    fieldPath: string;
    label: string;
    detail: string;
  }>;
}

export type ReportWorkspaceSectionId =
  | 'section1'
  | 'section2'
  | 'section3'
  | 'section4'
  | 'section5'
  | 'section6';

export interface ReportWorkspaceSectionMeta {
  id: ReportWorkspaceSectionId;
  label: string;
  shortLabel: string;
  compactLabel: string;
  docKeys: string[];
}

export type GuidedUploadStepId = 'meta' | 'overview' | 'hazard' | 'generate';

export interface GuidedUploadField {
  id: string;
  label: string;
  value: string;
  required?: boolean;
}

export interface GuidedUploadSlot {
  id: string;
  label: string;
  helper: string;
  previewUrl: string;
  previewAlt: string;
  required?: boolean;
}

function buildDemoPreview(title: string, accent: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f6f8fb" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="url(#g)" />
      <rect x="34" y="34" width="572" height="352" rx="22" fill="rgba(255,255,255,0.64)" stroke="rgba(33,55,74,0.12)" />
      <text x="50%" y="47%" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" fill="#21374a" font-weight="700">${title}</text>
      <text x="50%" y="58%" text-anchor="middle" font-size="15" font-family="Arial, sans-serif" fill="#5f6e7c">ERP형 이미지 첨부 미리보기</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const saasNavItems = [
  { href: '/reports', label: '보고서' },
  { href: '/account', label: '설정' },
] as const;

export const creationDialogFields = [
  { id: 'siteName', label: '현장명', value: '세종 복합물류센터 신축현장', required: true },
  { id: 'customerName', label: '고객사/기관명', value: '대한건설 주식회사', required: true },
  { id: 'visitDate', label: '지도일', value: '2026-04-29', required: true },
  { id: 'drafterName', label: '작성자', value: '홍길동 지도사', required: true },
  { id: 'processSummary', label: '공정률 또는 현재 공정', value: '67% / 철골 조립 및 외장 패널 취부', required: true },
  { id: 'workerCount', label: '출역인원', value: '24명', required: true },
] as const;

export const guidedUploadSteps: Array<{
  id: GuidedUploadStepId;
  shortLabel: string;
  label: string;
  helper: string;
}> = [
  {
    id: 'meta',
    shortLabel: 'Step 1',
    label: '기본정보',
    helper: '필수값 확인',
  },
  {
    id: 'overview',
    shortLabel: 'Step 2',
    label: '공정 및 전경 이미지',
    helper: '전경 · 공정',
  },
  {
    id: 'hazard',
    shortLabel: 'Step 3',
    label: '위험 및 기인물 이미지',
    helper: '위험 · 기인물',
  },
  {
    id: 'generate',
    shortLabel: 'Final',
    label: '초안 생성',
    helper: '검토 화면 이동',
  },
];

export const guidedUploadStep2Slots: GuidedUploadSlot[] = [
  {
    id: 'overview-hero',
    label: '대표 전경',
    helper: '전경',
    previewUrl: buildDemoPreview('대표 전경', '#d7e4ef'),
    previewAlt: '대표 전경 데모 이미지',
  },
  {
    id: 'overview-process-1',
    label: '공정 사진 1',
    helper: '주요 공정',
    previewUrl: buildDemoPreview('공정 사진 1', '#d8ecdf'),
    previewAlt: '공정 사진 1 데모 이미지',
  },
  {
    id: 'overview-process-2',
    label: '공정 사진 2',
    helper: '추가 공정',
    previewUrl: buildDemoPreview('공정 사진 2', '#e8e0cf'),
    previewAlt: '공정 사진 2 데모 이미지',
  },
];

export const guidedUploadStep3Slots: GuidedUploadSlot[] = [
  {
    id: 'hazard-risk',
    label: '위험요인 사진',
    helper: '위험요인',
    previewUrl: buildDemoPreview('위험요인 사진', '#f0d9d5'),
    previewAlt: '위험요인 사진 데모 이미지',
  },
  {
    id: 'hazard-causative',
    label: '기인물 사진',
    helper: '기인물',
    previewUrl: buildDemoPreview('기인물 사진', '#f3e5c8'),
    previewAlt: '기인물 사진 데모 이미지',
  },
  {
    id: 'hazard-closeup',
    label: '근거리 보강 사진',
    helper: '근거리',
    previewUrl: buildDemoPreview('근거리 보강 사진', '#e6ddee'),
    previewAlt: '근거리 보강 사진 데모 이미지',
  },
];

export const reportWorkspaceSections: ReportWorkspaceSectionMeta[] = [
  {
    id: 'section1',
    label: '1. 기술지도 대상사업장',
    shortLabel: '대상사업장',
    compactLabel: '1',
    docKeys: ['doc1'],
  },
  {
    id: 'section2',
    label: '2. 기술지도 개요',
    shortLabel: '기술지도 개요',
    compactLabel: '2',
    docKeys: ['doc2'],
  },
  {
    id: 'section3',
    label: '3. 이전 기술지도 사항 이행여부',
    shortLabel: '이행여부',
    compactLabel: '3',
    docKeys: ['doc3'],
  },
  {
    id: 'section4',
    label: '4. 현재 공정 내 현존하는 위험성 제거',
    shortLabel: '현재 위험성 제거',
    compactLabel: '4',
    docKeys: ['doc4'],
  },
  {
    id: 'section5',
    label: '5. 향후 진행공정에 대한 유해·위험 요인 파악 및 대책',
    shortLabel: '향후 진행공정',
    compactLabel: '5',
    docKeys: ['doc5'],
  },
  {
    id: 'section6',
    label: '6. 사업장 지원 사항 등 기타 사항',
    shortLabel: '지원 사항 / 기타',
    compactLabel: '6',
    docKeys: ['doc6'],
  },
] as const;

export function resolveReportWorkspaceSectionId(sectionKey: string): ReportWorkspaceSectionId {
  if (sectionKey === 'photo-step-1') return 'section3';
  if (sectionKey === 'photo-step-2') return 'section4';
  if (sectionKey === 'review' || sectionKey === 'photo-review' || sectionKey === 'ai-generating') {
    return 'section4';
  }
  if (sectionKey === 'doc1') return 'section1';
  if (sectionKey === 'doc2') return 'section2';
  if (sectionKey === 'doc3' || sectionKey === 'doc4') return 'section3';
  if (sectionKey === 'doc5' || sectionKey === 'doc7') return 'section4';
  if (sectionKey === 'doc8') return 'section5';
  if (
    sectionKey === 'doc6' ||
    sectionKey === 'doc9' ||
    sectionKey === 'doc10' ||
    sectionKey === 'doc11' ||
    sectionKey === 'doc12' ||
    sectionKey === 'doc13' ||
    sectionKey === 'doc14'
  ) {
    return 'section6';
  }

  return 'section4';
}

export function buildDemoReportsList(): DemoReportListItem[] {
  return [
    {
      id: 'demo-review',
      reportTitle: '2026-04-29 기술지도 보고서 7차',
      siteName: '세종 복합물류센터 신축현장',
      customerName: '대한건설 주식회사',
      visitDate: '2026-04-29',
      visitRound: 7,
      reportStatus: 'review_pending',
      exportStatus: '미출력',
      lastEditedAt: '2026-04-29 08:15',
      draftFindingCount: 2,
      reviewPendingCount: 3,
    },
    {
      id: 'report-2026-05-02',
      reportTitle: '2026-05-02 기술지도 보고서 8차',
      siteName: '세종 복합물류센터 신축현장',
      customerName: '대한건설 주식회사',
      visitDate: '2026-05-02',
      visitRound: 8,
      reportStatus: 'guided_upload',
      exportStatus: '미출력',
      lastEditedAt: '2026-04-29 09:20',
      draftFindingCount: 0,
      reviewPendingCount: 0,
    },
    {
      id: 'report-2026-04-15',
      reportTitle: '2026-04-15 기술지도 보고서 6차',
      siteName: '세종 복합물류센터 신축현장',
      customerName: '대한건설 주식회사',
      visitDate: '2026-04-15',
      visitRound: 6,
      reportStatus: 'exported',
      exportStatus: 'PDF/HWPX 출력',
      lastEditedAt: '2026-04-15 17:42',
      draftFindingCount: 4,
      reviewPendingCount: 0,
    },
    {
      id: 'report-2026-04-08',
      reportTitle: '2026-04-08 기술지도 보고서 5차',
      siteName: '세종 복합물류센터 신축현장',
      customerName: '대한건설 주식회사',
      visitDate: '2026-04-08',
      visitRound: 5,
      reportStatus: 'ai_generating',
      exportStatus: 'PDF 출력',
      lastEditedAt: '2026-04-08 16:10',
      draftFindingCount: 3,
      reviewPendingCount: 1,
    },
  ];
}

export function buildDashboardMetrics() {
  return [
    { label: '남은 크레딧', value: '2건', meta: '무료 체험 잔여' },
    { label: '진행 중 Step', value: 'Step 2', meta: '표준보고서 보조 사진 수집' },
    { label: '최근 출력', value: '2026-04-15', meta: 'PDF/HWPX 완료' },
    { label: '현장 상태', value: '1개 현장', meta: '세종 복합물류센터' },
  ];
}

export function buildReportSummaryCards() {
  return [
    { label: '현장명', value: '세종 복합물류센터 신축현장' },
    { label: '최근 작성일', value: '2026-04-29' },
    { label: '미검토 초안', value: '1건' },
    { label: '남은 크레딧', value: '무료 2건' },
    { label: '최근 상태', value: '표준 1~6 검토 대기' },
  ];
}

export function getStatusLabel(status: DemoReportStatus) {
  switch (status) {
    case 'guided_upload':
      return '사진 수집중';
    case 'ai_generating':
      return '생성중';
    case 'draft_ready':
      return '초안 준비';
    case 'review_pending':
      return '검토 필요';
    case 'exported':
      return '출력 완료';
    default:
      return '진행중';
  }
}

export function getStatusTone(status: DemoReportStatus) {
  switch (status) {
    case 'review_pending':
      return 'warning';
    case 'guided_upload':
      return 'neutral';
    case 'ai_generating':
      return 'info';
    case 'draft_ready':
      return 'info';
    case 'exported':
      return 'success';
    default:
      return 'neutral';
  }
}

export function buildReviewQueueGroups(report: ReportPayload): ReviewQueueGroup[] {
  return [
    {
      key: 'required-meta',
      title: '필수 행정값',
      tone: 'critical',
      items: [
        {
          fieldPath: 'reportMeta.siteAddress',
          label: '현장 주소',
          detail: '출력 차단 항목입니다. 현장 주소를 입력해야 합니다.',
        },
        {
          fieldPath: 'reportMeta.siteContact',
          label: '담당자 연락처',
          detail: '표준보고서 기본 정보 영역에 필요합니다.',
        },
      ],
    },
    {
      key: 'low-confidence',
      title: '검토 항목',
      tone: 'warning',
      items: report.reviewMeta.reviewQueue.map((item) => ({
        fieldPath: item.fieldPath,
        label: item.label,
        detail: item.notes,
      })),
    },
    {
      key: 'export-blockers',
      title: '출력 차단 항목',
      tone: 'neutral',
      items: report.validationResult.blockingIssues.map((message, index) => ({
        fieldPath: `blocker-${index}`,
        label: `차단 사유 ${index + 1}`,
        detail: message,
      })),
    },
  ];
}

export function buildDemoWorkspaceReport(reportId: string): ReportPayload {
  if (reportId === 'demo-review') {
    return buildDemoReport(reportId);
  }

  const report = buildDemoReport(reportId);
  const listItem = buildDemoReportsList().find((item) => item.id === reportId);
  if (!listItem) {
    return report;
  }

  report.reportMeta.visitDate = listItem.visitDate;
  report.reportMeta.siteName = listItem.siteName;
  report.reportMeta.customerName = listItem.customerName;
  report.status = listItem.reportStatus === 'exported' ? 'exported' : 'draft_ready';
  report.reviewMeta.reviewCompleted = listItem.reportStatus === 'exported';
  report.reviewMeta.responsibilityConfirmed = listItem.reportStatus === 'exported';
  report.validationResult.blockingIssues =
    listItem.reportStatus === 'exported' ? [] : report.validationResult.blockingIssues;
  report.updatedAt = `${listItem.visitDate}T09:00:00.000Z`;
  return report;
}
