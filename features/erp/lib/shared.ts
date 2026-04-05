'use client';

import type {
  ErpDocumentKind,
  ErpDocumentPayloadMap,
  SafetyContentType,
  SafetyInspectionChecklistItem,
  SafetyReportStatus,
  SiteWorker,
  WorkerAckDocumentKind,
} from '@/types/backend';
export type WorkerAckDrilldownKind = WorkerAckDocumentKind;

export const ERP_DOCUMENT_KIND_OPTIONS: Array<{
  value: ErpDocumentKind;
  label: string;
  description: string;
  templateContentType: SafetyContentType;
}> = [
  {
    value: 'tbm',
    label: 'TBM',
    description: '당일 작업 주제와 위험요인, 대책, 참석 서명을 관리합니다.',
    templateContentType: 'tbm_template',
  },
  {
    value: 'hazard_notice',
    label: '위험 공지',
    description: '공지 본문, 대상 공종, 게시 기간을 관리합니다.',
    templateContentType: 'notice_template',
  },
  {
    value: 'safety_education',
    label: '안전 교육',
    description: '교육명, 자료 요약, 참석 서명을 기록합니다.',
    templateContentType: 'education_template',
  },
  {
    value: 'safety_work_log',
    label: '안전 작업일지',
    description: '인원, 주요 작업, 당일 이슈를 기록합니다.',
    templateContentType: 'notice_template',
  },
  {
    value: 'safety_inspection_log',
    label: '안전 점검일지',
    description: '점검 항목, 조치사항, 사진 메모를 기록합니다.',
    templateContentType: 'notice_template',
  },
  {
    value: 'patrol_inspection_log',
    label: '순찰 점검일지',
    description: '순찰 결과, 조치 내역, 사진 메모를 기록합니다.',
    templateContentType: 'notice_template',
  },
];

export const ERP_DOCUMENT_KIND_LABELS = Object.fromEntries(
  ERP_DOCUMENT_KIND_OPTIONS.map((item) => [item.value, item.label])
) as Record<ErpDocumentKind, string>;
export const WORKER_ACK_DRILLDOWN_LABELS: Record<WorkerAckDrilldownKind, string> = {
  hazard_notice: '오늘 공지',
  tbm: 'TBM',
  safety_education: '안전 교육',
};

export const ERP_REPORT_STATUS_LABELS: Record<SafetyReportStatus, string> = {
  draft: '임시저장',
  submitted: '최종확정',
  published: '배포완료',
  archived: '보관',
};

export function buildSiteDashboardHref(siteId: string): string {
  return `/sites/${encodeURIComponent(siteId)}`;
}

export function buildSiteWorkersHref(
  siteId: string,
  options?: {
    ackKind?: WorkerAckDrilldownKind | null;
    autoSelectPending?: boolean;
    pendingOnly?: boolean;
  }
): string {
  const href = `/sites/${encodeURIComponent(siteId)}/workers`;
  if (!options?.ackKind) {
    return href;
  }

  const params = new URLSearchParams();
  params.set('ack', options.ackKind);
  if (options.pendingOnly) {
    params.set('status', 'pending');
  }
  if (options.autoSelectPending) {
    params.set('select', 'pending');
  }
  return `${href}?${params.toString()}`;
}

export function buildSiteSafetyHref(siteId: string): string {
  return `/sites/${encodeURIComponent(siteId)}/safety`;
}

export function buildDocumentHref(documentId: string): string {
  return `/documents/${encodeURIComponent(documentId)}`;
}

export function buildMobileEntryHref(token: string): string {
  return `/m/${encodeURIComponent(token)}`;
}

export function getWorkerAckTimestamp(
  worker: Pick<
    SiteWorker,
    'latest_hazard_notice_ack_at' | 'latest_tbm_ack_at' | 'latest_education_ack_at'
  >,
  kind: WorkerAckDrilldownKind
): string | null {
  if (kind === 'hazard_notice') return worker.latest_hazard_notice_ack_at;
  if (kind === 'tbm') return worker.latest_tbm_ack_at;
  return worker.latest_education_ack_at;
}

export function isWorkerAckTarget(
  worker: Pick<SiteWorker, 'is_blocked' | 'ack_exemptions'>,
  kind: WorkerAckDrilldownKind
): boolean {
  if (worker.is_blocked) return false;
  return !(worker.ack_exemptions ?? []).includes(kind);
}

export function createEmptyInspectionChecklist(): SafetyInspectionChecklistItem[] {
  return [
    { item: '작업 구간 정리정돈', status: 'warning', note: '' },
    { item: '추락 / 낙하 위험 구간 확인', status: 'warning', note: '' },
    { item: '보호구 착용 상태 확인', status: 'warning', note: '' },
  ];
}

export function createDefaultErpPayload(
  kind: ErpDocumentKind
): ErpDocumentPayloadMap[ErpDocumentKind] {
  switch (kind) {
    case 'tbm':
      return {
        topic: '',
        riskFactors: [],
        countermeasures: [],
        signatures: [],
      };
    case 'hazard_notice':
      return {
        title: '',
        content: '',
        targetTrades: [],
        effectiveFrom: null,
        effectiveTo: null,
        noticeItems: [],
      };
    case 'safety_education':
      return {
        educationName: '',
        materialSummary: '',
        agenda: [],
        signatures: [],
      };
    case 'safety_work_log':
      return {
        workerCount: null,
        mainTasks: [],
        issues: [],
        photos: [],
      };
    case 'safety_inspection_log':
    case 'patrol_inspection_log':
      return {
        checklist: createEmptyInspectionChecklist(),
        actions: [],
        photos: [],
      };
    default: {
      const exhaustiveCheck: never = kind;
      throw new Error(`지원하지 않는 문서 종류입니다: ${String(exhaustiveCheck)}`);
    }
  }
}

export function toLineItems(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function fromLineItems(items: string[] | null | undefined): string {
  return (items ?? []).join('\n');
}

export function formatErpDate(value: string | null | undefined): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ko-KR');
}

export function formatErpDateTime(value: string | null | undefined): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDocumentKindMeta(kind: ErpDocumentKind) {
  return ERP_DOCUMENT_KIND_OPTIONS.find((item) => item.value === kind) ?? ERP_DOCUMENT_KIND_OPTIONS[0];
}

export function getTemplateTypesForDocuments(): SafetyContentType[] {
  return ['tbm_template', 'notice_template', 'education_template', 'ppe_catalog', 'worker_trade'];
}
