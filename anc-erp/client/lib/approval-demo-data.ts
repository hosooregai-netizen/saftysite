import type {
  ApprovalListItem,
  ApprovalTemplateDetailResponse,
  ApprovalWorkflowDetailResponse,
  FinalDocumentPackage,
  SignatureAsset,
  SignatureTaskListResponse,
  SubmissionDetailResponse,
  SubmissionReadinessResponse,
} from "../../packages/contracts/src";

function sampleDocument(documentId: string) {
  return {
    id: documentId,
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    title: "공사안전보건대장 이행확인 보고서",
    status: "approval_requested",
    ownerReportTaskId: "owner-report-task-001-01",
    templateId: "template-safety-report-v1",
    documentType: "safety_health_ledger_inspection_report",
    documentNo: "ANC-2025-001-R1",
    roundNo: 1,
    contentSnapshot: null,
    latestVersionNo: 2,
    exportedFileId: "file-asset-final-001",
    submittedAt: null,
    mailThreadId: null,
    submissionId: null,
    createdAt: "2026-05-10T11:00:00+09:00",
    updatedAt: "2026-05-10T11:30:00+09:00",
  };
}

export function getSampleApprovalWorkflowDetail(documentId: string): ApprovalWorkflowDetailResponse {
  return {
    document: sampleDocument(documentId),
    workflow: {
      id: "approval-workflow-sample-001",
      documentId,
      projectId: "project-sample-001",
      inspectionRoundId: "round-sample-001",
      ownerPartyId: "owner-samsung-cultural-foundation",
      title: "공사안전보건대장 이행확인 보고서 결재",
      status: "requested",
      templateId: "approval-template-safety-report-001",
      currentStepOrder: 1,
      requestedBy: "user-engineer-001",
      requestedAt: "2026-05-10T11:30:00+09:00",
      completedAt: null,
      createdAt: "2026-05-10T11:30:00+09:00",
      updatedAt: "2026-05-10T11:30:00+09:00",
    },
    steps: [
      {
        id: "approval-step-sample-001",
        workflowId: "approval-workflow-sample-001",
        stepOrder: 1,
        role: "internal_review",
        assigneeUserId: null,
        assigneeLabel: "기술지도팀",
        status: "current",
        required: true,
        actedAt: null,
        comment: null,
        delegatedToUserId: null,
        createdAt: "2026-05-10T11:30:00+09:00",
        updatedAt: "2026-05-10T11:30:00+09:00",
      },
      {
        id: "approval-step-sample-002",
        workflowId: "approval-workflow-sample-001",
        stepOrder: 2,
        role: "chief_engineer_review",
        assigneeUserId: null,
        assigneeLabel: "책임기술사",
        status: "pending",
        required: true,
        actedAt: null,
        comment: null,
        delegatedToUserId: null,
        createdAt: "2026-05-10T11:30:00+09:00",
        updatedAt: "2026-05-10T11:30:00+09:00",
      },
    ],
    comments: [
      {
        id: "approval-comment-sample-001",
        workflowId: "approval-workflow-sample-001",
        stepId: "approval-step-sample-001",
        authorUserId: "user-engineer-001",
        body: "최종 제출 전 내부 검토 대기 상태입니다.",
        createdAt: "2026-05-10T11:30:00+09:00",
      },
    ],
    auditLogs: [],
  };
}

export function getSampleApprovals(): ApprovalListItem[] {
  const detail = getSampleApprovalWorkflowDetail("doc-sample-001");
  return [
    {
      workflow: detail.workflow!,
      document: detail.document,
      currentStep: detail.steps[0],
      pendingRequiredCount: 2,
    },
  ];
}

export function getSampleSignatureTasks(documentId: string): SignatureTaskListResponse {
  return {
    document: sampleDocument(documentId),
    tasks: [
      {
        id: "signature-task-sample-001",
        documentId,
        projectId: "project-sample-001",
        ownerPartyId: "owner-samsung-cultural-foundation",
        taskType: "seal_review",
        title: "날인 여부 검토",
        status: "pending",
        required: false,
        signatureAssetId: "signature-asset-sample-001",
        signedFileId: null,
        waivedReason: null,
        completedAt: null,
        createdAt: "2026-05-10T11:30:00+09:00",
        updatedAt: "2026-05-10T11:30:00+09:00",
      },
      {
        id: "signature-task-sample-002",
        documentId,
        projectId: "project-sample-001",
        ownerPartyId: "owner-samsung-cultural-foundation",
        taskType: "signed_file_upload",
        title: "서명/날인 반영본 업로드",
        status: "pending",
        required: true,
        signatureAssetId: "signature-asset-sample-002",
        signedFileId: null,
        waivedReason: null,
        completedAt: null,
        createdAt: "2026-05-10T11:30:00+09:00",
        updatedAt: "2026-05-10T11:30:00+09:00",
      },
    ],
  };
}

export function getSampleSignatureAssets(): SignatureAsset[] {
  return [
    {
      id: "signature-asset-sample-001",
      label: "A&C 직인",
      assetType: "seal",
      fileId: "file-signature-asset-001",
      status: "active",
      createdAt: "2026-05-10T11:30:00+09:00",
      updatedAt: "2026-05-10T11:30:00+09:00",
    },
    {
      id: "signature-asset-sample-002",
      label: "책임기술사 서명",
      assetType: "signature",
      fileId: "file-signature-asset-002",
      status: "active",
      createdAt: "2026-05-10T11:30:00+09:00",
      updatedAt: "2026-05-10T11:30:00+09:00",
    },
  ];
}

export function getSampleSubmissionReadiness(documentId: string): SubmissionReadinessResponse {
  const signature = getSampleSignatureTasks(documentId);
  const pkg: FinalDocumentPackage = {
    id: "submission-package-sample-001",
    documentId,
    projectId: "project-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    mainFileId: "file-asset-final-001",
    signedFileId: null,
    attachmentFileIds: ["file-asset-support-001"],
    status: "draft",
    finalizedAt: null,
    createdAt: "2026-05-10T11:30:00+09:00",
    updatedAt: "2026-05-10T11:30:00+09:00",
  };
  return {
    document: sampleDocument(documentId),
    workflow: getSampleApprovalWorkflowDetail(documentId).workflow,
    signatureTasks: signature.tasks,
    package: pkg,
    warnings: [
      {
        code: "approval_missing",
        message: "필수 결재가 완료되지 않았습니다.",
        severity: "required",
        field: "approvalWorkflow",
      },
      {
        code: "signature_missing",
        message: "필수 서명/날인 task가 완료되지 않았습니다.",
        severity: "required",
        field: "signatureTasks",
      },
    ],
    ready: false,
  };
}

export function getSampleSubmissionDetail(submissionId: string): SubmissionDetailResponse {
  return {
    submission: {
      id: submissionId,
      documentId: "doc-sample-001",
      projectId: "project-sample-001",
      inspectionRoundId: "round-sample-001",
      ownerPartyId: "owner-samsung-cultural-foundation",
      exportedFileId: "file-asset-final-001",
      mailThreadId: "mail-thread-sample-001",
      submittedAt: "2026-05-10T13:00:00+09:00",
      status: "submitted",
      packageId: "submission-package-sample-001",
      channel: "mail",
      finalFileId: "file-asset-final-001",
      externalReference: null,
      memo: null,
      receiptConfirmedAt: null,
      revisionRequestedAt: null,
      createdAt: "2026-05-10T12:40:00+09:00",
      updatedAt: "2026-05-10T13:00:00+09:00",
    },
    document: sampleDocument("doc-sample-001"),
    package: getSampleSubmissionReadiness("doc-sample-001").package,
    recipients: [
      {
        id: "submission-recipient-sample-001",
        submissionId,
        name: "김발주",
        email: "owner1@example.com",
        ownerPartyId: "owner-samsung-cultural-foundation",
        organizationName: "삼성문화재단",
        roleLabel: "보고서 수신 담당",
        createdAt: "2026-05-10T12:40:00+09:00",
      },
    ],
    attachments: [
      {
        id: "submission-attachment-sample-001",
        submissionId,
        fileId: "file-asset-support-001",
        label: "첨부 1",
        attachmentType: "supporting",
        createdAt: "2026-05-10T12:40:00+09:00",
      },
    ],
    events: [
      {
        id: "submission-event-sample-001",
        submissionId,
        status: "submitted",
        summary: "메일 제출이 완료되었습니다.",
        createdAt: "2026-05-10T13:00:00+09:00",
      },
    ],
    auditLogs: [],
  };
}

export function getSampleApprovalTemplates(): ApprovalTemplateDetailResponse[] {
  return [
    {
      template: {
        id: "approval-template-safety-report-001",
        name: "보고서 결재 기본선",
        documentType: "safety_health_ledger_inspection_report",
        status: "published",
        createdAt: "2026-05-10T11:30:00+09:00",
        updatedAt: "2026-05-10T11:30:00+09:00",
      },
      steps: [
        {
          id: "approval-template-step-001",
          templateId: "approval-template-safety-report-001",
          stepOrder: 1,
          role: "internal_review",
          required: true,
          defaultAssigneeLabel: "기술지도팀",
        },
        {
          id: "approval-template-step-002",
          templateId: "approval-template-safety-report-001",
          stepOrder: 2,
          role: "chief_engineer_review",
          required: true,
          defaultAssigneeLabel: "책임기술사",
        },
      ],
    },
  ];
}
