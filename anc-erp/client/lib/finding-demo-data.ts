import type {
  ActionRequestMailDraft,
  CorrectiveAction,
  EvidencePhoto,
  Finding,
  FindingDetailResponse,
  FindingListItem,
  FindingTimelineEvent,
  PhotoLedger,
  PhotoLedgerDetailResponse,
  PhotoLedgerEntry,
  PhotoLedgerWarning,
} from "../../packages/contracts/src";

export const sampleFindings: Finding[] = [
  {
    id: "finding-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    title: "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비",
    detail: "이동식 사다리 전도 방지를 위한 아웃트리거 설치 상태가 확인되지 않았습니다.",
    riskType: "fall",
    requiredAction: "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치",
    responsiblePartyId: "project-party-contractor-001",
    dueDate: "2026-05-11",
    status: "verified",
    sourceType: "manual",
    sourceId: "manual-source-001",
    reportInclude: true,
    reportOrder: 1,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "finding-sample-002",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    title: "가설분전함 정·부 책임자 지정 미비",
    detail: "가설분전함 정·부 책임자 표기가 누락되어 전기안전 관리주체가 불명확합니다.",
    riskType: "electric",
    requiredAction: "가설분전함 정·부 책임자 지정 및 지정관리자가 지속적 관리",
    responsiblePartyId: "project-party-contractor-001",
    dueDate: "2026-05-12",
    status: "action_requested",
    sourceType: "manual",
    sourceId: "manual-source-002",
    reportInclude: true,
    reportOrder: 2,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "finding-sample-003",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-life-foundation",
    title: "방우형 콘센트 덮개 파손으로 인해 감전사고 우려",
    detail: "외부 사용 콘센트의 방우 덮개가 파손되어 감전 우려가 있습니다.",
    riskType: "electric",
    requiredAction: "파손된 방우형 콘센트 교체하여 사용",
    dueDate: "2026-05-13",
    status: "action_requested",
    sourceType: "manual",
    sourceId: "manual-source-003",
    reportInclude: true,
    reportOrder: 3,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "finding-sample-004",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-life-foundation",
    title: "가설분전함의 전선배선 피복 노출부 임시 보완처리 미비",
    detail: "가설분전함 배선 피복 노출부의 절연 보완이 확인되지 않았습니다.",
    riskType: "electric",
    requiredAction: "가설분전함의 전선배선 피복 노출부 전기용 절연테이프로 보완조치",
    dueDate: "2026-05-14",
    status: "open",
    sourceType: "manual",
    sourceId: "manual-source-004",
    reportInclude: false,
    reportOrder: 4,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "finding-sample-005",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-life-foundation",
    title: "케이블 릴 전선 풀림상태 안전조치 미비",
    detail: "케이블 릴 전선이 과도하게 풀려 넘어짐 및 접촉 위험이 있습니다.",
    riskType: "other",
    requiredAction: "케이블 릴 전선 2줄 이상 감김 상태 유지 확인",
    dueDate: "2026-05-15",
    status: "action_requested",
    sourceType: "manual",
    sourceId: "manual-source-005",
    reportInclude: true,
    reportOrder: 5,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
];

export const sampleCorrectiveActions: CorrectiveAction[] = [
  {
    id: "action-sample-001",
    findingId: "finding-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    actionDetail: "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치",
    actionDate: "2026-05-11",
    actionOrganizationId: "org-contractor-001",
    submittedBy: "contact-contractor-001",
    submittedAt: "2026-05-10T09:00:00+09:00",
    verifiedBy: "user-engineer-001",
    verifiedAt: "2026-05-12T10:00:00+09:00",
    verificationComment: "현장 재확인 완료",
    status: "verified",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "action-sample-002",
    findingId: "finding-sample-002",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    actionDetail: "가설분전함 정·부 책임자 지정 및 표지 부착",
    actionDate: "2026-05-12",
    actionOrganizationId: "org-contractor-001",
    submittedBy: "contact-contractor-001",
    submittedAt: "2026-05-10T09:00:00+09:00",
    status: "submitted",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "action-sample-003",
    findingId: "finding-sample-003",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    actionDetail: "파손된 방우형 콘센트 교체",
    actionDate: "2026-05-13",
    actionOrganizationId: "org-contractor-001",
    submittedBy: "contact-contractor-001",
    submittedAt: "2026-05-10T09:00:00+09:00",
    status: "submitted",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "action-sample-005",
    findingId: "finding-sample-005",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    actionDetail: "케이블 릴 전선 2줄 이상 감김 상태 유지 조치",
    status: "draft",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
];

export const sampleEvidencePhotos: EvidencePhoto[] = [
  {
    id: "photo-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    findingId: "finding-sample-001",
    fileId: "file-asset-photo-sample-001",
    photoType: "finding_photo",
    fileName: "ladder_before.jpg",
    storagePath: "/리움미술관 승강기 교체공사/02_지적사항/ladder_before.jpg",
    caption: "아웃트리거 미설치 상태",
    representative: true,
    reportInclude: true,
    markupInfo: {
      id: "photo-markup-sample-001",
      photoId: "photo-sample-001",
      shapes: [
        {
          id: "photo-markup-shape-sample-001",
          shapeType: "ellipse",
          x: 0.34,
          y: 0.42,
          width: 0.24,
          height: 0.16,
          color: "#FFD84D",
          strokeStyle: "dashed",
        },
      ],
      createdAt: "2026-05-10T09:00:00+09:00",
      updatedAt: "2026-05-10T09:00:00+09:00",
    },
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "photo-sample-002",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    findingId: "finding-sample-001",
    correctiveActionId: "action-sample-001",
    fileId: "file-asset-photo-sample-002",
    photoType: "action_photo",
    fileName: "ladder_after.jpg",
    storagePath: "/리움미술관 승강기 교체공사/02_지적사항/ladder_after.jpg",
    caption: "아웃트리거 설치 완료",
    representative: true,
    reportInclude: true,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "photo-sample-003",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    findingId: "finding-sample-002",
    fileId: "file-asset-photo-sample-003",
    photoType: "finding_photo",
    fileName: "distribution_before.jpg",
    storagePath: "/리움미술관 승강기 교체공사/02_지적사항/distribution_before.jpg",
    caption: "책임자 표기 누락",
    representative: false,
    reportInclude: true,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "photo-sample-004",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-life-foundation",
    findingId: "finding-sample-003",
    fileId: "file-asset-photo-sample-004",
    photoType: "finding_photo",
    fileName: "socket_before.jpg",
    storagePath: "/리움미술관 승강기 교체공사/02_지적사항/socket_before.jpg",
    caption: "방우 덮개 파손 상태",
    representative: false,
    reportInclude: true,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "photo-sample-006",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-life-foundation",
    findingId: "finding-sample-005",
    fileId: "file-asset-photo-sample-006",
    photoType: "finding_photo",
    fileName: "cable_before.jpg",
    storagePath: "/리움미술관 승강기 교체공사/02_지적사항/cable_before.jpg",
    caption: "케이블 릴 전선 풀림 상태",
    representative: false,
    reportInclude: true,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
];

export const sampleFindingTimeline: FindingTimelineEvent[] = [
  {
    id: "finding-timeline-sample-001",
    findingId: "finding-sample-001",
    eventType: "finding.created",
    summary: "지적사항이 등록되었습니다.",
    createdAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "finding-timeline-sample-002",
    findingId: "finding-sample-001",
    eventType: "corrective-action.verified",
    summary: "조치현황이 확인되었습니다.",
    createdAt: "2026-05-12T10:00:00+09:00",
  },
];

export const samplePhotoLedgers: PhotoLedger[] = [
  {
    id: "photo-ledger-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    documentId: "doc-sample-001",
    title: "삼성문화재단 사진대지",
    status: "draft",
    layoutMode: "one_entry_per_page",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "photo-ledger-sample-002",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-life-foundation",
    title: "삼성생명공익재단 사진대지",
    status: "draft",
    layoutMode: "one_entry_per_page",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
];

export const samplePhotoLedgerEntries: PhotoLedgerEntry[] = [
  {
    id: "photo-ledger-entry-sample-001",
    photoLedgerId: "photo-ledger-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    findingId: "finding-sample-001",
    correctiveActionId: "action-sample-001",
    findingPhotoId: "photo-sample-001",
    actionPhotoId: "photo-sample-002",
    findingCaption: "아웃트리거 미설치 상태",
    actionCaption: "아웃트리거 설치 완료",
    displayOrder: 1,
    confirmed: true,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "photo-ledger-entry-sample-002",
    photoLedgerId: "photo-ledger-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    findingId: "finding-sample-002",
    correctiveActionId: "action-sample-002",
    findingPhotoId: "photo-sample-003",
    findingCaption: "책임자 표기 누락",
    actionCaption: "정·부 책임자 지정 예정",
    displayOrder: 2,
    confirmed: false,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
];

export const samplePhotoLedgerWarnings: PhotoLedgerWarning[] = [
  {
    id: "photo-ledger-warning-sample-001",
    photoLedgerId: "photo-ledger-sample-001",
    entryId: "photo-ledger-entry-sample-002",
    code: "missing_action_photo",
    severity: "danger",
    message: "조치사진이 누락되었습니다.",
    createdAt: "2026-05-10T09:00:00+09:00",
  },
];

export function getSampleFindingListItems(projectOrRoundId: string): FindingListItem[] {
  const filtered = sampleFindings.filter(
    (item) => item.projectId === projectOrRoundId || item.inspectionRoundId === projectOrRoundId,
  );
  return filtered.map((finding) => {
    const photos = sampleEvidencePhotos.filter((item) => item.findingId === finding.id);
    const actions = sampleCorrectiveActions.filter((item) => item.findingId === finding.id);
    return {
      finding,
      ownerDisplayName:
        finding.ownerPartyId === "owner-samsung-cultural-foundation"
          ? "삼성문화재단"
          : finding.ownerPartyId === "owner-samsung-life-foundation"
            ? "삼성생명공익재단"
            : null,
      responsibleOrganizationName: "현대엘리베이터(주)",
      findingPhotoCount: photos.filter((item) => item.photoType === "finding_photo").length,
      actionPhotoCount: photos.filter((item) => item.photoType === "action_photo").length,
      correctiveActionStatus: actions[0]?.status ?? null,
      warnings: [
        ...(photos.some((item) => item.photoType === "finding_photo") ? [] : ["findingPhotoMissing"]),
        ...(actions.length > 0 && photos.every((item) => item.photoType !== "action_photo") ? ["actionPhotoMissing"] : []),
      ],
    };
  });
}

export function getSampleFindingDetail(findingId: string): FindingDetailResponse {
  const finding = sampleFindings.find((item) => item.id === findingId) ?? sampleFindings[0];
  return {
    finding,
    correctiveActions: sampleCorrectiveActions.filter((item) => item.findingId === finding.id),
    photos: sampleEvidencePhotos.filter((item) => item.findingId === finding.id),
    timeline: sampleFindingTimeline.filter((item) => item.findingId === finding.id),
    warnings: getSampleFindingListItems(finding.inspectionRoundId).find((item) => item.finding.id === finding.id)?.warnings ?? [],
  };
}

export function getSamplePhotoLedgerDetail(photoLedgerId: string): PhotoLedgerDetailResponse {
  const photoLedger = samplePhotoLedgers.find((item) => item.id === photoLedgerId) ?? samplePhotoLedgers[0];
  const entries = samplePhotoLedgerEntries.filter((item) => item.photoLedgerId === photoLedger.id);
  const findingIds = entries.map((item) => item.findingId);
  const actionIds = entries.map((item) => item.correctiveActionId).filter(Boolean);
  const photoIds = entries.flatMap((item) => [item.findingPhotoId, item.actionPhotoId]).filter(Boolean);
  return {
    photoLedger,
    entries,
    findings: sampleFindings.filter((item) => findingIds.includes(item.id)),
    correctiveActions: sampleCorrectiveActions.filter((item) => actionIds.includes(item.id)),
    photos: sampleEvidencePhotos.filter((item) => photoIds.includes(item.id)),
    warnings: samplePhotoLedgerWarnings.filter((item) => item.photoLedgerId === photoLedger.id),
  };
}

export function getSampleActionRequestMailDraft(): ActionRequestMailDraft {
  return {
    id: "action-request-mail-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    findingIds: ["finding-sample-002", "finding-sample-003"],
    ownerPartyId: "owner-samsung-cultural-foundation",
    contractorContactId: "contact-contractor-001",
    subject: "[A&C ERP] 현장 지적사항 조치 요청",
    body: "지적사항 2건에 대한 조치 결과를 회신해 주시기 바랍니다.",
    attachmentFileIds: ["file-asset-photo-sample-003", "file-asset-photo-sample-004"],
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  };
}
