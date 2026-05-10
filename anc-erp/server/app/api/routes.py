from fastapi import APIRouter, HTTPException

from server.app.api.admin_schemas import (
    AdminUserPayload,
    AdminUserUpdatePayload,
    ChecklistTemplateAdminPayload,
    ChecklistTemplateAdminUpdatePayload,
    CompanyFileUploadPayload,
    CompanyProfileUpdatePayload,
    DocumentTemplatePayload,
    DocumentTemplateUpdatePayload,
    LegalClauseActionPayload,
    LegalClausePayload,
    LegalClauseUpdatePayload,
    PhrasePayload,
    PhraseUpdatePayload,
    PromptRunPayload,
    PromptTemplatePayload,
    PromptTemplateUpdatePayload,
    PromptTestCasePayload,
    PromptTestCaseUpdatePayload,
    PromptVersionActionPayload,
    PromptVersionPayload,
    PromptVersionUpdatePayload,
    RolePayload,
    RolePermissionsPayload,
    RoleUpdatePayload,
    TemplatePreviewPayload,
    TemplateReviewActionPayload,
    TemplateSectionPayload,
    TemplateSectionUpdatePayload,
    TemplateVariableUpdatePayload,
    TemplateVersionPayload,
    TemplateVersionUpdatePayload,
    WebhardPolicyUpdatePayload,
)
from server.app.api.dashboard_schemas import (
    AlertRulePayload,
    AlertRuleUpdatePayload,
    DashboardInsightPayload,
    DashboardWidgetPayload,
    DashboardWidgetsReorderPayload,
    DashboardWidgetUpdatePayload,
)
from server.app.api.checklist_schemas import (
    AdditionalHazardPayload,
    AdditionalHazardUpdatePayload,
    ChecklistBulkSavePayload,
    ChecklistFillNotApplicablePayload,
    ChecklistItemPayload,
    ChecklistItemUpdatePayload,
    ChecklistItemsReorderPayload,
    ChecklistMobileDraftCommitPayload,
    ChecklistMobileDraftPayload,
    ChecklistPhotoLinkPayload,
    ChecklistPhotoUploadPayload,
    ChecklistResultPayload,
    ChecklistResultUpdatePayload,
    ChecklistSessionPayload,
    ChecklistSessionUpdatePayload,
    ChecklistTemplatePayload,
    ChecklistTemplateUpdatePayload,
    FindingCandidateCreatePayload,
    FindingCandidateDismissPayload,
)
from server.app.api.approval_schemas import (
    ApprovalRequestPayload,
    ApprovalStepActionPayload,
    ApprovalStepPayload,
    ApprovalStepUpdatePayload,
    ApprovalTemplatePayload,
    ApprovalTemplateUpdatePayload,
    ApprovalWorkflowPayload,
    ApprovalWorkflowUpdatePayload,
    SignatureAssetPayload,
    SignatureAssetUpdatePayload,
    SignatureTaskCompletePayload,
    SignatureTaskPayload,
    SignatureTaskUpdatePayload,
    SignatureTaskWaivePayload,
    SignedFileUploadPayload,
    SubmissionCreatePayload,
    SubmissionMailSendPayload,
    SubmissionManualSubmitPayload,
    SubmissionPackagePayload,
    SubmissionPackageUpdatePayload,
    SubmissionRevisionPayload,
    SubmissionUpdatePayload,
)
from server.app.api.contract_schemas import (
    ContractCreatePayload,
    ContractFileUploadPayload,
    ContractPartyPayload,
    ContractPartyUpdatePayload,
    ContractUpdatePayload,
    EstimateCreatePayload,
    EstimateUpdatePayload,
    PaymentSplitCalculationPayload,
    PaymentTermPayload,
    PaymentTermUpdatePayload,
)
from server.app.api.finding_schemas import (
    ActionRequestMailDraftPayload,
    ActionRequestMailSendPayload,
    CorrectiveActionPayload,
    CorrectiveActionRejectPayload,
    CorrectiveActionSubmitPayload,
    CorrectiveActionUpdatePayload,
    CorrectiveActionVerifyPayload,
    EvidencePhotoCaptionPayload,
    EvidencePhotoLinkPayload,
    EvidencePhotoUpdatePayload,
    EvidencePhotoUploadPayload,
    FindingLinkChecklistResultPayload,
    FindingLinkOwnerPayload,
    FindingPayload,
    FindingRejectPayload,
    FindingRequestActionPayload,
    FindingUpdatePayload,
    FindingVerifyPayload,
    PhotoLedgerEntryPayload,
    PhotoLedgerEntryUpdatePayload,
    PhotoLedgerPayload,
    PhotoLedgerReorderPayload,
    PhotoLedgerSyncPayload,
    PhotoLedgerUpdatePayload,
    PhotoMarkupPayload,
)
from server.app.api.inspection_schemas import (
    InspectionOwnerReportTaskLinkDocumentPayload,
    InspectionOwnerReportTaskMarkExportedPayload,
    InspectionOwnerReportTaskMarkSubmittedPayload,
    InspectionOwnerReportTaskUpdatePayload,
    InspectionRoundConfirmDatePayload,
    InspectionRoundPayload,
    InspectionRoundReschedulePayload,
    InspectionRoundUpdatePayload,
    InspectionSchedulePayload,
    InspectionSchedulePreviewPayload,
    InspectionScheduleUpdatePayload,
    InspectionTaskPayload,
    InspectionTaskUpdatePayload,
    WorkScheduleAttachmentPayload,
    WorkScheduleAttachmentUpdatePayload,
)
from server.app.api.mail_schemas import (
    ContextMailDraftPayload,
    MailAccountGuestPayload,
    MailAccountUpdatePayload,
    MailAttachmentBulkSavePayload,
    MailAttachmentLinkFilePayload,
    MailDraftGeneratePayload,
    MailDraftPayload,
    MailDraftSendPayload,
    MailDraftUpdatePayload,
    MailMessageLinkEntityPayload,
    MailMessageUpdatePayload,
    MailSendPayload,
    MailSignaturePayload,
    MailSignatureUpdatePayload,
    MailTemplatePayload,
    MailTemplateUpdatePayload,
    MailThreadUpdatePayload,
)
from server.app.api.project_schemas import (
    ApplyExtractedInfoPayload,
    ContactPayload,
    ContactUpdatePayload,
    ExtractProjectPayload,
    OrganizationPayload,
    OrganizationUpdatePayload,
    ProjectCreatePayload,
    ProjectPartyPayload,
    ProjectPartyReorderPayload,
    ProjectPartyShareCalculationPayload,
    ProjectPartyUpdatePayload,
    ProjectUpdatePayload,
    SetPrimaryContactPayload,
    ValidateExtractedInfoPayload,
)
from server.app.api.safety_cost_schemas import (
    SafetyCostConfirmPayload,
    SafetyCostEvidenceLinkPayload,
    SafetyCostEvidenceUpdatePayload,
    SafetyCostEvidenceUploadPayload,
    SafetyCostReviewPayload,
    SafetyCostSyncPayload,
    SafetyCostUsagePayload,
    SafetyCostUsageUpdatePayload,
)
from server.app.api.safety_management_plan_schemas import (
    SafetyEducationPlanPayload,
    SafetyEmergencyPlanPayload,
    SafetyManagementAttachmentLinkPayload,
    SafetyManagementPlanConfirmPayload,
    SafetyManagementPlanCreatePayload,
    SafetyManagementPlanExportPayload,
    SafetyManagementPlanSaveSectionPayload,
    SafetyManagementPlanUpdatePayload,
    SafetyManagementRiskItemPayload,
    SafetyManagementRiskItemUpdatePayload,
    SafetyManagementWorkTypePayload,
    SafetyManagementWorkTypeUpdatePayload,
    SafetyOrganizationPlanPayload,
)
from server.app.api.safety_health_ledger_schemas import (
    LedgerAttachmentLinkPayload,
    LedgerMeasurePayload,
    LedgerMeasureUpdatePayload,
    LedgerRiskItemPayload,
    LedgerRiskItemUpdatePayload,
    SafetyHealthLedgerConfirmPayload,
    SafetyHealthLedgerCreatePayload,
    SafetyHealthLedgerExportPayload,
    SafetyHealthLedgerSaveSectionPayload,
    SafetyHealthLedgerUpdatePayload,
    SafetyHealthLedgerVersionPayload,
)
from server.app.api.safety_report_schemas import (
    SafetyReportCloneForOwnerPayload,
    SafetyReportConfirmPayload,
    SafetyReportDraftPayload,
    SafetyReportExportPayload,
    SafetyReportLinkOwnerTaskPayload,
    SafetyReportMarkSubmittedPayload,
    SafetyReportSaveSectionPayload,
    SafetyReportUpdatePayload,
)
from server.app.api.webhard_schemas import (
    FileBulkActionPayload,
    FileClassificationApplyPayload,
    FileCopyPayload,
    FileLinkPayload,
    FileMovePayload,
    FileUpdatePayload,
    FileUploadPayload,
    FileVersionPayload,
    FolderMovePayload,
    FolderPayload,
    FolderUpdatePayload,
    MailAttachmentSavePayload,
    ShareLinkPayload,
    ShareLinkUpdatePayload,
)
from server.app.core.config import settings
from server.app.repositories.bootstrap_repository import BootstrapRepository
from server.app.repositories.admin_repository import AdminRepository
from server.app.repositories.approval_repository import ApprovalRepository
from server.app.repositories.checklist_repository import ChecklistRepository
from server.app.repositories.contract_repository import ContractRepository
from server.app.repositories.dashboard_repository import DashboardRepository
from server.app.repositories.finding_repository import FindingRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.mail_repository import MailRepository
from server.app.repositories.project_repository import ProjectRepository
from server.app.repositories.safety_cost_repository import SafetyCostRepository
from server.app.repositories.safety_health_ledger_repository import SafetyHealthLedgerRepository
from server.app.repositories.safety_management_plan_repository import SafetyManagementPlanRepository
from server.app.repositories.safety_report_repository import SafetyReportRepository
from server.app.repositories.webhard_repository import WebhardRepository
from server.app.services.bootstrap_service import BootstrapService
from server.app.services.admin_service import (
    AdminNotFoundError,
    AdminService,
    AdminValidationError,
)
from server.app.services.dashboard_service import (
    DashboardNotFoundError,
    DashboardService,
    DashboardValidationError,
)
from server.app.services.approval_service import (
    ApprovalNotFoundError,
    ApprovalService,
    ApprovalValidationError,
)
from server.app.services.checklist_service import (
    ChecklistNotFoundError,
    ChecklistService,
    ChecklistValidationError,
)
from server.app.services.contract_service import (
    ContractNotFoundError,
    ContractService,
    ContractValidationError,
)
from server.app.services.finding_service import (
    FindingNotFoundError,
    FindingService,
    FindingValidationError,
)
from server.app.services.inspection_service import (
    InspectionNotFoundError,
    InspectionService,
    InspectionValidationError,
)
from server.app.services.mail_service import (
    MailboxNotFoundError,
    MailboxService,
    MailboxValidationError,
)
from server.app.services.project_service import (
    ProjectNotFoundError,
    ProjectService,
    ProjectValidationError,
)
from server.app.services.safety_cost_service import (
    SafetyCostNotFoundError,
    SafetyCostService,
    SafetyCostValidationError,
)
from server.app.services.safety_health_ledger_service import (
    SafetyHealthLedgerNotFoundError,
    SafetyHealthLedgerService,
    SafetyHealthLedgerValidationError,
)
from server.app.services.safety_management_plan_service import (
    SafetyManagementPlanNotFoundError,
    SafetyManagementPlanService,
    SafetyManagementPlanValidationError,
)
from server.app.services.safety_report_service import (
    SafetyReportNotFoundError,
    SafetyReportService,
    SafetyReportValidationError,
)
from server.app.services.webhard_service import (
    WebhardNotFoundError,
    WebhardService,
    WebhardValidationError,
)
from server.app.services.webhard_storage_adapter import LocalWebhardStorageAdapter

router = APIRouter()
project_repository = ProjectRepository()
bootstrap_service = BootstrapService(BootstrapRepository(project_repository))
project_service = ProjectService(project_repository)
contract_repository = ContractRepository(project_repository)
contract_service = ContractService(contract_repository, project_repository)
inspection_repository = InspectionRepository(project_repository, contract_repository)
inspection_service = InspectionService(inspection_repository, project_repository, contract_repository)
checklist_repository = ChecklistRepository(project_repository, inspection_repository)
checklist_service = ChecklistService(checklist_repository, project_repository, inspection_repository)
finding_repository = FindingRepository(project_repository, inspection_repository, checklist_repository)
finding_service = FindingService(
    finding_repository,
    project_repository,
    inspection_repository,
    checklist_repository,
)
safety_cost_repository = SafetyCostRepository(project_repository, inspection_repository)
safety_cost_service = SafetyCostService(safety_cost_repository, project_repository, inspection_repository)
safety_management_plan_repository = SafetyManagementPlanRepository(project_repository)
safety_management_plan_service = SafetyManagementPlanService(
    safety_management_plan_repository,
    project_repository,
    contract_repository,
    inspection_repository,
    checklist_repository,
)
safety_health_ledger_repository = SafetyHealthLedgerRepository(
    project_repository,
    safety_management_plan_repository,
    inspection_repository,
    checklist_repository,
    finding_repository,
    safety_cost_repository,
)
safety_health_ledger_service = SafetyHealthLedgerService(
    safety_health_ledger_repository,
    project_repository,
    safety_management_plan_repository,
    inspection_repository,
    checklist_repository,
    finding_repository,
    safety_cost_repository,
)
safety_report_repository = SafetyReportRepository(project_repository, inspection_repository)
safety_report_service = SafetyReportService(
    safety_report_repository,
    project_repository,
    inspection_repository,
    checklist_repository,
    finding_repository,
    safety_cost_repository,
)
admin_repository = AdminRepository()
dashboard_repository = DashboardRepository()
webhard_repository = WebhardRepository(project_repository)
webhard_service = WebhardService(
    webhard_repository,
    project_repository,
    LocalWebhardStorageAdapter(),
)
mail_repository = MailRepository(project_repository)
mail_service = MailboxService(
    mail_repository,
    project_repository,
    inspection_repository,
    contract_repository,
    finding_repository,
    safety_report_repository,
    finding_service,
    safety_report_service,
    webhard_service,
)
approval_repository = ApprovalRepository(
    project_repository,
    inspection_repository,
    safety_report_repository,
    mail_repository,
)
approval_service = ApprovalService(
    approval_repository,
    project_repository,
    inspection_repository,
)
admin_service = AdminService(
    admin_repository,
    checklist_service,
    approval_service,
    mail_service,
)
dashboard_service = DashboardService(
    dashboard_repository,
    project_repository,
    inspection_repository,
    finding_repository,
    safety_cost_repository,
    safety_report_repository,
    approval_repository,
    mail_repository,
    webhard_repository,
)


@router.get("/health")
def get_health() -> dict:
    return {
        "status": "ok",
        "service": settings.app_name,
        "rootEntity": settings.root_entity,
        "version": settings.version,
    }


@router.get("/api/v1/bootstrap/summary")
def get_bootstrap_summary() -> dict:
    return bootstrap_service.get_summary()


@router.get("/api/v1/dashboard/overview")
def get_dashboard_overview(project_ids: str | None = None) -> dict:
    scoped_ids = project_ids.split(",") if project_ids else None
    return dashboard_service.get_overview(scoped_ids)


@router.get("/api/v1/dashboard/my-work")
def get_dashboard_my_work(project_ids: str | None = None) -> dict:
    scoped_ids = project_ids.split(",") if project_ids else None
    return dashboard_service.get_my_work(scoped_ids)


@router.get("/api/v1/projects/{project_id}/dashboard")
def get_project_dashboard(project_id: str) -> dict:
    try:
        return dashboard_service.get_project_dashboard(project_id)
    except DashboardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/dashboard/widgets")
def list_dashboard_widgets() -> list[dict]:
    return dashboard_service.list_widgets()


@router.post("/api/v1/dashboard/widgets")
def create_dashboard_widget(payload: DashboardWidgetPayload) -> dict:
    try:
        return dashboard_service.create_widget(payload.model_dump(exclude_none=True))
    except DashboardValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/dashboard/widgets/{widget_id}")
def update_dashboard_widget(widget_id: str, payload: DashboardWidgetUpdatePayload) -> dict:
    try:
        return dashboard_service.update_widget(widget_id, payload.model_dump(exclude_none=True))
    except (DashboardNotFoundError, DashboardValidationError) as error:
        raise HTTPException(
            status_code=404 if isinstance(error, DashboardNotFoundError) else 400,
            detail=str(error),
        ) from error


@router.delete("/api/v1/dashboard/widgets/{widget_id}")
def delete_dashboard_widget(widget_id: str) -> dict:
    try:
        return dashboard_service.delete_widget(widget_id)
    except DashboardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/dashboard/widgets/reorder")
def reorder_dashboard_widgets(payload: DashboardWidgetsReorderPayload) -> list[dict]:
    return dashboard_service.reorder_widgets(payload.widgetIds)


@router.get("/api/v1/dashboard/metrics/project-health")
def list_dashboard_project_health_metrics(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_project_health_metrics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/metrics/inspection-status")
def list_dashboard_inspection_status_metrics(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_inspection_status_metrics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/metrics/report-status")
def list_dashboard_report_status_metrics(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_report_status_metrics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/metrics/finding-aging")
def list_dashboard_finding_aging_metrics(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_finding_aging_metrics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/metrics/safety-cost-usage")
def list_dashboard_safety_cost_metrics(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_safety_cost_usage_metrics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/metrics/approval-queue")
def list_dashboard_approval_metrics(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_approval_queue_metrics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/metrics/mail-file-activity")
def list_dashboard_mail_file_metrics(project_ids: str | None = None) -> dict:
    return dashboard_service.list_mail_file_activity_metrics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/metrics/submission-status")
def list_dashboard_submission_metrics(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_submission_status_metrics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/statistics/monthly-inspections")
def list_dashboard_monthly_inspections(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_monthly_inspection_statistics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/statistics/monthly-submissions")
def list_dashboard_monthly_submissions(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_monthly_submission_statistics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/statistics/risk-types")
def list_dashboard_risk_types(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_risk_type_statistics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/statistics/finding-resolution-time")
def list_dashboard_finding_resolution_time(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_finding_resolution_time_statistics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/statistics/owner-submission-lag")
def list_dashboard_owner_submission_lag(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_owner_submission_lag_statistics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/statistics/safety-cost-distribution")
def list_dashboard_safety_cost_distribution(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_safety_cost_distribution_statistics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/statistics/export-summary")
def list_dashboard_export_summary(project_ids: str | None = None) -> list[dict]:
    return dashboard_service.list_export_summary_statistics(project_ids.split(",") if project_ids else None)


@router.get("/api/v1/dashboard/alerts")
def list_dashboard_alerts() -> list[dict]:
    return dashboard_service.list_alerts()


@router.post("/api/v1/dashboard/alerts/refresh")
def refresh_dashboard_alerts(project_ids: str | None = None) -> dict:
    return dashboard_service.refresh_alerts(project_ids.split(",") if project_ids else None)


@router.patch("/api/v1/dashboard/alerts/{alert_id}/acknowledge")
def acknowledge_dashboard_alert(alert_id: str) -> dict:
    try:
        return dashboard_service.acknowledge_alert(alert_id)
    except DashboardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/dashboard/alerts/{alert_id}/dismiss")
def dismiss_dashboard_alert(alert_id: str) -> dict:
    try:
        return dashboard_service.dismiss_alert(alert_id)
    except DashboardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/dashboard/alert-rules")
def list_dashboard_alert_rules() -> list[dict]:
    return dashboard_service.list_alert_rules()


@router.post("/api/v1/dashboard/alert-rules")
def create_dashboard_alert_rule(payload: AlertRulePayload) -> dict:
    try:
        return dashboard_service.create_alert_rule(payload.model_dump(exclude_none=True))
    except DashboardValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/dashboard/alert-rules/{alert_rule_id}")
def update_dashboard_alert_rule(alert_rule_id: str, payload: AlertRuleUpdatePayload) -> dict:
    try:
        return dashboard_service.update_alert_rule(alert_rule_id, payload.model_dump(exclude_none=True))
    except (DashboardNotFoundError, DashboardValidationError) as error:
        raise HTTPException(
            status_code=404 if isinstance(error, DashboardNotFoundError) else 400,
            detail=str(error),
        ) from error


@router.post("/api/v1/dashboard/insights/summary")
def create_dashboard_insight_summary(payload: DashboardInsightPayload) -> dict:
    return dashboard_service.create_insight_summary("summary", payload.projectId)


@router.post("/api/v1/dashboard/insights/project-risk")
def create_dashboard_project_risk_insight(payload: DashboardInsightPayload) -> dict:
    return dashboard_service.create_insight_summary("project_risk", payload.projectId)


@router.post("/api/v1/dashboard/insights/weekly-briefing")
def create_dashboard_weekly_briefing(payload: DashboardInsightPayload) -> dict:
    return dashboard_service.create_insight_summary("weekly_briefing", payload.projectId)


@router.get("/api/v1/admin/summary")
def get_admin_summary() -> dict:
    return admin_service.get_dashboard_summary()


@router.get("/api/v1/admin/users")
def list_admin_users() -> list[dict]:
    return admin_service.list_users()


@router.post("/api/v1/admin/users")
def create_admin_user(payload: AdminUserPayload) -> dict:
    try:
        return admin_service.create_user(payload.model_dump(exclude_none=True))
    except AdminValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/admin/users/{user_id}")
def get_admin_user(user_id: str) -> dict:
    try:
        return admin_service.get_user(user_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/admin/users/{user_id}")
def update_admin_user(user_id: str, payload: AdminUserUpdatePayload) -> dict:
    try:
        return admin_service.update_user(user_id, payload.model_dump(exclude_none=True))
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/admin/users/{user_id}")
def delete_admin_user(user_id: str) -> dict:
    try:
        return admin_service.delete_user(user_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/admin/roles")
def list_admin_roles() -> list[dict]:
    return admin_service.list_roles()


@router.post("/api/v1/admin/roles")
def create_admin_role(payload: RolePayload) -> dict:
    try:
        return admin_service.create_role(payload.model_dump(exclude_none=True))
    except AdminValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/admin/roles/{role_id}")
def update_admin_role(role_id: str, payload: RoleUpdatePayload) -> dict:
    try:
        return admin_service.update_role(role_id, payload.model_dump(exclude_none=True))
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/admin/roles/{role_id}")
def delete_admin_role(role_id: str) -> dict:
    try:
        return admin_service.delete_role(role_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/admin/permissions")
def list_admin_permissions() -> list[dict]:
    return admin_service.list_permissions()


@router.patch("/api/v1/admin/roles/{role_id}/permissions")
def update_admin_role_permissions(role_id: str, payload: RolePermissionsPayload) -> dict:
    try:
        return admin_service.update_role_permissions(role_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/company-profile")
def get_admin_company_profile() -> dict:
    try:
        return admin_service.get_company_profile()
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/admin/company-profile")
def update_admin_company_profile(payload: CompanyProfileUpdatePayload) -> dict:
    try:
        return admin_service.update_company_profile(payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/company-profile/logo")
def upload_admin_company_logo(payload: CompanyFileUploadPayload) -> dict:
    try:
        return admin_service.upload_company_logo(payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/company-profile/seal")
def upload_admin_company_seal(payload: CompanyFileUploadPayload) -> dict:
    try:
        return admin_service.upload_company_seal(payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/document-templates")
def list_admin_document_templates() -> list[dict]:
    return admin_service.list_document_templates()


@router.post("/api/v1/admin/document-templates")
def create_admin_document_template(payload: DocumentTemplatePayload) -> dict:
    try:
        return admin_service.create_document_template(payload.model_dump(exclude_none=True))
    except AdminValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/admin/document-templates/{template_id}")
def get_admin_document_template(template_id: str) -> dict:
    try:
        return admin_service.get_document_template(template_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/admin/document-templates/{template_id}")
def update_admin_document_template(template_id: str, payload: DocumentTemplateUpdatePayload) -> dict:
    try:
        return admin_service.update_document_template(template_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.delete("/api/v1/admin/document-templates/{template_id}")
def delete_admin_document_template(template_id: str) -> dict:
    try:
        return admin_service.delete_document_template(template_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/admin/document-templates/{template_id}/versions")
def list_admin_template_versions(template_id: str) -> list[dict]:
    try:
        return admin_service.list_template_versions(template_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/document-templates/{template_id}/versions")
def create_admin_template_version(template_id: str, payload: TemplateVersionPayload) -> dict:
    try:
        return admin_service.create_template_version(template_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/template-versions/{version_id}")
def get_admin_template_version(version_id: str) -> dict:
    try:
        return admin_service.get_template_version(version_id)
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.patch("/api/v1/admin/template-versions/{version_id}")
def update_admin_template_version(version_id: str, payload: TemplateVersionUpdatePayload) -> dict:
    try:
        return admin_service.update_template_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/template-versions/{version_id}/review")
def review_admin_template_version(version_id: str, payload: TemplateReviewActionPayload) -> dict:
    try:
        return admin_service.review_template_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/template-versions/{version_id}/publish")
def publish_admin_template_version(version_id: str, payload: TemplateReviewActionPayload) -> dict:
    try:
        return admin_service.publish_template_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/template-versions/{version_id}/deprecate")
def deprecate_admin_template_version(version_id: str, payload: TemplateReviewActionPayload) -> dict:
    try:
        return admin_service.deprecate_template_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/template-versions/{version_id}/rollback")
def rollback_admin_template_version(version_id: str, payload: TemplateReviewActionPayload) -> dict:
    try:
        return admin_service.rollback_template_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/template-versions/{version_id}/sections")
def list_admin_template_sections(version_id: str) -> list[dict]:
    try:
        return admin_service.list_template_sections(version_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/template-versions/{version_id}/sections")
def create_admin_template_section(version_id: str, payload: TemplateSectionPayload) -> dict:
    try:
        return admin_service.create_template_section(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.patch("/api/v1/admin/template-sections/{section_id}")
def update_admin_template_section(section_id: str, payload: TemplateSectionUpdatePayload) -> dict:
    try:
        return admin_service.update_template_section(section_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.delete("/api/v1/admin/template-sections/{section_id}")
def delete_admin_template_section(section_id: str) -> dict:
    try:
        return admin_service.delete_template_section(section_id)
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/template-versions/{version_id}/variables")
def list_admin_template_variables(version_id: str) -> list[dict]:
    try:
        return admin_service.list_template_variables(version_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/template-versions/{version_id}/variables/extract")
def extract_admin_template_variables(version_id: str) -> dict:
    try:
        return admin_service.extract_template_variables(version_id)
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.patch("/api/v1/admin/template-variables/{variable_id}")
def update_admin_template_variable(variable_id: str, payload: TemplateVariableUpdatePayload) -> dict:
    try:
        return admin_service.update_template_variable(variable_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.delete("/api/v1/admin/template-variables/{variable_id}")
def delete_admin_template_variable(variable_id: str) -> dict:
    try:
        return admin_service.delete_template_variable(variable_id)
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/template-versions/{version_id}/preview")
def preview_admin_template_version(version_id: str, payload: TemplatePreviewPayload) -> dict:
    try:
        return admin_service.preview_template_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/template-versions/{version_id}/validate")
def validate_admin_template_version(version_id: str) -> dict:
    try:
        return admin_service.validate_template_version(version_id)
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/template-versions/{version_id}/impact")
def get_admin_template_impact(version_id: str) -> dict:
    try:
        return admin_service.get_template_impact(version_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/admin/checklist-templates")
def list_admin_checklist_templates() -> list[dict]:
    return admin_service.list_checklist_templates()


@router.post("/api/v1/admin/checklist-templates")
def create_admin_checklist_template(payload: ChecklistTemplateAdminPayload) -> dict:
    return admin_service.create_checklist_template(payload.model_dump(exclude_none=True))


@router.get("/api/v1/admin/checklist-templates/{template_id}")
def get_admin_checklist_template(template_id: str) -> dict:
    try:
        return admin_service.get_checklist_template(template_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/admin/checklist-templates/{template_id}")
def update_admin_checklist_template(template_id: str, payload: ChecklistTemplateAdminUpdatePayload) -> dict:
    try:
        return admin_service.update_checklist_template(template_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/checklist-templates/{template_id}/clone")
def clone_admin_checklist_template(template_id: str) -> dict:
    try:
        return admin_service.clone_checklist_template(template_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/checklist-templates/{template_id}/publish")
def publish_admin_checklist_template(template_id: str) -> dict:
    try:
        return admin_service.publish_checklist_template(template_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/admin/checklist-templates/{template_id}/items")
def list_admin_checklist_items(template_id: str) -> list[dict]:
    try:
        return admin_service.list_checklist_items(template_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/checklist-templates/{template_id}/items")
def create_admin_checklist_item(template_id: str, payload: ChecklistItemPayload) -> dict:
    try:
        return admin_service.create_checklist_item(template_id, payload.model_dump(exclude_none=True))
    except (ChecklistNotFoundError, ChecklistValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, ChecklistNotFoundError) else 400, detail=str(error)) from error


@router.patch("/api/v1/admin/checklist-items/{item_id}")
def update_admin_checklist_item(item_id: str, payload: ChecklistItemUpdatePayload) -> dict:
    try:
        return admin_service.update_checklist_item(item_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/checklist-templates/{template_id}/items/reorder")
def reorder_admin_checklist_items(template_id: str, payload: ChecklistItemsReorderPayload) -> list[dict]:
    try:
        return admin_service.reorder_checklist_items(template_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/admin/phrases")
def list_admin_phrases() -> list[dict]:
    return admin_service.list_phrases()


@router.post("/api/v1/admin/phrases")
def create_admin_phrase(payload: PhrasePayload) -> dict:
    return admin_service.create_phrase(payload.model_dump(exclude_none=True))


@router.patch("/api/v1/admin/phrases/{phrase_id}")
def update_admin_phrase(phrase_id: str, payload: PhraseUpdatePayload) -> dict:
    try:
        return admin_service.update_phrase(phrase_id, payload.model_dump(exclude_none=True))
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/phrases/{phrase_id}/publish")
def publish_admin_phrase(phrase_id: str) -> dict:
    try:
        return admin_service.publish_phrase(phrase_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/admin/legal-clauses")
def list_admin_legal_clauses() -> list[dict]:
    return admin_service.list_legal_clauses()


@router.post("/api/v1/admin/legal-clauses")
def create_admin_legal_clause(payload: LegalClausePayload) -> dict:
    try:
        return admin_service.create_legal_clause(payload.model_dump(exclude_none=True))
    except AdminValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/admin/legal-clauses/{clause_id}")
def update_admin_legal_clause(clause_id: str, payload: LegalClauseUpdatePayload) -> dict:
    try:
        return admin_service.update_legal_clause(clause_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/legal-clauses/{clause_id}/request-review")
def request_review_admin_legal_clause(clause_id: str, payload: LegalClauseActionPayload) -> dict:
    try:
        return admin_service.request_legal_clause_review(clause_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/legal-clauses/{clause_id}/approve")
def approve_admin_legal_clause(clause_id: str, payload: LegalClauseActionPayload) -> dict:
    try:
        return admin_service.approve_legal_clause(clause_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/legal-clauses/{clause_id}/publish")
def publish_admin_legal_clause(clause_id: str, payload: LegalClauseActionPayload) -> dict:
    try:
        return admin_service.publish_legal_clause(clause_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/prompts")
def list_admin_prompts() -> list[dict]:
    return admin_service.list_prompts()


@router.post("/api/v1/admin/prompts")
def create_admin_prompt(payload: PromptTemplatePayload) -> dict:
    try:
        return admin_service.create_prompt(payload.model_dump(exclude_none=True))
    except AdminValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/admin/prompts/{prompt_id}")
def get_admin_prompt(prompt_id: str) -> dict:
    try:
        return admin_service.get_prompt(prompt_id)
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.patch("/api/v1/admin/prompts/{prompt_id}")
def update_admin_prompt(prompt_id: str, payload: PromptTemplateUpdatePayload) -> dict:
    try:
        return admin_service.update_prompt(prompt_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.delete("/api/v1/admin/prompts/{prompt_id}")
def delete_admin_prompt(prompt_id: str) -> dict:
    try:
        return admin_service.delete_prompt(prompt_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/admin/prompts/{prompt_id}/versions")
def list_admin_prompt_versions(prompt_id: str) -> list[dict]:
    try:
        return admin_service.list_prompt_versions(prompt_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/prompts/{prompt_id}/versions")
def create_admin_prompt_version(prompt_id: str, payload: PromptVersionPayload) -> dict:
    try:
        return admin_service.create_prompt_version(prompt_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/prompt-versions/{version_id}")
def get_admin_prompt_version(version_id: str) -> dict:
    try:
        return admin_service.get_prompt_version(version_id)
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.patch("/api/v1/admin/prompt-versions/{version_id}")
def update_admin_prompt_version(version_id: str, payload: PromptVersionUpdatePayload) -> dict:
    try:
        return admin_service.update_prompt_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/prompt-versions/{version_id}/run")
def run_admin_prompt_version(version_id: str, payload: PromptRunPayload) -> dict:
    try:
        return admin_service.run_prompt_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/prompt-versions/{version_id}/review")
def review_admin_prompt_version(version_id: str, payload: PromptVersionActionPayload) -> dict:
    try:
        return admin_service.review_prompt_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/prompt-versions/{version_id}/publish")
def publish_admin_prompt_version(version_id: str, payload: PromptVersionActionPayload) -> dict:
    try:
        return admin_service.publish_prompt_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/admin/prompt-versions/{version_id}/rollback")
def rollback_admin_prompt_version(version_id: str, payload: PromptVersionActionPayload) -> dict:
    try:
        return admin_service.rollback_prompt_version(version_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/prompts/{prompt_id}/test-cases")
def list_admin_prompt_test_cases(prompt_id: str) -> list[dict]:
    try:
        return admin_service.list_prompt_test_cases(prompt_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/prompts/{prompt_id}/test-cases")
def create_admin_prompt_test_case(prompt_id: str, payload: PromptTestCasePayload) -> dict:
    try:
        return admin_service.create_prompt_test_case(prompt_id, payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.patch("/api/v1/admin/prompt-test-cases/{test_case_id}")
def update_admin_prompt_test_case(test_case_id: str, payload: PromptTestCaseUpdatePayload) -> dict:
    try:
        return admin_service.update_prompt_test_case(test_case_id, payload.model_dump(exclude_none=True))
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/admin/prompt-test-cases/{test_case_id}")
def delete_admin_prompt_test_case(test_case_id: str) -> dict:
    try:
        return admin_service.delete_prompt_test_case(test_case_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/admin/prompt-versions/{version_id}/run-test-cases")
def run_admin_prompt_test_cases(version_id: str) -> dict:
    try:
        return admin_service.run_prompt_test_cases(version_id)
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/webhard-policies")
def get_admin_webhard_policy() -> dict:
    try:
        return admin_service.get_webhard_policy()
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/admin/webhard-policies")
def update_admin_webhard_policy(payload: WebhardPolicyUpdatePayload) -> dict:
    try:
        return admin_service.update_webhard_policy(payload.model_dump(exclude_none=True))
    except (AdminNotFoundError, AdminValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, AdminNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/mail-templates")
def list_admin_mail_templates() -> list[dict]:
    return admin_service.list_mail_templates()


@router.post("/api/v1/admin/mail-templates")
def create_admin_mail_template(payload: MailTemplatePayload) -> dict:
    return admin_service.create_mail_template(payload.model_dump(exclude_none=True))


@router.get("/api/v1/admin/mail-templates/{template_id}")
def get_admin_mail_template(template_id: str) -> dict:
    try:
        return admin_service.get_mail_template(template_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/admin/mail-templates/{template_id}")
def update_admin_mail_template(template_id: str, payload: MailTemplateUpdatePayload) -> dict:
    try:
        return admin_service.update_mail_template(template_id, payload.model_dump(exclude_none=True))
    except (MailboxNotFoundError, MailboxValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, MailboxNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/approval-templates")
def list_admin_approval_templates() -> list[dict]:
    return admin_service.list_approval_templates()


@router.post("/api/v1/admin/approval-templates")
def create_admin_approval_template(payload: ApprovalTemplatePayload) -> dict:
    return admin_service.create_approval_template(payload.model_dump(exclude_none=True))


@router.get("/api/v1/admin/approval-templates/{template_id}")
def get_admin_approval_template(template_id: str) -> dict:
    try:
        return admin_service.get_approval_template(template_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/admin/approval-templates/{template_id}")
def update_admin_approval_template(template_id: str, payload: ApprovalTemplateUpdatePayload) -> dict:
    try:
        return admin_service.update_approval_template(template_id, payload.model_dump(exclude_none=True))
    except (ApprovalNotFoundError, ApprovalValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, ApprovalNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/signature-assets")
def list_admin_signature_assets() -> list[dict]:
    return admin_service.list_signature_assets()


@router.post("/api/v1/admin/signature-assets")
def create_admin_signature_asset(payload: SignatureAssetPayload) -> dict:
    return admin_service.create_signature_asset(payload.model_dump(exclude_none=True))


@router.get("/api/v1/admin/signature-assets/{asset_id}")
def get_admin_signature_asset(asset_id: str) -> dict:
    try:
        return admin_service.get_signature_asset(asset_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/admin/signature-assets/{asset_id}")
def update_admin_signature_asset(asset_id: str, payload: SignatureAssetUpdatePayload) -> dict:
    try:
        return admin_service.update_signature_asset(asset_id, payload.model_dump(exclude_none=True))
    except (ApprovalNotFoundError, ApprovalValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, ApprovalNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/admin/audit-logs")
def list_admin_audit_logs(targetType: str | None = None) -> list[dict]:
    return admin_service.list_audit_logs(targetType)


@router.get("/api/v1/admin/audit-logs/{audit_log_id}")
def get_admin_audit_log(audit_log_id: str) -> dict:
    try:
        return admin_service.get_audit_log(audit_log_id)
    except AdminNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects")
def list_projects() -> list[dict]:
    return project_service.list_projects()


@router.post("/api/v1/projects")
def create_project(payload: ProjectCreatePayload) -> dict:
    try:
        return project_service.create_project(payload.model_dump())
    except ProjectValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}")
def get_project(project_id: str) -> dict:
    try:
        return project_service.get_project(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/projects/{project_id}")
def update_project(project_id: str, payload: ProjectUpdatePayload) -> dict:
    try:
        return project_service.update_project(
            project_id,
            payload.model_dump(exclude_none=True),
        )
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ProjectValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/projects/{project_id}")
def delete_project(project_id: str) -> dict:
    try:
        return project_service.delete_project(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/summary")
def get_project_summary(project_id: str) -> dict:
    try:
        return project_service.get_project_summary(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/requirements")
def get_project_requirements(project_id: str) -> dict:
    try:
        return project_service.get_project_requirements(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/related-counts")
def get_project_related_counts(project_id: str) -> dict:
    try:
        return project_service.get_related_counts(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/history")
def get_project_history(project_id: str) -> list[dict]:
    try:
        return project_service.get_project_history(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/organizations")
def list_organizations() -> list[dict]:
    return project_service.list_organizations()


@router.post("/api/v1/organizations")
def create_organization(payload: OrganizationPayload) -> dict:
    return project_service.create_organization(payload.model_dump())


@router.get("/api/v1/organizations/{organization_id}")
def get_organization(organization_id: str) -> dict:
    try:
        return project_service.get_organization(organization_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/organizations/{organization_id}")
def update_organization(organization_id: str, payload: OrganizationUpdatePayload) -> dict:
    try:
        return project_service.update_organization(
            organization_id,
            payload.model_dump(exclude_none=True),
        )
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/organizations/{organization_id}")
def delete_organization(organization_id: str) -> dict:
    return project_service.delete_organization(organization_id)


@router.get("/api/v1/projects/{project_id}/parties")
def list_project_parties(project_id: str) -> list[dict]:
    try:
        return project_service.list_project_parties(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/parties")
def create_project_party(project_id: str, payload: ProjectPartyPayload) -> dict:
    try:
        return project_service.create_project_party(project_id, payload.model_dump(exclude_none=True))
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/project-parties/{party_id}")
def update_project_party(party_id: str, payload: ProjectPartyUpdatePayload) -> dict:
    try:
        return project_service.update_project_party(party_id, payload.model_dump(exclude_none=True))
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/project-parties/{party_id}")
def delete_project_party(party_id: str) -> dict:
    try:
        return project_service.delete_project_party(party_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/parties/reorder")
def reorder_project_parties(project_id: str, payload: ProjectPartyReorderPayload) -> list[dict]:
    try:
        return project_service.reorder_project_parties(project_id, payload.partyIds)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/parties/calculate-share")
def calculate_project_party_share(
    project_id: str,
    payload: ProjectPartyShareCalculationPayload,
) -> dict:
    try:
        return project_service.calculate_project_party_share(
            project_id,
            [item.model_dump(exclude_none=True) for item in payload.parties],
            payload.totalAmount,
        )
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/contacts")
def list_contacts(project_id: str) -> list[dict]:
    try:
        return project_service.list_contacts(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/contacts")
def create_contact(project_id: str, payload: ContactPayload) -> dict:
    try:
        return project_service.create_contact(project_id, payload.model_dump(exclude_none=True))
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/contacts/{contact_id}")
def update_contact(contact_id: str, payload: ContactUpdatePayload) -> dict:
    try:
        return project_service.update_contact(contact_id, payload.model_dump(exclude_none=True))
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/contacts/{contact_id}")
def delete_contact(contact_id: str) -> dict:
    try:
        return project_service.delete_contact(contact_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/contacts/set-primary")
def set_primary_contact(project_id: str, payload: SetPrimaryContactPayload) -> list[dict]:
    try:
        return project_service.set_primary_contact(project_id, payload.contactId)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/extract-from-document")
def extract_project_from_document(payload: ExtractProjectPayload) -> dict:
    return project_service.extract_from_document(payload.sourceText)


@router.post("/api/v1/projects/{project_id}/validate-extracted-info")
def validate_extracted_info(project_id: str, payload: ValidateExtractedInfoPayload) -> dict:
    try:
        return project_service.validate_extracted_info(project_id, payload.model_dump())
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/apply-extracted-info")
def apply_extracted_info(project_id: str, payload: ApplyExtractedInfoPayload) -> dict:
    try:
        return project_service.apply_extracted_info(project_id, payload.model_dump())
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/contracts")
def list_contracts(project_id: str) -> list[dict]:
    try:
        return contract_service.list_contracts(project_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/contracts")
def create_contract(project_id: str, payload: ContractCreatePayload) -> dict:
    try:
        return contract_service.create_contract(project_id, payload.model_dump(exclude_none=True))
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/contracts/{contract_id}")
def get_contract(contract_id: str) -> dict:
    try:
        return contract_service.get_contract(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/contracts/{contract_id}")
def update_contract(contract_id: str, payload: ContractUpdatePayload) -> dict:
    try:
        return contract_service.update_contract(contract_id, payload.model_dump(exclude_none=True))
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/contracts/{contract_id}")
def delete_contract(contract_id: str) -> dict:
    try:
        return contract_service.delete_contract(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/generate")
def generate_contract(contract_id: str) -> dict:
    try:
        return contract_service.generate_contract(contract_id)
    except (ContractNotFoundError, ContractValidationError) as error:
        raise HTTPException(status_code=400 if isinstance(error, ContractValidationError) else 404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/preview")
def preview_contract(contract_id: str) -> dict:
    try:
        return contract_service.preview_contract(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/export")
def export_contract(contract_id: str) -> dict:
    try:
        return contract_service.export_contract(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/mark-sent")
def mark_contract_sent(contract_id: str) -> dict:
    try:
        return contract_service.mark_contract_sent(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/mark-signed")
def mark_contract_signed(contract_id: str) -> dict:
    try:
        return contract_service.mark_contract_signed(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/contracts/{contract_id}/parties")
def list_contract_parties(contract_id: str) -> list[dict]:
    try:
        return contract_service.list_contract_parties(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/parties")
def create_contract_party(contract_id: str, payload: ContractPartyPayload) -> dict:
    try:
        return contract_service.create_contract_party(contract_id, payload.model_dump(exclude_none=True))
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/contract-parties/{contract_party_id}")
def update_contract_party(contract_party_id: str, payload: ContractPartyUpdatePayload) -> dict:
    try:
        return contract_service.update_contract_party(contract_party_id, payload.model_dump(exclude_none=True))
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/contract-parties/{contract_party_id}")
def delete_contract_party(contract_party_id: str) -> dict:
    try:
        return contract_service.delete_contract_party(contract_party_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/parties/apply-project-parties")
def apply_project_parties(contract_id: str) -> list[dict]:
    try:
        return contract_service.apply_project_parties(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/contracts/{contract_id}/payment-terms")
def list_payment_terms(contract_id: str) -> list[dict]:
    try:
        return contract_service.list_payment_terms(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/payment-terms")
def create_payment_term(contract_id: str, payload: PaymentTermPayload) -> dict:
    try:
        return contract_service.create_payment_term(contract_id, payload.model_dump(exclude_none=True))
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/payment-terms/{payment_term_id}")
def update_payment_term(payment_term_id: str, payload: PaymentTermUpdatePayload) -> dict:
    try:
        return contract_service.update_payment_term(payment_term_id, payload.model_dump(exclude_none=True))
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/payment-terms/{payment_term_id}")
def delete_payment_term(payment_term_id: str) -> dict:
    try:
        return contract_service.delete_payment_term(payment_term_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/payment-terms/calculate-split")
def calculate_payment_split(contract_id: str, payload: PaymentSplitCalculationPayload) -> dict:
    try:
        return contract_service.calculate_payment_split(contract_id, payload.model_dump())
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/estimates")
def list_estimates(project_id: str) -> list[dict]:
    try:
        return contract_service.list_estimates(project_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/estimates")
def create_estimate(project_id: str, payload: EstimateCreatePayload) -> dict:
    try:
        return contract_service.create_estimate(project_id, payload.model_dump(exclude_none=True))
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/estimates/{estimate_id}")
def get_estimate(estimate_id: str) -> dict:
    try:
        return contract_service.get_estimate(estimate_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/estimates/{estimate_id}")
def update_estimate(estimate_id: str, payload: EstimateUpdatePayload) -> dict:
    try:
        return contract_service.update_estimate(estimate_id, payload.model_dump(exclude_none=True))
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/estimates/{estimate_id}")
def delete_estimate(estimate_id: str) -> dict:
    try:
        return contract_service.delete_estimate(estimate_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/estimates/{estimate_id}/generate")
def generate_estimate(estimate_id: str) -> dict:
    try:
        return contract_service.generate_estimate(estimate_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/estimates/{estimate_id}/export")
def export_estimate(estimate_id: str) -> dict:
    try:
        return contract_service.export_estimate(estimate_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContractValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/estimates/{estimate_id}/convert-to-contract")
def convert_estimate_to_contract(estimate_id: str) -> dict:
    try:
        return contract_service.convert_estimate_to_contract(estimate_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/files/upload")
def upload_contract_file(contract_id: str, payload: ContractFileUploadPayload) -> dict:
    try:
        return contract_service.upload_contract_file(contract_id, payload.model_dump(exclude_none=True))
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/contracts/{contract_id}/files")
def list_contract_files(contract_id: str) -> list[dict]:
    try:
        return contract_service.list_contract_files(contract_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/files/{file_id}/set-final")
def set_final_contract_file(contract_id: str, file_id: str) -> dict:
    try:
        return contract_service.set_final_contract_file(contract_id, file_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/files/{file_id}/set-signed")
def set_signed_contract_file(contract_id: str, file_id: str) -> dict:
    try:
        return contract_service.set_signed_contract_file(contract_id, file_id)
    except ContractNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/inspection-schedules")
def list_inspection_schedules(project_id: str) -> list[dict]:
    try:
        return inspection_service.list_schedules(project_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/inspection-schedules")
def create_inspection_schedule(project_id: str, payload: InspectionSchedulePayload) -> dict:
    try:
        return inspection_service.create_schedule(project_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/inspection-schedules/{schedule_id}")
def get_inspection_schedule(schedule_id: str) -> dict:
    try:
        return inspection_service.get_schedule(schedule_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/inspection-schedules/{schedule_id}")
def update_inspection_schedule(schedule_id: str, payload: InspectionScheduleUpdatePayload) -> dict:
    try:
        return inspection_service.update_schedule(schedule_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/inspection-schedules/{schedule_id}")
def delete_inspection_schedule(schedule_id: str) -> dict:
    try:
        return inspection_service.delete_schedule(schedule_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/inspection-schedules/preview")
def preview_inspection_schedule(project_id: str, payload: InspectionSchedulePreviewPayload) -> dict:
    try:
        return inspection_service.preview_schedule(project_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/inspection-schedules/generate")
def generate_inspection_schedule(project_id: str, payload: InspectionSchedulePreviewPayload) -> dict:
    try:
        return inspection_service.generate_schedule(project_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/inspection-rounds")
def list_inspection_rounds(project_id: str) -> list[dict]:
    try:
        return inspection_service.list_rounds(project_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/inspection-rounds")
def create_inspection_round(project_id: str, payload: InspectionRoundPayload) -> dict:
    try:
        return inspection_service.create_round(project_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}")
def get_inspection_round(inspection_round_id: str) -> dict:
    try:
        return inspection_service.get_round(inspection_round_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/inspection-rounds/{inspection_round_id}")
def update_inspection_round(inspection_round_id: str, payload: InspectionRoundUpdatePayload) -> dict:
    try:
        return inspection_service.update_round(inspection_round_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/inspection-rounds/{inspection_round_id}")
def delete_inspection_round(inspection_round_id: str) -> dict:
    try:
        return inspection_service.delete_round(inspection_round_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/confirm-date")
def confirm_inspection_round_date(inspection_round_id: str, payload: InspectionRoundConfirmDatePayload) -> dict:
    try:
        return inspection_service.confirm_round_date(inspection_round_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/reschedule")
def reschedule_inspection_round(inspection_round_id: str, payload: InspectionRoundReschedulePayload) -> dict:
    try:
        return inspection_service.reschedule_round(inspection_round_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/close")
def close_inspection_round(inspection_round_id: str) -> dict:
    try:
        return inspection_service.close_round(inspection_round_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}/owner-report-tasks")
def list_owner_report_tasks(inspection_round_id: str) -> list[dict]:
    try:
        return inspection_service.list_owner_report_tasks(inspection_round_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/owner-report-tasks/generate")
def generate_owner_report_tasks(inspection_round_id: str) -> dict:
    try:
        return inspection_service.generate_owner_report_tasks(inspection_round_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/owner-report-tasks/{task_id}")
def update_owner_report_task(task_id: str, payload: InspectionOwnerReportTaskUpdatePayload) -> dict:
    try:
        return inspection_service.update_owner_report_task(task_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/owner-report-tasks/{task_id}/link-document")
def link_owner_report_document(task_id: str, payload: InspectionOwnerReportTaskLinkDocumentPayload) -> dict:
    try:
        return inspection_service.link_document(task_id, payload.documentInstanceId)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/owner-report-tasks/{task_id}/mark-exported")
def mark_owner_report_exported(task_id: str, payload: InspectionOwnerReportTaskMarkExportedPayload) -> dict:
    try:
        return inspection_service.mark_exported(task_id, payload.exportedFileId)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/owner-report-tasks/{task_id}/mark-submitted")
def mark_owner_report_submitted(task_id: str, payload: InspectionOwnerReportTaskMarkSubmittedPayload) -> dict:
    try:
        return inspection_service.mark_submitted(
            task_id,
            payload.submittedAt,
            payload.mailThreadId,
            payload.submissionId,
        )
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InspectionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}/tasks")
def list_inspection_tasks(inspection_round_id: str) -> list[dict]:
    try:
        return inspection_service.list_tasks(inspection_round_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/tasks")
def create_inspection_task(inspection_round_id: str, payload: InspectionTaskPayload) -> dict:
    try:
        return inspection_service.create_task(inspection_round_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/inspection-tasks/{task_id}")
def update_inspection_task(task_id: str, payload: InspectionTaskUpdatePayload) -> dict:
    try:
        return inspection_service.update_task(task_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/tasks/generate-defaults")
def generate_default_inspection_tasks(inspection_round_id: str) -> dict:
    try:
        return inspection_service.generate_default_tasks(inspection_round_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}/attachments")
def list_work_schedule_attachments(inspection_round_id: str) -> list[dict]:
    try:
        return inspection_service.list_attachments(inspection_round_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/attachments")
def create_work_schedule_attachment(inspection_round_id: str, payload: WorkScheduleAttachmentPayload) -> dict:
    try:
        return inspection_service.create_attachment(inspection_round_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/work-schedule-attachments/{attachment_id}")
def update_work_schedule_attachment(attachment_id: str, payload: WorkScheduleAttachmentUpdatePayload) -> dict:
    try:
        return inspection_service.update_attachment(attachment_id, payload.model_dump(exclude_none=True))
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/work-schedule-attachments/{attachment_id}")
def delete_work_schedule_attachment(attachment_id: str) -> dict:
    try:
        return inspection_service.delete_attachment(attachment_id)
    except InspectionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/calendar/inspection-rounds")
def get_calendar_inspection_rounds(date_from: str | None = None, date_to: str | None = None) -> dict:
    return inspection_service.get_calendar_rounds(date_from, date_to)


@router.get("/api/v1/calendar/inspection-tasks")
def get_calendar_inspection_tasks(date_from: str | None = None, date_to: str | None = None) -> dict:
    return inspection_service.get_calendar_tasks(date_from, date_to)


@router.get("/api/v1/checklist-templates")
def list_checklist_templates() -> list[dict]:
    return checklist_service.list_templates()


@router.post("/api/v1/checklist-templates")
def create_checklist_template(payload: ChecklistTemplatePayload) -> dict:
    try:
        return checklist_service.create_template(payload.model_dump(exclude_none=True))
    except ChecklistValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/checklist-templates/{template_id}")
def get_checklist_template(template_id: str) -> dict:
    try:
        return checklist_service.get_template(template_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/checklist-templates/{template_id}")
def update_checklist_template(template_id: str, payload: ChecklistTemplateUpdatePayload) -> dict:
    try:
        return checklist_service.update_template(template_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/checklist-templates/{template_id}")
def delete_checklist_template(template_id: str) -> dict:
    try:
        return checklist_service.delete_template(template_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-templates/{template_id}/publish")
def publish_checklist_template(template_id: str) -> dict:
    try:
        return checklist_service.publish_template(template_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-templates/{template_id}/clone")
def clone_checklist_template(template_id: str) -> dict:
    try:
        return checklist_service.clone_template(template_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/checklist-templates/{template_id}/items")
def list_checklist_template_items(template_id: str) -> list[dict]:
    try:
        return checklist_service.list_template_items(template_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-templates/{template_id}/items")
def create_checklist_template_item(template_id: str, payload: ChecklistItemPayload) -> dict:
    try:
        return checklist_service.create_template_item(template_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/checklist-items/{item_id}")
def update_checklist_item(item_id: str, payload: ChecklistItemUpdatePayload) -> dict:
    try:
        return checklist_service.update_template_item(item_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/checklist-items/{item_id}")
def delete_checklist_item(item_id: str) -> dict:
    try:
        return checklist_service.delete_template_item(item_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-templates/{template_id}/items/reorder")
def reorder_checklist_items(template_id: str, payload: ChecklistItemsReorderPayload) -> list[dict]:
    try:
        return checklist_service.reorder_template_items(template_id, payload.itemIds)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}/checklist-sessions")
def list_checklist_sessions(inspection_round_id: str) -> list[dict]:
    try:
        return checklist_service.list_sessions(inspection_round_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/checklist-sessions")
def create_checklist_session(inspection_round_id: str, payload: ChecklistSessionPayload) -> dict:
    try:
        return checklist_service.create_session(inspection_round_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ChecklistValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/checklist-sessions/{session_id}")
def get_checklist_session(session_id: str) -> dict:
    try:
        return checklist_service.get_session(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/checklist-sessions/{session_id}")
def update_checklist_session(session_id: str, payload: ChecklistSessionUpdatePayload) -> dict:
    try:
        return checklist_service.update_session(session_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ChecklistValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/start")
def start_checklist_session(session_id: str) -> dict:
    try:
        return checklist_service.start_session(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/pause")
def pause_checklist_session(session_id: str) -> dict:
    try:
        return checklist_service.pause_session(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/complete")
def complete_checklist_session(session_id: str) -> dict:
    try:
        return checklist_service.complete_session(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ChecklistValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/review")
def review_checklist_session(session_id: str) -> dict:
    try:
        return checklist_service.review_session(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/lock")
def lock_checklist_session(session_id: str) -> dict:
    try:
        return checklist_service.lock_session(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/checklist-sessions/{session_id}/results")
def list_checklist_results(session_id: str) -> list[dict]:
    try:
        return checklist_service.list_results(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/results")
def create_checklist_result(session_id: str, payload: ChecklistResultPayload) -> dict:
    try:
        return checklist_service.create_result(session_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ChecklistValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/checklist-results/{result_id}")
def update_checklist_result(result_id: str, payload: ChecklistResultUpdatePayload) -> dict:
    try:
        return checklist_service.update_result(result_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ChecklistValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/results/bulk-save")
def bulk_save_checklist_results(session_id: str, payload: ChecklistBulkSavePayload) -> dict:
    try:
        return checklist_service.bulk_save_results(
            session_id,
            [item.model_dump(exclude_none=True) for item in payload.rows],
        )
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ChecklistValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/results/fill-not-applicable")
def fill_checklist_results_not_applicable(
    session_id: str,
    payload: ChecklistFillNotApplicablePayload,
) -> dict:
    try:
        return checklist_service.fill_not_applicable(session_id, payload.reason)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ChecklistValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/results/validate")
def validate_checklist_results(session_id: str) -> dict:
    try:
        return checklist_service.validate_results(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/checklist-sessions/{session_id}/finding-candidates")
def list_checklist_finding_candidates(session_id: str) -> list[dict]:
    try:
        return checklist_service.list_finding_candidates(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-results/{result_id}/finding-candidate")
def create_checklist_finding_candidate(result_id: str, payload: FindingCandidateCreatePayload) -> dict:
    try:
        return checklist_service.create_finding_candidate(result_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/finding-candidates/{candidate_id}/accept")
def accept_checklist_finding_candidate(candidate_id: str) -> dict:
    try:
        return checklist_service.accept_candidate(candidate_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/finding-candidates/{candidate_id}/dismiss")
def dismiss_checklist_finding_candidate(candidate_id: str, payload: FindingCandidateDismissPayload) -> dict:
    try:
        return checklist_service.dismiss_candidate(candidate_id, payload.dismissedReason)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/finding-candidates/{candidate_id}/convert-to-finding")
def convert_checklist_finding_candidate(candidate_id: str) -> dict:
    try:
        return checklist_service.convert_candidate_to_finding(candidate_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/additional-hazards")
def create_checklist_additional_hazard(session_id: str, payload: AdditionalHazardPayload) -> dict:
    try:
        return checklist_service.create_additional_hazard(session_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/additional-hazards/{hazard_id}")
def update_checklist_additional_hazard(hazard_id: str, payload: AdditionalHazardUpdatePayload) -> dict:
    try:
        return checklist_service.update_additional_hazard(hazard_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-results/{result_id}/photos/upload")
def upload_checklist_photo(result_id: str, payload: ChecklistPhotoUploadPayload) -> dict:
    try:
        return checklist_service.upload_photo(result_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/checklist-results/{result_id}/photos")
def list_checklist_photos(result_id: str) -> list[dict]:
    try:
        return checklist_service.list_photos(result_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-results/{result_id}/photos/link")
def link_checklist_photo(result_id: str, payload: ChecklistPhotoLinkPayload) -> dict:
    try:
        return checklist_service.link_photo(result_id, payload.photoId, payload.additionalHazardId)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-photos/{photo_id}/unlink")
def unlink_checklist_photo(photo_id: str) -> dict:
    try:
        return checklist_service.unlink_photo(photo_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/checklist-sessions/{session_id}/report-mapping")
def get_checklist_report_mapping(session_id: str) -> dict:
    try:
        return checklist_service.get_report_mapping(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/summarize")
def summarize_checklist_session(session_id: str) -> dict:
    try:
        return checklist_service.summarize_session(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/sync-to-report")
def sync_checklist_session_to_report(session_id: str) -> dict:
    try:
        return checklist_service.sync_to_report(session_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/mobile-drafts")
def create_checklist_mobile_draft(session_id: str, payload: ChecklistMobileDraftPayload) -> dict:
    try:
        return checklist_service.create_mobile_draft(session_id, payload.model_dump(exclude_none=True))
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/checklist-sessions/{session_id}/mobile-drafts/{draft_id}")
def get_checklist_mobile_draft(session_id: str, draft_id: str) -> dict:
    try:
        return checklist_service.get_mobile_draft(session_id, draft_id)
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/checklist-sessions/{session_id}/mobile-drafts/{draft_id}/commit")
def commit_checklist_mobile_draft(
    session_id: str,
    draft_id: str,
    payload: ChecklistMobileDraftCommitPayload,
) -> dict:
    try:
        return checklist_service.commit_mobile_draft(
            session_id,
            draft_id,
            payload.model_dump(exclude_none=True),
        )
    except ChecklistNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/findings")
def list_project_findings(project_id: str) -> list[dict]:
    try:
        return finding_service.list_project_findings(project_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/findings")
def create_project_finding(project_id: str, payload: FindingPayload) -> dict:
    try:
        return finding_service.create_project_finding(project_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}/findings")
def list_round_findings(inspection_round_id: str) -> list[dict]:
    try:
        return finding_service.list_round_findings(inspection_round_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/findings")
def create_round_finding(inspection_round_id: str, payload: FindingPayload) -> dict:
    try:
        return finding_service.create_round_finding(inspection_round_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/findings/{finding_id}")
def get_finding(finding_id: str) -> dict:
    try:
        return finding_service.get_finding(finding_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/findings/{finding_id}")
def update_finding(finding_id: str, payload: FindingUpdatePayload) -> dict:
    try:
        return finding_service.update_finding(finding_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/findings/{finding_id}")
def delete_finding(finding_id: str) -> dict:
    try:
        return finding_service.delete_finding(finding_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/findings/{finding_id}/request-action")
def request_finding_action(finding_id: str, payload: FindingRequestActionPayload) -> dict:
    try:
        return finding_service.request_action(finding_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/findings/{finding_id}/verify")
def verify_finding(finding_id: str, payload: FindingVerifyPayload) -> dict:
    try:
        return finding_service.verify_finding(finding_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/findings/{finding_id}/reject")
def reject_finding(finding_id: str, payload: FindingRejectPayload) -> dict:
    try:
        return finding_service.reject_finding(finding_id, {"reason": payload.rejectedReason})
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/findings/{finding_id}/close")
def close_finding(finding_id: str) -> dict:
    try:
        return finding_service.close_finding(finding_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/findings/{finding_id}/link-checklist-result")
def link_finding_checklist_result(finding_id: str, payload: FindingLinkChecklistResultPayload) -> dict:
    try:
        return finding_service.link_checklist_result(finding_id, payload.checklistResultId)
    except (FindingNotFoundError, FindingValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, FindingNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/findings/{finding_id}/link-owner")
def link_finding_owner(finding_id: str, payload: FindingLinkOwnerPayload) -> dict:
    try:
        return finding_service.link_owner(finding_id, payload.ownerPartyId)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/findings/{finding_id}/actions")
def list_corrective_actions(finding_id: str) -> list[dict]:
    try:
        return finding_service.list_corrective_actions(finding_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/findings/{finding_id}/actions")
def create_corrective_action(finding_id: str, payload: CorrectiveActionPayload) -> dict:
    try:
        return finding_service.create_corrective_action(finding_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/corrective-actions/{action_id}")
def get_corrective_action(action_id: str) -> dict:
    try:
        return finding_service.get_corrective_action(action_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/corrective-actions/{action_id}")
def update_corrective_action(action_id: str, payload: CorrectiveActionUpdatePayload) -> dict:
    try:
        return finding_service.update_corrective_action(action_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/corrective-actions/{action_id}")
def delete_corrective_action(action_id: str) -> dict:
    try:
        return finding_service.delete_corrective_action(action_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/corrective-actions/{action_id}/submit")
def submit_corrective_action(action_id: str, payload: CorrectiveActionSubmitPayload) -> dict:
    try:
        return finding_service.submit_corrective_action(action_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/corrective-actions/{action_id}/verify")
def verify_corrective_action(action_id: str, payload: CorrectiveActionVerifyPayload) -> dict:
    try:
        return finding_service.verify_corrective_action(action_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/corrective-actions/{action_id}/reject")
def reject_corrective_action(action_id: str, payload: CorrectiveActionRejectPayload) -> dict:
    try:
        return finding_service.reject_corrective_action(action_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/findings/{finding_id}/photos")
def list_finding_photos(finding_id: str) -> list[dict]:
    try:
        return finding_service.list_photos(finding_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/findings/{finding_id}/photos/upload")
def upload_finding_photo(finding_id: str, payload: EvidencePhotoUploadPayload) -> dict:
    try:
        return finding_service.upload_photo(finding_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/findings/{finding_id}/photos/link")
def link_finding_photo(finding_id: str, payload: EvidencePhotoLinkPayload) -> dict:
    try:
        return finding_service.link_photo(finding_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/evidence-photos/{photo_id}")
def update_evidence_photo(photo_id: str, payload: EvidencePhotoUpdatePayload) -> dict:
    try:
        return finding_service.update_photo(photo_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/evidence-photos/{photo_id}")
def delete_evidence_photo(photo_id: str) -> dict:
    try:
        return finding_service.delete_photo(photo_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/evidence-photos/{photo_id}/markup")
def markup_evidence_photo(photo_id: str, payload: PhotoMarkupPayload) -> dict:
    try:
        return finding_service.markup_photo(photo_id, payload.model_dump())
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/evidence-photos/{photo_id}/set-caption")
def set_evidence_photo_caption(photo_id: str, payload: EvidencePhotoCaptionPayload) -> dict:
    try:
        return finding_service.set_photo_caption(photo_id, payload.caption)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/evidence-photos/{photo_id}/set-representative")
def set_representative_evidence_photo(photo_id: str) -> dict:
    try:
        return finding_service.set_photo_representative(photo_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}/photo-ledgers")
def list_photo_ledgers(inspection_round_id: str) -> list[dict]:
    try:
        return finding_service.list_photo_ledgers(inspection_round_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/photo-ledgers")
def create_photo_ledger(inspection_round_id: str, payload: PhotoLedgerPayload) -> dict:
    try:
        return finding_service.create_photo_ledger(inspection_round_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/photo-ledgers/{photo_ledger_id}")
def get_photo_ledger(photo_ledger_id: str) -> dict:
    try:
        return finding_service.get_photo_ledger(photo_ledger_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/photo-ledgers/{photo_ledger_id}")
def update_photo_ledger(photo_ledger_id: str, payload: PhotoLedgerUpdatePayload) -> dict:
    try:
        return finding_service.update_photo_ledger(photo_ledger_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/photo-ledgers/{photo_ledger_id}")
def delete_photo_ledger(photo_ledger_id: str) -> dict:
    try:
        return finding_service.delete_photo_ledger(photo_ledger_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/photo-ledgers/{photo_ledger_id}/generate-entries")
def generate_photo_ledger_entries(photo_ledger_id: str) -> dict:
    try:
        return finding_service.generate_photo_ledger_entries(photo_ledger_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/photo-ledgers/{photo_ledger_id}/entries")
def list_photo_ledger_entries(photo_ledger_id: str) -> list[dict]:
    try:
        return finding_service.list_photo_ledger_entries(photo_ledger_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/photo-ledgers/{photo_ledger_id}/entries")
def create_photo_ledger_entry(photo_ledger_id: str, payload: PhotoLedgerEntryPayload) -> dict:
    try:
        return finding_service.create_photo_ledger_entry(photo_ledger_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/photo-ledger-entries/{entry_id}")
def update_photo_ledger_entry(entry_id: str, payload: PhotoLedgerEntryUpdatePayload) -> dict:
    try:
        return finding_service.update_photo_ledger_entry(entry_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/photo-ledger-entries/{entry_id}")
def delete_photo_ledger_entry(entry_id: str) -> dict:
    try:
        return finding_service.delete_photo_ledger_entry(entry_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/photo-ledgers/{photo_ledger_id}/reorder")
def reorder_photo_ledger_entries(photo_ledger_id: str, payload: PhotoLedgerReorderPayload) -> list[dict]:
    try:
        return finding_service.reorder_photo_ledger_entries(photo_ledger_id, payload.entryIds)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/photo-ledgers/{photo_ledger_id}/validate")
def validate_photo_ledger(photo_ledger_id: str) -> dict:
    try:
        return finding_service.validate_photo_ledger(photo_ledger_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/photo-ledgers/{photo_ledger_id}/export")
def export_photo_ledger(photo_ledger_id: str) -> dict:
    try:
        return finding_service.export_photo_ledger(photo_ledger_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/photo-ledgers/{photo_ledger_id}/sync-to-report")
def sync_photo_ledger_to_report(photo_ledger_id: str, payload: PhotoLedgerSyncPayload) -> dict:
    try:
        return finding_service.sync_photo_ledger_to_report(photo_ledger_id, payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/safety-reports")
def list_project_safety_reports(project_id: str) -> list[dict]:
    try:
        return safety_report_service.list_project_reports(project_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/approvals")
def list_approval_workflows() -> list[dict]:
    return approval_service.list_approvals()


@router.get("/api/v1/approvals/inbox")
def list_approval_inbox() -> list[dict]:
    return approval_service.list_approvals("inbox")


@router.get("/api/v1/approvals/requested")
def list_requested_approvals() -> list[dict]:
    return approval_service.list_approvals("requested")


@router.post("/api/v1/approval-workflows")
def create_approval_workflow(payload: ApprovalWorkflowPayload) -> dict:
    try:
        return approval_service.create_workflow(payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ApprovalValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/approval-workflows/{workflow_id}")
def get_approval_workflow(workflow_id: str) -> dict:
    try:
        return approval_service.get_workflow(workflow_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/approval-workflows/{workflow_id}")
def update_approval_workflow(workflow_id: str, payload: ApprovalWorkflowUpdatePayload) -> dict:
    try:
        return approval_service.update_workflow(workflow_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/approval-workflows/{workflow_id}")
def delete_approval_workflow(workflow_id: str) -> dict:
    try:
        return approval_service.delete_workflow(workflow_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/documents/{document_id}/approval/request")
def request_document_approval(document_id: str, payload: ApprovalRequestPayload) -> dict:
    try:
        return approval_service.request_document_approval(document_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ApprovalValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/documents/{document_id}/approval")
def get_document_approval(document_id: str) -> dict:
    try:
        return approval_service.get_document_approval(document_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/approval-workflows/{workflow_id}/cancel")
def cancel_approval_workflow(workflow_id: str) -> dict:
    try:
        return approval_service.cancel_workflow(workflow_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/approval-workflows/{workflow_id}/restart")
def restart_approval_workflow(workflow_id: str) -> dict:
    try:
        return approval_service.restart_workflow(workflow_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/approval-workflows/{workflow_id}/steps")
def list_approval_steps(workflow_id: str) -> list[dict]:
    try:
        return approval_service.list_steps(workflow_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/approval-workflows/{workflow_id}/steps")
def create_approval_step(workflow_id: str, payload: ApprovalStepPayload) -> dict:
    try:
        return approval_service.create_step(workflow_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/approval-steps/{step_id}")
def update_approval_step(step_id: str, payload: ApprovalStepUpdatePayload) -> dict:
    try:
        return approval_service.update_step(step_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/approval-steps/{step_id}/approve")
def approve_approval_step(step_id: str, payload: ApprovalStepActionPayload) -> dict:
    try:
        return approval_service.approve_step(step_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ApprovalValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/approval-steps/{step_id}/reject")
def reject_approval_step(step_id: str, payload: ApprovalStepActionPayload) -> dict:
    try:
        return approval_service.reject_step(step_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/approval-steps/{step_id}/request-changes")
def request_changes_approval_step(step_id: str, payload: ApprovalStepActionPayload) -> dict:
    try:
        return approval_service.request_changes(step_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/approval-steps/{step_id}/delegate")
def delegate_approval_step(step_id: str, payload: ApprovalStepActionPayload) -> dict:
    try:
        return approval_service.delegate_step(step_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/approval-steps/{step_id}/skip")
def skip_approval_step(step_id: str, payload: ApprovalStepActionPayload) -> dict:
    try:
        return approval_service.skip_step(step_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/signature-assets")
def list_signature_assets() -> list[dict]:
    return approval_service.list_signature_assets()


@router.post("/api/v1/signature-assets")
def create_signature_asset(payload: SignatureAssetPayload) -> dict:
    return approval_service.create_signature_asset(payload.model_dump(exclude_none=True))


@router.get("/api/v1/signature-assets/{asset_id}")
def get_signature_asset(asset_id: str) -> dict:
    try:
        return approval_service.get_signature_asset(asset_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/signature-assets/{asset_id}")
def update_signature_asset(asset_id: str, payload: SignatureAssetUpdatePayload) -> dict:
    try:
        return approval_service.update_signature_asset(asset_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/signature-assets/{asset_id}")
def delete_signature_asset(asset_id: str) -> dict:
    try:
        return approval_service.delete_signature_asset(asset_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/documents/{document_id}/signature-tasks")
def list_document_signature_tasks(document_id: str) -> dict:
    try:
        return approval_service.list_signature_tasks(document_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/documents/{document_id}/signature-tasks")
def create_document_signature_task(document_id: str, payload: SignatureTaskPayload) -> dict:
    try:
        return approval_service.create_signature_task(document_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/signature-tasks/{task_id}")
def update_signature_task(task_id: str, payload: SignatureTaskUpdatePayload) -> dict:
    try:
        return approval_service.update_signature_task(task_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/signature-tasks/{task_id}/complete")
def complete_signature_task(task_id: str, payload: SignatureTaskCompletePayload) -> dict:
    try:
        return approval_service.complete_signature_task(task_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ApprovalValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/signature-tasks/{task_id}/waive")
def waive_signature_task(task_id: str, payload: SignatureTaskWaivePayload) -> dict:
    try:
        return approval_service.waive_signature_task(task_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ApprovalValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/documents/{document_id}/signed-files/upload")
def upload_signed_document_file(document_id: str, payload: SignedFileUploadPayload) -> dict:
    try:
        return approval_service.upload_signed_file(document_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/documents/{document_id}/submission-readiness")
def get_document_submission_readiness(document_id: str) -> dict:
    try:
        return approval_service.get_submission_readiness(document_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/documents/{document_id}/submission-packages")
def create_document_submission_package(document_id: str, payload: SubmissionPackagePayload) -> dict:
    try:
        return approval_service.create_submission_package(document_id, payload.model_dump(exclude_none=True))
    except (ApprovalNotFoundError, ApprovalValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, ApprovalNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/submission-packages/{package_id}")
def get_submission_package(package_id: str) -> dict:
    try:
        return approval_service.get_submission_package(package_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/submission-packages/{package_id}")
def update_submission_package(package_id: str, payload: SubmissionPackageUpdatePayload) -> dict:
    try:
        return approval_service.update_submission_package(package_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/submission-packages/{package_id}/validate")
def validate_submission_package(package_id: str) -> dict:
    try:
        return approval_service.validate_submission_package(package_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/submission-packages/{package_id}/finalize")
def finalize_submission_package(package_id: str) -> dict:
    try:
        return approval_service.finalize_submission_package(package_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ApprovalValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/submissions")
def list_project_submissions(project_id: str) -> list[dict]:
    try:
        return approval_service.list_project_submissions(project_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/submissions")
def create_project_submission(project_id: str, payload: SubmissionCreatePayload) -> dict:
    try:
        return approval_service.create_submission(project_id, payload.model_dump(exclude_none=True))
    except (ApprovalNotFoundError, ApprovalValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, ApprovalNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/submissions/{submission_id}")
def get_submission(submission_id: str) -> dict:
    try:
        return approval_service.get_submission(submission_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/submissions/{submission_id}")
def update_submission(submission_id: str, payload: SubmissionUpdatePayload) -> dict:
    try:
        return approval_service.update_submission(submission_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/submissions/{submission_id}")
def delete_submission(submission_id: str) -> dict:
    try:
        return approval_service.delete_submission(submission_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/submissions/{submission_id}/send-mail")
def send_submission_mail(submission_id: str, payload: SubmissionMailSendPayload) -> dict:
    try:
        return approval_service.send_submission_mail(submission_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ApprovalValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/submissions/{submission_id}/mark-manual-submitted")
def mark_manual_submission(submission_id: str, payload: SubmissionManualSubmitPayload) -> dict:
    try:
        return approval_service.mark_manual_submitted(submission_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ApprovalValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/submissions/{submission_id}/confirm-owner-receipt")
def confirm_submission_receipt(submission_id: str) -> dict:
    try:
        return approval_service.confirm_owner_receipt(submission_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/submissions/{submission_id}/request-revision")
def request_submission_revision(submission_id: str, payload: SubmissionRevisionPayload) -> dict:
    try:
        return approval_service.request_revision(submission_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/submissions/{submission_id}/resubmit")
def resubmit_submission(submission_id: str) -> dict:
    try:
        return approval_service.resubmit(submission_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/submissions/{submission_id}/archive")
def archive_submission(submission_id: str) -> dict:
    try:
        return approval_service.archive_submission(submission_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/approval-templates")
def list_approval_templates() -> list[dict]:
    return approval_service.list_templates()


@router.post("/api/v1/approval-templates")
def create_approval_template(payload: ApprovalTemplatePayload) -> dict:
    return approval_service.create_template(payload.model_dump(exclude_none=True))


@router.get("/api/v1/approval-templates/{template_id}")
def get_approval_template(template_id: str) -> dict:
    try:
        return approval_service.get_template(template_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/approval-templates/{template_id}")
def update_approval_template(template_id: str, payload: ApprovalTemplateUpdatePayload) -> dict:
    try:
        return approval_service.update_template(template_id, payload.model_dump(exclude_none=True))
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/approval-templates/{template_id}")
def delete_approval_template(template_id: str) -> dict:
    try:
        return approval_service.delete_template(template_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/approval-templates/{template_id}/publish")
def publish_approval_template(template_id: str) -> dict:
    try:
        return approval_service.publish_template(template_id)
    except ApprovalNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/safety-management-plans")
def list_project_safety_management_plans(project_id: str) -> list[dict]:
    try:
        return safety_management_plan_service.list_project_plans(project_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/safety-health-ledgers")
def list_project_safety_health_ledgers(project_id: str) -> list[dict]:
    try:
        return safety_health_ledger_service.list_project_ledgers(project_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/safety-health-ledgers")
def create_project_safety_health_ledger(project_id: str, payload: SafetyHealthLedgerCreatePayload) -> dict:
    try:
        body = payload.model_dump(exclude_none=True)
        body["projectId"] = project_id
        return safety_health_ledger_service.create_ledger(body)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/safety-management-plans")
def create_project_safety_management_plan(project_id: str, payload: SafetyManagementPlanCreatePayload) -> dict:
    try:
        body = payload.model_dump(exclude_none=True)
        body["projectId"] = project_id
        return safety_management_plan_service.create_plan(body)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-management-plans/{plan_id}")
def get_safety_management_plan(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.get_plan(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/safety-management-plans/{plan_id}")
def update_safety_management_plan(plan_id: str, payload: SafetyManagementPlanUpdatePayload) -> dict:
    try:
        return safety_management_plan_service.update_plan(plan_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/safety-management-plans/{plan_id}")
def delete_safety_management_plan(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.delete_plan(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-health-ledgers/{ledger_id}")
def get_safety_health_ledger(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.get_ledger(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/safety-health-ledgers/{ledger_id}")
def update_safety_health_ledger(ledger_id: str, payload: SafetyHealthLedgerUpdatePayload) -> dict:
    try:
        return safety_health_ledger_service.update_ledger(ledger_id, payload.model_dump(exclude_none=True))
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/safety-health-ledgers/{ledger_id}")
def delete_safety_health_ledger(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.delete_ledger(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/generate")
def generate_safety_health_ledger(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.generate(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/validate")
def validate_safety_health_ledger(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.validate(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/confirm")
def confirm_safety_health_ledger(ledger_id: str, payload: SafetyHealthLedgerConfirmPayload) -> dict:
    try:
        return safety_health_ledger_service.confirm(ledger_id, payload.confirmedBy)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/export")
def export_safety_health_ledger(ledger_id: str, payload: SafetyHealthLedgerExportPayload) -> dict:
    try:
        return safety_health_ledger_service.export(ledger_id, payload.exportedBy)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/archive")
def archive_safety_health_ledger(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.archive(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-health-ledgers/{ledger_id}/sections")
def list_safety_health_ledger_sections(ledger_id: str) -> list[dict]:
    try:
        return safety_health_ledger_service.list_sections(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/sections/{section_key}/save")
def save_safety_health_ledger_section(
    ledger_id: str,
    section_key: str,
    payload: SafetyHealthLedgerSaveSectionPayload,
) -> dict:
    try:
        return safety_health_ledger_service.save_section(ledger_id, section_key, payload.model_dump(exclude_none=True))
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/sections/{section_key}/regenerate")
def regenerate_safety_health_ledger_section(ledger_id: str, section_key: str) -> dict:
    try:
        return safety_health_ledger_service.regenerate_section(ledger_id, section_key)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-health-ledgers/{ledger_id}/risks")
def list_safety_health_ledger_risks(ledger_id: str) -> list[dict]:
    try:
        return safety_health_ledger_service.list_risk_items(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/risks")
def create_safety_health_ledger_risk(ledger_id: str, payload: LedgerRiskItemPayload) -> dict:
    try:
        return safety_health_ledger_service.create_risk_item(ledger_id, payload.model_dump(exclude_none=True))
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/safety-health-ledger-risks/{risk_item_id}")
def update_safety_health_ledger_risk(risk_item_id: str, payload: LedgerRiskItemUpdatePayload) -> dict:
    try:
        return safety_health_ledger_service.update_risk_item(risk_item_id, payload.model_dump(exclude_none=True))
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/safety-health-ledger-risks/{risk_item_id}")
def delete_safety_health_ledger_risk(risk_item_id: str) -> dict:
    try:
        return safety_health_ledger_service.delete_risk_item(risk_item_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/risks/import-from-plan")
def import_safety_health_ledger_risks_from_plan(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.import_risks_from_plan(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/risks/detect-recurrence")
def detect_safety_health_ledger_recurrence(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.detect_recurrence(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-health-ledgers/{ledger_id}/measures")
def list_safety_health_ledger_measures(ledger_id: str) -> list[dict]:
    try:
        return safety_health_ledger_service.list_measures(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/measures")
def create_safety_health_ledger_measure(ledger_id: str, payload: LedgerMeasurePayload) -> dict:
    try:
        return safety_health_ledger_service.create_measure(ledger_id, payload.model_dump(exclude_none=True))
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/safety-health-ledger-measures/{measure_id}")
def update_safety_health_ledger_measure(measure_id: str, payload: LedgerMeasureUpdatePayload) -> dict:
    try:
        return safety_health_ledger_service.update_measure(measure_id, payload.model_dump(exclude_none=True))
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/safety-health-ledger-measures/{measure_id}")
def delete_safety_health_ledger_measure(measure_id: str) -> dict:
    try:
        return safety_health_ledger_service.delete_measure(measure_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-health-ledgers/{ledger_id}/inspection-history")
def list_safety_health_ledger_inspection_history(ledger_id: str) -> list[dict]:
    try:
        return safety_health_ledger_service.list_inspection_history(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/inspection-history/sync")
def sync_safety_health_ledger_inspection_history(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.sync_inspection_history(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-health-ledgers/{ledger_id}/finding-history")
def list_safety_health_ledger_finding_history(ledger_id: str) -> list[dict]:
    try:
        return safety_health_ledger_service.list_finding_history(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/finding-history/sync")
def sync_safety_health_ledger_finding_history(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.sync_finding_history(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-health-ledgers/{ledger_id}/safety-cost-history")
def list_safety_health_ledger_safety_cost_history(ledger_id: str) -> list[dict]:
    try:
        return safety_health_ledger_service.list_safety_cost_history(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/safety-cost-history/sync")
def sync_safety_health_ledger_safety_cost_history(ledger_id: str) -> dict:
    try:
        return safety_health_ledger_service.sync_safety_cost_history(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-health-ledgers/{ledger_id}/attachments")
def list_safety_health_ledger_attachments(ledger_id: str) -> list[dict]:
    try:
        return safety_health_ledger_service.list_attachments(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/attachments")
def link_safety_health_ledger_attachment(ledger_id: str, payload: LedgerAttachmentLinkPayload) -> dict:
    try:
        return safety_health_ledger_service.link_attachment(ledger_id, payload.model_dump(exclude_none=True))
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/safety-health-ledger-attachments/{attachment_id}")
def delete_safety_health_ledger_attachment(attachment_id: str) -> dict:
    try:
        return safety_health_ledger_service.delete_attachment(attachment_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-health-ledgers/{ledger_id}/versions")
def list_safety_health_ledger_versions(ledger_id: str) -> list[dict]:
    try:
        return safety_health_ledger_service.list_versions(ledger_id)
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-health-ledgers/{ledger_id}/versions")
def create_safety_health_ledger_version(ledger_id: str, payload: SafetyHealthLedgerVersionPayload) -> dict:
    try:
        return safety_health_ledger_service.create_version(ledger_id, payload.model_dump(exclude_none=True))
    except SafetyHealthLedgerNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyHealthLedgerValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/generate")
def generate_safety_management_plan(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.generate(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/validate")
def validate_safety_management_plan(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.validate(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/save-section")
def save_safety_management_plan_section(plan_id: str, payload: SafetyManagementPlanSaveSectionPayload) -> dict:
    try:
        return safety_management_plan_service.save_section(plan_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/sections/{section_key}/regenerate")
def regenerate_safety_management_plan_section(plan_id: str, section_key: str) -> dict:
    try:
        return safety_management_plan_service.regenerate_section(plan_id, section_key)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/confirm")
def confirm_safety_management_plan(plan_id: str, payload: SafetyManagementPlanConfirmPayload) -> dict:
    try:
        return safety_management_plan_service.confirm(plan_id, payload.confirmedBy)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/export")
def export_safety_management_plan(plan_id: str, payload: SafetyManagementPlanExportPayload) -> dict:
    try:
        return safety_management_plan_service.export(plan_id, payload.exportedBy)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/refresh-linked-data")
def refresh_safety_management_plan_linked_data(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.refresh_linked_data(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-management-plans/{plan_id}/work-types")
def list_safety_management_work_types(plan_id: str) -> list[dict]:
    try:
        return safety_management_plan_service.list_work_types(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/work-types")
def create_safety_management_work_type(plan_id: str, payload: SafetyManagementWorkTypePayload) -> dict:
    try:
        return safety_management_plan_service.create_work_type(plan_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/safety-management-work-types/{work_type_id}")
def update_safety_management_work_type(work_type_id: str, payload: SafetyManagementWorkTypeUpdatePayload) -> dict:
    try:
        return safety_management_plan_service.update_work_type(work_type_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/safety-management-work-types/{work_type_id}")
def delete_safety_management_work_type(work_type_id: str) -> dict:
    try:
        return safety_management_plan_service.delete_work_type(work_type_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-management-plans/{plan_id}/risks")
def list_safety_management_risks(plan_id: str) -> list[dict]:
    try:
        return safety_management_plan_service.list_risk_items(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/risks")
def create_safety_management_risk(plan_id: str, payload: SafetyManagementRiskItemPayload) -> dict:
    try:
        return safety_management_plan_service.create_risk_item(plan_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/safety-management-risks/{risk_item_id}")
def update_safety_management_risk(risk_item_id: str, payload: SafetyManagementRiskItemUpdatePayload) -> dict:
    try:
        return safety_management_plan_service.update_risk_item(risk_item_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/safety-management-risks/{risk_item_id}")
def delete_safety_management_risk(risk_item_id: str) -> dict:
    try:
        return safety_management_plan_service.delete_risk_item(risk_item_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/risks/generate-from-work-types")
def generate_safety_management_risks_from_work_types(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.generate_risks_from_work_types(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/risks/import-from-checklist")
def import_safety_management_risks_from_checklist(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.import_risks_from_checklist(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyManagementPlanValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-management-plans/{plan_id}/organization")
def get_safety_management_plan_organization(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.get_organization(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/safety-management-plans/{plan_id}/organization")
def update_safety_management_plan_organization(plan_id: str, payload: SafetyOrganizationPlanPayload) -> dict:
    try:
        return safety_management_plan_service.update_organization(plan_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-management-plans/{plan_id}/education")
def get_safety_management_plan_education(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.get_education(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/safety-management-plans/{plan_id}/education")
def update_safety_management_plan_education(plan_id: str, payload: SafetyEducationPlanPayload) -> dict:
    try:
        return safety_management_plan_service.update_education(plan_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-management-plans/{plan_id}/emergency")
def get_safety_management_plan_emergency(plan_id: str) -> dict:
    try:
        return safety_management_plan_service.get_emergency(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/safety-management-plans/{plan_id}/emergency")
def update_safety_management_plan_emergency(plan_id: str, payload: SafetyEmergencyPlanPayload) -> dict:
    try:
        return safety_management_plan_service.update_emergency(plan_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-management-plans/{plan_id}/attachments")
def list_safety_management_plan_attachments(plan_id: str) -> list[dict]:
    try:
        return safety_management_plan_service.list_attachments(plan_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-management-plans/{plan_id}/attachments/link")
def link_safety_management_plan_attachment(plan_id: str, payload: SafetyManagementAttachmentLinkPayload) -> dict:
    try:
        return safety_management_plan_service.link_attachment(plan_id, payload.model_dump(exclude_none=True))
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/safety-management-plan-attachments/{attachment_id}")
def delete_safety_management_plan_attachment(attachment_id: str) -> dict:
    try:
        return safety_management_plan_service.delete_attachment(attachment_id)
    except SafetyManagementPlanNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-reports/draft")
def create_safety_report_draft(payload: SafetyReportDraftPayload) -> dict:
    try:
        return safety_report_service.create_draft(payload.model_dump(exclude_none=True))
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-reports/{document_id}")
def get_safety_report(document_id: str) -> dict:
    try:
        return safety_report_service.get_report(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/safety-reports/{document_id}")
def update_safety_report(document_id: str, payload: SafetyReportUpdatePayload) -> dict:
    try:
        return safety_report_service.update_report(document_id, payload.model_dump(exclude_none=True))
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/safety-reports/{document_id}")
def delete_safety_report(document_id: str) -> dict:
    try:
        return safety_report_service.delete_report(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/generate")
def generate_safety_report(document_id: str) -> dict:
    try:
        return safety_report_service.generate(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/validate")
def validate_safety_report(document_id: str) -> dict:
    try:
        return safety_report_service.validate(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/save-section")
def save_safety_report_section(document_id: str, payload: SafetyReportSaveSectionPayload) -> dict:
    try:
        return safety_report_service.save_section(document_id, payload.model_dump(exclude_none=True))
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/sections/{section_key}/regenerate")
def regenerate_safety_report_section(document_id: str, section_key: str) -> dict:
    try:
        return safety_report_service.regenerate_section(document_id, section_key)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/confirm")
def confirm_safety_report(document_id: str, payload: SafetyReportConfirmPayload) -> dict:
    try:
        return safety_report_service.confirm(document_id, payload.confirmedBy)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/export")
def export_safety_report(document_id: str, payload: SafetyReportExportPayload) -> dict:
    try:
        return safety_report_service.export(document_id, payload.exportedBy)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/clone-for-owner")
def clone_safety_report_for_owner(document_id: str, payload: SafetyReportCloneForOwnerPayload) -> dict:
    try:
        return safety_report_service.clone_for_owner(document_id, payload.model_dump(exclude_none=True))
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}/safety-report-required-data")
def get_safety_report_required_data(inspection_round_id: str) -> dict:
    try:
        return safety_report_service.get_required_data(inspection_round_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}/owner-report-branches")
def get_safety_report_owner_report_branches(inspection_round_id: str) -> list[dict]:
    try:
        return safety_report_service.get_owner_report_branches(inspection_round_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-reports/{document_id}/missing-fields")
def get_safety_report_missing_fields(document_id: str) -> list[dict]:
    try:
        return safety_report_service.get_missing_fields(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-reports/{document_id}/variables")
def get_safety_report_variables(document_id: str) -> dict:
    try:
        return safety_report_service.get_variables(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-reports/{document_id}/checklist-results")
def get_safety_report_checklist_results(document_id: str) -> dict:
    try:
        return safety_report_service.get_checklist_results(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-reports/{document_id}/findings")
def get_safety_report_findings(document_id: str) -> dict:
    try:
        return safety_report_service.get_findings(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-reports/{document_id}/photo-ledger")
def get_safety_report_photo_ledger(document_id: str) -> dict:
    try:
        return safety_report_service.get_photo_ledger(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-reports/{document_id}/safety-cost")
def get_safety_report_safety_cost(document_id: str) -> dict:
    try:
        return safety_report_service.get_safety_cost(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/refresh-linked-data")
def refresh_safety_report_linked_data(document_id: str) -> dict:
    try:
        return safety_report_service.refresh_linked_data(document_id)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/link-owner-report-task")
def link_safety_report_owner_task(document_id: str, payload: SafetyReportLinkOwnerTaskPayload) -> dict:
    try:
        return safety_report_service.link_owner_report_task(document_id, payload.ownerReportTaskId)
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-reports/{document_id}/mark-submitted")
def mark_safety_report_submitted(document_id: str, payload: SafetyReportMarkSubmittedPayload) -> dict:
    try:
        return safety_report_service.mark_submitted(
            document_id,
            payload.submittedAt,
            payload.mailThreadId,
            payload.submissionId,
        )
    except SafetyReportNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyReportValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/documents/{document_id}/photo-ledger-section")
def get_document_photo_ledger_section(document_id: str) -> dict:
    try:
        return finding_service.get_document_photo_ledger_section(document_id)
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/findings/action-request-mail/draft")
def draft_action_request_mail(payload: ActionRequestMailDraftPayload) -> dict:
    try:
        return finding_service.draft_action_request_mail(payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FindingValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/findings/action-request-mail/send")
def send_action_request_mail(payload: ActionRequestMailSendPayload) -> dict:
    try:
        return finding_service.send_action_request_mail(payload.model_dump(exclude_none=True))
    except FindingNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/mail/accounts")
def list_mail_accounts() -> list[dict]:
    return mail_service.list_accounts()


@router.post("/api/v1/mail/accounts/guest")
def create_guest_mail_account(payload: MailAccountGuestPayload) -> dict:
    return mail_service.create_guest_account(payload.model_dump(exclude_none=True))


@router.get("/api/v1/mail/accounts/{account_id}")
def get_mail_account(account_id: str) -> dict:
    try:
        return mail_service.get_account(account_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/mail/accounts/{account_id}")
def update_mail_account(account_id: str, payload: MailAccountUpdatePayload) -> dict:
    try:
        return mail_service.update_account(account_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/mail/accounts/{account_id}")
def delete_mail_account(account_id: str) -> dict:
    try:
        return mail_service.delete_account(account_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/oauth/google/start")
def start_google_mail_oauth() -> dict:
    return mail_service.oauth_google_start()


@router.get("/api/v1/mail/oauth/google/callback")
def finish_google_mail_oauth() -> dict:
    return mail_service.oauth_google_callback()


@router.post("/api/v1/mail/accounts/{account_id}/disconnect")
def disconnect_mail_account(account_id: str) -> dict:
    try:
        return mail_service.disconnect_account(account_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/accounts/{account_id}/sync")
def sync_mail_account(account_id: str) -> dict:
    try:
        return mail_service.sync_account(account_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/mail/accounts/{account_id}/sync-jobs")
def list_mail_sync_jobs(account_id: str) -> list[dict]:
    try:
        return mail_service.list_sync_jobs(account_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/mail/threads")
def list_mail_threads(project_id: str | None = None, folder: str | None = None) -> list[dict]:
    return mail_service.list_threads(project_id, folder)


@router.get("/api/v1/mail/threads/{thread_id}")
def get_mail_thread(thread_id: str) -> dict:
    try:
        return mail_service.get_thread(thread_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/mail/threads/{thread_id}")
def update_mail_thread(thread_id: str, payload: MailThreadUpdatePayload) -> dict:
    try:
        return mail_service.update_thread(thread_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/threads/{thread_id}/archive")
def archive_mail_thread(thread_id: str) -> dict:
    try:
        return mail_service.archive_thread(thread_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/mail/messages")
def list_mail_messages(project_id: str | None = None, folder: str | None = None) -> list[dict]:
    return mail_service.list_messages(project_id, folder)


@router.get("/api/v1/mail/messages/{message_id}")
def get_mail_message(message_id: str) -> dict:
    try:
        return mail_service.get_message(message_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/mail/messages/{message_id}")
def update_mail_message(message_id: str, payload: MailMessageUpdatePayload) -> dict:
    try:
        return mail_service.update_message(message_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/messages/{message_id}/mark-read")
def mark_mail_message_read(message_id: str) -> dict:
    try:
        return mail_service.mark_read(message_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/messages/{message_id}/link-entity")
def link_mail_message_entity(message_id: str, payload: MailMessageLinkEntityPayload) -> dict:
    try:
        return mail_service.link_entity(message_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/messages/{message_id}/classify")
def classify_mail_message(message_id: str) -> dict:
    try:
        return mail_service.classify_message(message_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/drafts")
def create_mail_draft(payload: MailDraftPayload) -> dict:
    return mail_service.create_draft(payload.model_dump(exclude_none=True))


@router.get("/api/v1/mail/drafts/{draft_id}")
def get_mail_draft(draft_id: str) -> dict:
    try:
        return mail_service.get_draft(draft_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/mail/drafts/{draft_id}")
def update_mail_draft(draft_id: str, payload: MailDraftUpdatePayload) -> dict:
    try:
        return mail_service.update_draft(draft_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/drafts/{draft_id}/generate")
def generate_mail_draft(draft_id: str, payload: MailDraftGeneratePayload) -> dict:
    try:
        return mail_service.generate_draft(draft_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/drafts/{draft_id}/validate")
def validate_mail_draft(draft_id: str) -> dict:
    try:
        return mail_service.validate_draft(draft_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/drafts/{draft_id}/send")
def send_mail_draft(draft_id: str, payload: MailDraftSendPayload) -> dict:
    try:
        return mail_service.send_draft(draft_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except MailboxValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/mail/send")
def send_mail(payload: MailSendPayload) -> dict:
    try:
        return mail_service.send_mail(payload.model_dump(exclude_none=True))
    except MailboxValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/mail/messages/{message_id}/attachments")
def list_mail_attachments(message_id: str) -> list[dict]:
    try:
        return mail_service.list_attachments(message_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/mail/attachments/{attachment_id}/save-to-webhard")
def save_mail_attachment_directly_to_webhard(attachment_id: str) -> dict:
    try:
        return mail_service.save_attachment_to_webhard(attachment_id)
    except (MailboxNotFoundError, MailboxValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, MailboxNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/mail/attachments/save-bulk-to-webhard")
def save_mail_attachments_bulk_to_webhard(payload: MailAttachmentBulkSavePayload) -> dict:
    try:
        return mail_service.save_bulk_attachments_to_webhard(payload.model_dump(exclude_none=True))
    except (MailboxNotFoundError, MailboxValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, MailboxNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/mail/attachments/{attachment_id}/link-file")
def link_mail_attachment_file(attachment_id: str, payload: MailAttachmentLinkFilePayload) -> dict:
    try:
        return mail_service.link_attachment_file(attachment_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/documents/{document_id}/submission-mail/draft")
def create_document_submission_mail_draft(document_id: str, payload: ContextMailDraftPayload) -> dict:
    try:
        return mail_service.create_submission_mail_draft(document_id, payload.model_dump(exclude_none=True))
    except (MailboxNotFoundError, MailboxValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, MailboxNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/material-request-mail/draft")
def create_project_material_request_mail_draft(project_id: str) -> dict:
    try:
        return mail_service.create_material_request_mail_draft(project_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/schedule-coordination-mail/draft")
def create_schedule_coordination_mail_draft(inspection_round_id: str) -> dict:
    try:
        return mail_service.create_schedule_coordination_mail_draft(inspection_round_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/contracts/{contract_id}/send-mail/draft")
def create_contract_send_mail_draft(contract_id: str) -> dict:
    try:
        return mail_service.create_contract_mail_draft(contract_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/estimates/{estimate_id}/send-mail/draft")
def create_estimate_send_mail_draft(estimate_id: str) -> dict:
    try:
        return mail_service.create_estimate_mail_draft(estimate_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/mail/templates")
def list_mail_templates() -> list[dict]:
    return mail_service.list_templates()


@router.post("/api/v1/mail/templates")
def create_mail_template(payload: MailTemplatePayload) -> dict:
    return mail_service.create_template(payload.model_dump(exclude_none=True))


@router.get("/api/v1/mail/templates/{template_id}")
def get_mail_template(template_id: str) -> dict:
    try:
        return mail_service.get_template(template_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/mail/templates/{template_id}")
def update_mail_template(template_id: str, payload: MailTemplateUpdatePayload) -> dict:
    try:
        return mail_service.update_template(template_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/mail/templates/{template_id}")
def delete_mail_template(template_id: str) -> dict:
    try:
        return mail_service.delete_template(template_id)
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/mail/signatures")
def list_mail_signatures() -> list[dict]:
    return mail_service.list_signatures()


@router.post("/api/v1/mail/signatures")
def create_mail_signature(payload: MailSignaturePayload) -> dict:
    return mail_service.create_signature(payload.model_dump(exclude_none=True))


@router.patch("/api/v1/mail/signatures/{signature_id}")
def update_mail_signature(signature_id: str, payload: MailSignatureUpdatePayload) -> dict:
    try:
        return mail_service.update_signature(signature_id, payload.model_dump(exclude_none=True))
    except MailboxNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/safety-cost-usages")
def list_project_safety_cost_usages(project_id: str) -> list[dict]:
    try:
        return safety_cost_service.list_project_usages(project_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/safety-cost-usages/owner-matrix")
def get_project_safety_cost_owner_matrix(project_id: str) -> dict:
    try:
        return safety_cost_service.owner_matrix(project_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/inspection-rounds/{inspection_round_id}/safety-cost-usages")
def list_round_safety_cost_usages(inspection_round_id: str) -> list[dict]:
    try:
        return safety_cost_service.list_round_usages(inspection_round_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/inspection-rounds/{inspection_round_id}/safety-cost-usages")
def create_round_safety_cost_usage(inspection_round_id: str, payload: SafetyCostUsagePayload) -> dict:
    try:
        return safety_cost_service.create_usage(inspection_round_id, payload.model_dump(exclude_none=True))
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-cost-usages/{usage_id}")
def get_safety_cost_usage(usage_id: str) -> dict:
    try:
        return safety_cost_service.get_usage(usage_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/safety-cost-usages/{usage_id}")
def update_safety_cost_usage(usage_id: str, payload: SafetyCostUsageUpdatePayload) -> dict:
    try:
        return safety_cost_service.update_usage(usage_id, payload.model_dump(exclude_none=True))
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/safety-cost-usages/{usage_id}")
def delete_safety_cost_usage(usage_id: str) -> dict:
    try:
        return safety_cost_service.delete_usage(usage_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-cost-usages/{usage_id}/calculate-rate")
def calculate_safety_cost_rate(usage_id: str) -> dict:
    try:
        return safety_cost_service.calculate_rate(usage_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-cost-usages/{usage_id}/validate")
def validate_safety_cost_usage(usage_id: str) -> dict:
    try:
        return safety_cost_service.validate(usage_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-cost-usages/{usage_id}/generate-comment")
def generate_safety_cost_comment(usage_id: str) -> dict:
    try:
        return safety_cost_service.generate_comment(usage_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-cost-usages/{usage_id}/review")
def review_safety_cost_usage(usage_id: str, payload: SafetyCostReviewPayload) -> dict:
    try:
        return safety_cost_service.review(usage_id, payload.model_dump(exclude_none=True))
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-cost-usages/{usage_id}/confirm")
def confirm_safety_cost_usage(usage_id: str, payload: SafetyCostConfirmPayload) -> dict:
    try:
        return safety_cost_service.confirm(usage_id, payload.model_dump(exclude_none=True))
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-cost-usages/{usage_id}/sync-to-report")
def sync_safety_cost_usage_to_report(usage_id: str, payload: SafetyCostSyncPayload) -> dict:
    try:
        return safety_cost_service.sync_to_report(usage_id, payload.documentId)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/safety-cost-usages/{usage_id}/evidence")
def list_safety_cost_evidence(usage_id: str) -> list[dict]:
    try:
        return safety_cost_service.list_evidence(usage_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/safety-cost-usages/{usage_id}/evidence/upload")
def upload_safety_cost_evidence(usage_id: str, payload: SafetyCostEvidenceUploadPayload) -> dict:
    try:
        return safety_cost_service.upload_evidence(usage_id, payload.model_dump(exclude_none=True))
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/safety-cost-usages/{usage_id}/evidence/link-file")
def link_safety_cost_evidence_file(usage_id: str, payload: SafetyCostEvidenceLinkPayload) -> dict:
    try:
        return safety_cost_service.link_evidence_file(usage_id, payload.model_dump(exclude_none=True))
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/api/v1/safety-cost-evidence/{evidence_id}")
def update_safety_cost_evidence(evidence_id: str, payload: SafetyCostEvidenceUpdatePayload) -> dict:
    try:
        return safety_cost_service.update_evidence(evidence_id, payload.model_dump(exclude_none=True))
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/api/v1/safety-cost-evidence/{evidence_id}")
def delete_safety_cost_evidence(evidence_id: str) -> dict:
    try:
        return safety_cost_service.delete_evidence(evidence_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/safety-cost-usages/{usage_id}/history")
def get_safety_cost_history(usage_id: str) -> list[dict]:
    try:
        return safety_cost_service.get_history(usage_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/documents/{document_id}/safety-cost-usage")
def get_document_safety_cost_usage(document_id: str) -> dict:
    try:
        return safety_cost_service.get_document_safety_cost_usage(document_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/documents/{document_id}/safety-cost-usage/refresh")
def refresh_document_safety_cost_usage(document_id: str) -> dict:
    try:
        return safety_cost_service.refresh_document_safety_cost_usage(document_id)
    except SafetyCostNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SafetyCostValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/folders")
def list_webhard_folders(project_id: str | None = None, parent_folder_id: str | None = None) -> list[dict]:
    try:
        return webhard_service.list_folders(project_id, parent_folder_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/folders")
def create_webhard_folder(payload: FolderPayload) -> dict:
    try:
        return webhard_service.create_folder(payload.model_dump(exclude_none=True))
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except WebhardValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/api/v1/folders/{folder_id}")
def get_webhard_folder(folder_id: str) -> dict:
    try:
        return webhard_service.get_folder(folder_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/folders/{folder_id}")
def update_webhard_folder(folder_id: str, payload: FolderUpdatePayload) -> dict:
    try:
        return webhard_service.update_folder(folder_id, payload.model_dump(exclude_none=True))
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except WebhardValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/api/v1/folders/{folder_id}")
def delete_webhard_folder(folder_id: str, admin_override: bool = False) -> dict:
    try:
        return webhard_service.delete_folder(folder_id, admin_override=admin_override)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except WebhardValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/api/v1/projects/{project_id}/folders/bootstrap")
def bootstrap_webhard_folders(project_id: str) -> dict:
    try:
        return webhard_service.bootstrap_project_folders(project_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/folders/{folder_id}/move")
def move_webhard_folder(folder_id: str, payload: FolderMovePayload) -> dict:
    try:
        return webhard_service.move_folder(folder_id, payload.parentFolderId)
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/projects/{project_id}/folder-tree")
def get_project_folder_tree(project_id: str) -> list[dict]:
    try:
        return webhard_service.get_folder_tree(project_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/files")
def list_webhard_files(
    project_id: str | None = None,
    folder_id: str | None = None,
    status: str | None = None,
    tag: str | None = None,
    linked_entity_type: str | None = None,
    query: str | None = None,
) -> list[dict]:
    try:
        return webhard_service.list_files(project_id, folder_id, status, tag, linked_entity_type, query)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/upload")
def upload_webhard_file(payload: FileUploadPayload) -> dict:
    try:
        return webhard_service.upload_file(payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/files/{file_id}")
def get_webhard_file(file_id: str) -> dict:
    try:
        return webhard_service.get_file_detail(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/files/{file_id}")
def update_webhard_file(file_id: str, payload: FileUpdatePayload) -> dict:
    try:
        return webhard_service.update_file(file_id, payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.delete("/api/v1/files/{file_id}")
def delete_webhard_file(file_id: str, admin_override: bool = False) -> dict:
    try:
        return webhard_service.delete_file(file_id, admin_override=admin_override)
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/restore")
def restore_webhard_file(file_id: str) -> dict:
    try:
        return webhard_service.restore_file(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/archive")
def archive_webhard_file(file_id: str) -> dict:
    try:
        return webhard_service.archive_file(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/lock")
def lock_webhard_file(file_id: str) -> dict:
    try:
        return webhard_service.lock_file(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/unlock")
def unlock_webhard_file(file_id: str) -> dict:
    try:
        return webhard_service.unlock_file(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/move")
def move_webhard_file(file_id: str, payload: FileMovePayload) -> dict:
    try:
        return webhard_service.move_file(file_id, payload.folderId)
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/copy")
def copy_webhard_file(file_id: str, payload: FileCopyPayload) -> dict:
    try:
        return webhard_service.copy_file(file_id, payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/files/{file_id}/download")
def download_webhard_file(file_id: str) -> dict:
    try:
        return webhard_service.get_download(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/files/{file_id}/preview")
def preview_webhard_file(file_id: str) -> dict:
    try:
        return webhard_service.get_preview(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/bulk-action")
def bulk_action_webhard_files(payload: FileBulkActionPayload) -> dict:
    try:
        return webhard_service.bulk_action(payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/files/{file_id}/versions")
def list_webhard_file_versions(file_id: str) -> list[dict]:
    try:
        return webhard_service.list_versions(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/versions")
def add_webhard_file_version(file_id: str, payload: FileVersionPayload) -> dict:
    try:
        return webhard_service.add_version(file_id, payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/file-versions/{version_id}/download")
def download_webhard_file_version(version_id: str) -> dict:
    try:
        return webhard_service.download_version(version_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/file-versions/{version_id}/restore-as-current")
def restore_webhard_file_version(version_id: str) -> dict:
    try:
        return webhard_service.restore_version_as_current(version_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/share-links")
def list_webhard_share_links(project_id: str | None = None) -> list[dict]:
    try:
        return webhard_service.list_share_links(project_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/share-links")
def create_webhard_share_link(payload: ShareLinkPayload) -> dict:
    try:
        return webhard_service.create_share_link(payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/share-links/{share_link_id}")
def get_webhard_share_link(share_link_id: str) -> dict:
    try:
        return webhard_service.get_share_link(share_link_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/api/v1/share-links/{share_link_id}")
def update_webhard_share_link(share_link_id: str, payload: ShareLinkUpdatePayload) -> dict:
    try:
        return webhard_service.update_share_link(share_link_id, payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.delete("/api/v1/share-links/{share_link_id}")
def delete_webhard_share_link(share_link_id: str) -> dict:
    try:
        return webhard_service.delete_share_link(share_link_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/share-links/{share_link_id}/revoke")
def revoke_webhard_share_link(share_link_id: str) -> dict:
    try:
        return webhard_service.revoke_share_link(share_link_id)
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/public/share/{token}")
def get_public_webhard_share(token: str) -> dict:
    try:
        return webhard_service.get_public_share(token)
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/public/share/{token}/download")
def download_public_webhard_share(token: str) -> dict:
    try:
        return webhard_service.download_public_share(token)
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/files/{file_id}/links")
def list_webhard_file_links(file_id: str) -> list[dict]:
    try:
        return webhard_service.list_links(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/links")
def create_webhard_file_link(file_id: str, payload: FileLinkPayload) -> dict:
    try:
        return webhard_service.create_link(file_id, payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.delete("/api/v1/files/{file_id}/links/{link_id}")
def delete_webhard_file_link(file_id: str, link_id: str) -> dict:
    try:
        return webhard_service.delete_link(file_id, link_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/classify")
def classify_webhard_file(file_id: str) -> dict:
    try:
        return webhard_service.classify_file(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/api/v1/files/{file_id}/apply-classification")
def apply_webhard_file_classification(file_id: str, payload: FileClassificationApplyPayload) -> dict:
    try:
        return webhard_service.apply_classification(file_id, payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.post("/api/v1/mail/messages/{message_id}/attachments/save-to-webhard")
def save_mail_attachment_to_webhard(message_id: str, payload: MailAttachmentSavePayload) -> dict:
    try:
        return webhard_service.save_mail_attachment(message_id, payload.model_dump(exclude_none=True))
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/mail/messages/{message_id}/attachments/save-suggestions")
def get_mail_attachment_save_suggestions(message_id: str, project_id: str | None = None) -> dict:
    try:
        return webhard_service.get_mail_attachment_save_suggestions(message_id, project_id)
    except (WebhardNotFoundError, WebhardValidationError) as error:
        raise HTTPException(status_code=404 if isinstance(error, WebhardNotFoundError) else 400, detail=str(error)) from error


@router.get("/api/v1/files/{file_id}/activities")
def list_webhard_file_activities(file_id: str) -> list[dict]:
    try:
        return webhard_service.list_file_activities(file_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/webhard/activities")
def list_webhard_activities(project_id: str | None = None) -> list[dict]:
    try:
        return webhard_service.list_webhard_activities(project_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/webhard/search")
def search_webhard_files(
    project_id: str | None = None,
    folder_id: str | None = None,
    tag: str | None = None,
    linked_entity_type: str | None = None,
    query: str | None = None,
) -> dict:
    try:
        return webhard_service.search_files(project_id, folder_id, tag, linked_entity_type, query)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/api/v1/webhard/storage-usage")
def get_webhard_storage_usage(project_id: str | None = None) -> dict:
    try:
        return webhard_service.get_storage_usage(project_id)
    except WebhardNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
