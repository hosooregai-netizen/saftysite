from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


def utcnow() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


class User(BaseModel):
    id: str
    email: str
    password: str
    name: str
    auth_provider: Literal["legacy", "google"] = "legacy"
    oauth_subject: str | None = None
    avatar_url: str | None = None
    is_anonymous: bool = False
    phone: str | None = None
    role: Literal["super_admin", "admin", "controller", "field_agent", "client_viewer"] = "admin"
    position: str | None = "책임연구원"
    organization_name: str | None = "대한안전산업연구원"
    is_active: bool = True
    last_login_at: str | None = None
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class Workspace(BaseModel):
    id: str
    name: str
    owner_user_id: str
    created_at: str = Field(default_factory=utcnow)


class Membership(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: Literal["owner", "member"] = "owner"
    created_at: str = Field(default_factory=utcnow)


class CreditLedgerEntry(BaseModel):
    id: str
    workspace_id: str
    type: Literal["grant_free_trial", "purchase", "consume_export", "refund_export_failure"]
    amount: int
    description: str
    report_id: str | None = None
    source_order_id: str | None = None
    source_payment_key: str | None = None
    created_at: str = Field(default_factory=utcnow)


class BillingOrder(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    package_id: Literal["starter-10", "team-30", "agency-100"]
    amount_krw: int
    credits: int
    order_name: str
    status: Literal["pending", "payment_created", "paid", "failed"]
    checkout_url: str | None = None
    payment_key: str | None = None
    approved_at: str | None = None
    credit_granted: bool = False
    credited_at: str | None = None
    approval_payload: dict[str, Any] = Field(default_factory=dict)
    webhook_payload: dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class PhotoAsset(BaseModel):
    id: str
    report_id: str
    category: str
    filename: str
    data_url: str = ""
    location_hint: str = ""
    uploaded_at: str = Field(default_factory=utcnow)


class AiRun(BaseModel):
    id: str
    report_id: str
    status: Literal["queued", "running", "succeeded", "failed"] = "queued"
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class ReportExport(BaseModel):
    id: str
    report_id: str
    format: Literal["pdf", "hwpx"]
    first_charge_applied: bool = False
    created_at: str = Field(default_factory=utcnow)


class ExportDisclaimerAcceptance(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    accepted_by_name: str
    version: str = "technical_guidance_disclaimer_v1"
    accepted_at: str = Field(default_factory=utcnow)


class ReportRecord(BaseModel):
    id: str
    workspace_id: str
    created_by: str
    site_id: str | None = None
    headquarter_id: str | None = None
    status: Literal["draft", "draft_ready", "review_completed", "exported"] = "draft"
    payload: dict[str, Any]
    review_completed: bool = False
    final_export_consumed: bool = False
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ClaimAnonymousRequest(BaseModel):
    anonymous_token: str


class GoogleAuthStartRequest(BaseModel):
    redirect_uri: str


class GoogleAuthCompleteRequest(BaseModel):
    code: str
    redirect_uri: str
    state: str


class AuthResponse(BaseModel):
    token: str
    user: dict[str, Any]


class CreateWorkspaceRequest(BaseModel):
    name: str


class BillingCheckoutRequest(BaseModel):
    workspace_id: str
    package_id: Literal["starter-10", "team-30", "agency-100"]


class BillingConfirmRequest(BaseModel):
    amount: int
    order_id: str
    payment_key: str


class TossWebhookRequest(BaseModel):
    eventType: str | None = None
    createdAt: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)
    orderId: str | None = None
    paymentKey: str | None = None
    status: str | None = None


class CreateReportRequest(BaseModel):
    workspace_id: str
    site_id: str
    site_name: str = ""
    customer_name: str = ""
    visit_date: str
    drafter_name: str
    progress_rate: str = ""
    process_summary: str = ""
    worker_count: str = ""


class UpdateReportRequest(BaseModel):
    payload: dict[str, Any]


class PhotoUploadInput(BaseModel):
    filename: str
    category: str | None = None
    data_url: str
    location_hint: str = ""


class UploadPhotosRequest(BaseModel):
    photos: list[PhotoUploadInput]


class GenerateDraftFromPhotosRequest(BaseModel):
    photo_asset_ids: list[str]


class GuidedPhotoStepUploadRequest(BaseModel):
    photos: list[PhotoUploadInput]


class GuidedPhotoReviewRequest(BaseModel):
    doc3_photo_ids: list[str] = Field(default_factory=list)
    doc7_photo_ids: list[str] = Field(default_factory=list)
    representative_doc3_photo_id: str | None = None
    representative_doc7_photo_id: str | None = None


class GenerateDraftFromGuidedPhotosRequest(BaseModel):
    doc3_photo_ids: list[str]
    doc7_photo_ids: list[str]


class GeneratePhotoObservationsRequest(BaseModel):
    photo_asset_ids: list[str] = Field(default_factory=list)


class ComposeStandardDraftRequest(BaseModel):
    photo_observations: list[dict[str, Any]] = Field(default_factory=list)
    photo_evidence: list[dict[str, Any]] = Field(default_factory=list)


class ReviewCompleteRequest(BaseModel):
    responsibility_confirmed: bool = True


class ExportRequest(BaseModel):
    confirm_reviewed: bool = True
    acknowledge_ai_disclaimer: bool = False
    typed_signature_name: str = ""


class GuestWorkspaceMailboxDraftInput(BaseModel):
    local_id: str = ""
    account_id: str = ""
    subject: str = ""
    body: str = ""
    recipients: list[str] = Field(default_factory=list)
    cc_recipients: list[str] = Field(default_factory=list)
    attachments: list[dict[str, Any]] = Field(default_factory=list)
    headquarter_id: str = ""
    site_id: str = ""
    report_keys: list[str] = Field(default_factory=list)
    saved_at: str | None = None


class GuestWorkspacePhotoAlbumInput(BaseModel):
    local_id: str = ""
    site_id: str = ""
    headquarter_id: str = ""
    round_no: int = 0
    captured_at: str | None = None
    file_name: str = ""
    content_type: str = "application/octet-stream"
    size_bytes: int = 0
    data_url: str = ""
    source_kind: Literal["album_upload"] = "album_upload"


class GuestWorkspaceDriveItemInput(BaseModel):
    local_id: str = ""
    kind: Literal["folder", "file"] = "folder"
    name: str
    parent_local_id: str | None = None
    headquarter_id: str | None = None
    site_id: str | None = None
    file_type: Literal["note", "link", "binary"] | None = None
    text_content: str = ""
    external_url: str = ""
    content_type: str = "application/octet-stream"
    size_bytes: int = 0
    data_url: str = ""
    thumbnail_data_url: str = ""


class GuestWorkspaceDriveShareInput(BaseModel):
    local_id: str = ""
    item_local_id: str = ""
    expires_at: str | None = None
    visibility: Literal["restricted", "anyone_with_link"] = "anyone_with_link"
    role: Literal["viewer", "editor"] = "viewer"


class GuestWorkspaceDirectoryInput(BaseModel):
    headquarters: list[dict[str, Any]] = Field(default_factory=list)
    sites: list[dict[str, Any]] = Field(default_factory=list)


class GuestWorkspaceDriveInput(BaseModel):
    items: list[GuestWorkspaceDriveItemInput] = Field(default_factory=list)
    shares: list[GuestWorkspaceDriveShareInput] = Field(default_factory=list)


class ImportGuestWorkspaceCacheRequest(BaseModel):
    directory: GuestWorkspaceDirectoryInput = Field(default_factory=GuestWorkspaceDirectoryInput)
    mailbox_drafts: list[GuestWorkspaceMailboxDraftInput] = Field(
        default_factory=list,
        alias="mailboxDrafts",
    )
    photo_album: list[GuestWorkspacePhotoAlbumInput] = Field(
        default_factory=list,
        alias="photoAlbum",
    )
    drive: GuestWorkspaceDriveInput = Field(default_factory=GuestWorkspaceDriveInput)

    model_config = {
        "populate_by_name": True,
    }


class WorkspaceMailboxDraft(BaseModel):
    id: str
    workspace_id: str
    source_local_id: str | None = None
    account_id: str = ""
    subject: str = ""
    body: str = ""
    recipients: list[str] = Field(default_factory=list)
    cc_recipients: list[str] = Field(default_factory=list)
    attachments: list[dict[str, Any]] = Field(default_factory=list)
    headquarter_id: str = ""
    site_id: str = ""
    report_keys: list[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class WorkspacePhotoAlbumItem(BaseModel):
    id: str
    workspace_id: str
    source_local_id: str | None = None
    headquarter_id: str = ""
    site_id: str = ""
    round_no: int = 0
    captured_at: str = Field(default_factory=utcnow)
    file_name: str = ""
    content_type: str = "application/octet-stream"
    size_bytes: int = 0
    data_url: str = ""
    source_kind: Literal["album_upload"] = "album_upload"
    uploaded_by_user_id: str = ""
    uploaded_by_name: str = ""
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class DriveItem(BaseModel):
    id: str
    workspace_id: str
    source_local_id: str | None = None
    kind: Literal["folder", "file"] = "folder"
    name: str
    parent_id: str | None = None
    headquarter_id: str | None = None
    site_id: str | None = None
    file_type: Literal["note", "link", "binary"] | None = None
    text_content: str = ""
    external_url: str = ""
    content_type: str = "application/octet-stream"
    size_bytes: int = 0
    data_url: str = ""
    thumbnail_data_url: str = ""
    is_deleted: bool = False
    created_by: str = ""
    owner_user_id: str | None = None
    updated_by_user_id: str | None = None
    trashed_at: str | None = None
    last_opened_at: str | None = None
    is_starred: bool = False
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class DriveShare(BaseModel):
    id: str
    workspace_id: str
    source_local_id: str | None = None
    token: str
    item_id: str
    visibility: Literal["restricted", "anyone_with_link"] = "anyone_with_link"
    role: Literal["viewer", "editor"] = "viewer"
    expires_at: str | None = None
    revoked_at: str | None = None
    is_revoked: bool = False
    created_by: str = ""
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class DrivePermission(BaseModel):
    id: str
    workspace_id: str
    item_id: str
    principal_type: Literal["user", "group", "domain", "anyone", "workspace"] = "user"
    principal_id: str
    email: str | None = None
    role: Literal["owner", "editor", "viewer", "commenter"] = "viewer"
    expires_at: str | None = None
    inherited_from_item_id: str | None = None
    created_by: str = ""
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class WorkspaceGroup(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: str = ""
    created_by: str = ""
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class WorkspaceGroupMember(BaseModel):
    id: str
    workspace_id: str
    group_id: str
    user_id: str
    created_by: str = ""
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class DrivePermissionCreateRequest(BaseModel):
    principal_type: Literal["user", "group", "domain", "anyone", "workspace"] = "user"
    principal_id: str = ""
    email: str | None = None
    role: Literal["owner", "editor", "commenter", "viewer"] = "viewer"
    expires_at: str | None = None


class DrivePermissionUpdateRequest(BaseModel):
    role: Literal["owner", "editor", "commenter", "viewer"] | None = None
    expires_at: str | None = None


class DriveShareLinkCreateRequest(BaseModel):
    item_id: str = Field(default="", alias="item_id")
    item_local_id: str = Field(default="", alias="item_local_id")
    local_id: str = ""
    visibility: Literal["restricted", "anyone_with_link"] = "anyone_with_link"
    role: Literal["viewer", "editor"] = "viewer"
    expires_at: str | None = None

    model_config = {
        "populate_by_name": True,
    }


class DriveShareLinkUpdateRequest(BaseModel):
    visibility: Literal["restricted", "anyone_with_link"] | None = None
    role: Literal["viewer", "editor"] | None = None
    expires_at: str | None = None
    is_revoked: bool | None = None


class DriveOwnerTransferRequest(BaseModel):
    target_user_id: str


class WorkspaceGroupCreateRequest(BaseModel):
    name: str
    description: str = ""


class WorkspaceGroupUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class WorkspaceGroupMemberCreateRequest(BaseModel):
    user_id: str
