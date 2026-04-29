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
    created_at: str = Field(default_factory=utcnow)


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
    created_at: str = Field(default_factory=utcnow)


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


class ReportRecord(BaseModel):
    id: str
    workspace_id: str
    created_by: str
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


class AuthResponse(BaseModel):
    token: str
    user: dict[str, Any]


class CreateWorkspaceRequest(BaseModel):
    name: str


class BillingCheckoutRequest(BaseModel):
    workspace_id: str
    package_id: Literal["starter-10", "team-30", "agency-100"]


class TossWebhookRequest(BaseModel):
    workspace_id: str
    package_id: Literal["starter-10", "team-30", "agency-100"]
    success: bool = True


class CreateReportRequest(BaseModel):
    workspace_id: str
    site_name: str
    customer_name: str
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


class ReviewCompleteRequest(BaseModel):
    responsibility_confirmed: bool = True


class ExportRequest(BaseModel):
    confirm_reviewed: bool = True
