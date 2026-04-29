from __future__ import annotations

from fastapi import Depends, FastAPI, Header, HTTPException

from .config import BILLING_PACKAGES
from .models import (
    AiRun,
    AuthResponse,
    BillingCheckoutRequest,
    CreateReportRequest,
    CreateWorkspaceRequest,
    ExportRequest,
    GenerateDraftFromGuidedPhotosRequest,
    GenerateDraftFromPhotosRequest,
    GuidedPhotoReviewRequest,
    GuidedPhotoStepUploadRequest,
    LoginRequest,
    Membership,
    PhotoAsset,
    PhotoUploadInput,
    ReportExport,
    ReportRecord,
    ReviewCompleteRequest,
    SignupRequest,
    TossWebhookRequest,
    UpdateReportRequest,
    UploadPhotosRequest,
    User,
    Workspace,
    utcnow,
)
from .services.ai_pipeline import build_draft_from_guided_photos, build_draft_from_photos
from .services.credits import add_ledger_entry, grant_workspace_trial, ledger_balance
from .store import store

app = FastAPI(title="Technical Guidance Standard Report SaaS API", version="0.1.0")


def default_photo_step_buckets() -> list[dict[str, object]]:
    return [
        {
            "step": "step1_overview",
            "title": "공정 및 전경",
            "description": "전경과 현재 공정을 설명하는 사진을 먼저 수집합니다.",
            "minRequired": 2,
            "uploadedPhotoIds": [],
            "representativePhotoId": None,
            "status": "pending",
        },
        {
            "step": "step2_hazard",
            "title": "위험 기인물/위험요인",
            "description": "지적사항 후보를 만들 위험요인 사진을 따로 수집합니다.",
            "minRequired": 3,
            "uploadedPhotoIds": [],
            "representativePhotoId": None,
            "status": "pending",
        },
    ]


def get_bucket(payload: dict[str, object], step: str) -> dict[str, object]:
    for bucket in payload["photoStepBuckets"]:
        if bucket["step"] == step:
            return bucket
    raise HTTPException(status_code=500, detail=f"Missing photo bucket for {step}.")


def sync_guided_photo_state(payload: dict[str, object]) -> None:
    step1 = get_bucket(payload, "step1_overview")
    step2 = get_bucket(payload, "step2_hazard")
    step1_complete = len(step1["uploadedPhotoIds"]) >= int(step1["minRequired"])
    step2_complete = len(step2["uploadedPhotoIds"]) >= int(step2["minRequired"])

    if step1["uploadedPhotoIds"] and step1["status"] == "pending":
        step1["status"] = "ready"
    if step2["uploadedPhotoIds"] and step2["status"] == "pending":
        step2["status"] = "ready"

    payload["photoChecklistStatus"] = {
        "step1OverviewComplete": step1_complete,
        "step2HazardComplete": step2_complete,
        "reviewReady": step1_complete and step2_complete,
        "minimumSatisfied": step1_complete and step2_complete,
    }


def touch_report(report: ReportRecord) -> None:
    timestamp = utcnow()
    report.updated_at = timestamp
    report.payload["updatedAt"] = timestamp


def serialize_report(report: ReportRecord) -> dict[str, object]:
    payload = report.model_dump()
    payload["exports"] = [item.model_dump() for item in store.exports[report.id]]
    payload["creditBalance"] = ledger_balance(report.workspace_id)
    return payload


def apply_ai_draft_to_report(
    report: ReportRecord,
    run: AiRun,
    draft: dict[str, object],
    *,
    doc3_photo_ids: list[str],
    doc7_photo_ids: list[str],
) -> None:
    report.status = "draft_ready"
    report.payload["status"] = "draft_ready"
    report.payload["currentSection"] = "review"
    report.payload["wizardStep"] = "workspace"
    report.payload["photoEvidence"] = draft["photoEvidence"]
    report.payload["findingCandidates"] = draft["findingCandidates"]
    report.payload["sectionDrafts"] = draft["sectionDrafts"]
    report.payload["validationResult"] = draft["validationResult"]
    report.payload["doc3PhotoCandidates"] = doc3_photo_ids
    report.payload["doc7PhotoCandidates"] = doc7_photo_ids
    report.payload["workspaceEntryMode"] = "guided_photo_flow"
    report.payload["doc11Doc12AutofillMode"] = "resource_autofill"
    report.payload["aiMeta"]["lastRunId"] = run.id
    report.payload["aiMeta"]["lastRunStatus"] = run.status
    report.payload["aiMeta"]["generatedAt"] = run.updated_at
    report.payload["aiMeta"]["sourceMix"] = ["vision", "ai_section", "manual"]
    report.payload["reviewMeta"]["reviewQueue"] = [
        {
            "fieldPath": "reportMeta.siteAddress",
            "label": "현장 주소",
            "confidence": 0.15,
            "needsReview": True,
            "status": "pending",
            "notes": "사진만으로 확정 불가",
        },
        {
            "fieldPath": "reportMeta.siteContact",
            "label": "담당자 연락처",
            "confidence": 0.12,
            "needsReview": True,
            "status": "pending",
            "notes": "행정 필수값 검토 필요",
        },
        {
            "fieldPath": "findingCandidates[0].improvementPlan",
            "label": "1번 지적 개선계획",
            "confidence": 0.74,
            "needsReview": True,
            "status": "pending",
            "notes": "현장 확인 후 확정",
        },
    ]


def require_user(authorization: str | None = Header(default=None)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    token = authorization.removeprefix("Bearer ").strip()
    user_id = store.tokens.get(token)
    if not user_id or user_id not in store.users:
        raise HTTPException(status_code=401, detail="Invalid access token.")
    return store.users[user_id]


def require_workspace_access(workspace_id: str, user: User) -> Workspace:
    workspace = store.workspaces.get(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    allowed = any(
        membership.workspace_id == workspace_id and membership.user_id == user.id
        for membership in store.memberships.values()
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="Workspace access denied.")
    return workspace


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/auth/signup", response_model=AuthResponse)
def signup(payload: SignupRequest) -> AuthResponse:
    existing = next((user for user in store.users.values() if user.email == payload.email), None)
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists.")

    user = User(id=store.new_id("user"), email=payload.email, password=payload.password, name=payload.name)
    token = store.new_id("token")
    store.users[user.id] = user
    store.tokens[token] = user.id
    return AuthResponse(token=token, user=user.model_dump(exclude={"password"}))


@app.post("/api/v1/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    user = next(
        (
            item
            for item in store.users.values()
            if item.email == payload.email and item.password == payload.password
        ),
        None,
    )
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    token = store.new_id("token")
    store.tokens[token] = user.id
    return AuthResponse(token=token, user=user.model_dump(exclude={"password"}))


@app.get("/api/v1/auth/me")
def auth_me(user: User = Depends(require_user)) -> dict[str, str]:
    return user.model_dump(exclude={"password"})


@app.post("/api/v1/workspaces")
def create_workspace(payload: CreateWorkspaceRequest, user: User = Depends(require_user)) -> dict[str, object]:
    workspace = Workspace(id=store.new_id("workspace"), name=payload.name, owner_user_id=user.id)
    membership = Membership(id=store.new_id("member"), workspace_id=workspace.id, user_id=user.id)
    store.workspaces[workspace.id] = workspace
    store.memberships[membership.id] = membership
    grant_workspace_trial(workspace.id)
    return {
      "workspace": workspace.model_dump(),
      "membership": membership.model_dump(),
      "creditBalance": ledger_balance(workspace.id),
    }


@app.get("/api/v1/workspaces/me")
def list_my_workspaces(user: User = Depends(require_user)) -> list[dict[str, object]]:
    memberships = [item for item in store.memberships.values() if item.user_id == user.id]
    response = []
    for membership in memberships:
        workspace = store.workspaces[membership.workspace_id]
        response.append(
            {
                "workspace": workspace.model_dump(),
                "membership": membership.model_dump(),
                "creditBalance": ledger_balance(workspace.id),
            }
        )
    return response


@app.post("/api/v1/billing/checkout")
def billing_checkout(payload: BillingCheckoutRequest, user: User = Depends(require_user)) -> dict[str, object]:
    require_workspace_access(payload.workspace_id, user)
    package_info = BILLING_PACKAGES[payload.package_id]
    return {
      "checkoutUrl": f"https://pay.toss.im/demo/{payload.package_id}",
      "workspaceId": payload.workspace_id,
      "package": package_info,
    }


@app.post("/api/v1/billing/webhooks/toss")
def billing_webhook(payload: TossWebhookRequest) -> dict[str, object]:
    if not payload.success:
        return {"ok": False, "message": "Webhook ignored because payment was not successful."}

    package_info = BILLING_PACKAGES[payload.package_id]
    entry = add_ledger_entry(
      workspace_id=payload.workspace_id,
      entry_type="purchase",
      amount=package_info["credits"],
      description=f"{payload.package_id} 결제 완료",
    )
    return {"ok": True, "entry": entry.model_dump(), "balance": ledger_balance(payload.workspace_id)}


@app.get("/api/v1/credits/balance")
def credits_balance(workspace_id: str, user: User = Depends(require_user)) -> dict[str, int]:
    require_workspace_access(workspace_id, user)
    return {"workspaceId": workspace_id, "balance": ledger_balance(workspace_id)}


@app.get("/api/v1/credits/ledger")
def credits_ledger(workspace_id: str, user: User = Depends(require_user)) -> list[dict[str, object]]:
    require_workspace_access(workspace_id, user)
    return [entry.model_dump() for entry in store.credit_ledger[workspace_id]]


@app.get("/api/v1/reports")
def list_reports(workspace_id: str, user: User = Depends(require_user)) -> list[dict[str, object]]:
    require_workspace_access(workspace_id, user)
    reports = [
        report
        for report in store.reports.values()
        if report.workspace_id == workspace_id
    ]
    reports.sort(key=lambda item: item.updated_at, reverse=True)
    return [serialize_report(report) for report in reports]


@app.post("/api/v1/reports")
def create_report(payload: CreateReportRequest, user: User = Depends(require_user)) -> dict[str, object]:
    require_workspace_access(payload.workspace_id, user)
    report_id = store.new_id("report")
    timestamp = utcnow()
    report = ReportRecord(
      id=report_id,
      workspace_id=payload.workspace_id,
      created_by=user.id,
      payload={
        "id": report_id,
        "workspaceId": payload.workspace_id,
        "status": "draft",
        "currentSection": "photo-step-1",
        "reportMeta": {
          "workspaceName": store.workspaces[payload.workspace_id].name,
          "siteName": payload.site_name,
          "customerName": payload.customer_name,
          "guidanceAgencyName": "",
          "visitDate": payload.visit_date,
          "drafterName": payload.drafter_name,
          "siteManagementNumber": "",
          "businessStartNumber": "",
          "constructionPeriod": "",
          "constructionAmount": "",
          "siteManagerName": "",
          "corporationRegistrationNumber": "",
          "businessRegistrationNumber": "",
          "licenseNumber": "",
          "headquartersContact": "",
          "headquartersAddress": "",
          "constructionType": "",
          "visitCount": "1",
          "totalVisitCount": "",
          "previousImplementationStatus": "",
          "notificationMethod": "",
          "notificationRecipientName": "",
          "otherNotificationMethod": "",
          "progressRate": payload.progress_rate,
          "processSummary": payload.process_summary,
          "workerCount": payload.worker_count,
          "siteAddress": "",
          "siteContact": "",
          "reportPriceKrw": 3000,
        },
        "reviewMeta": {
          "reviewCompleted": False,
          "reviewCompletedAt": None,
          "responsibilityConfirmed": False,
          "requiredFieldPaths": [
            "reportMeta.siteName",
            "reportMeta.customerName",
            "reportMeta.visitDate",
            "reportMeta.drafterName",
          ],
          "reviewQueue": [],
        },
        "aiMeta": {
          "pipelineVersion": "v1-photo-first",
          "lastRunId": None,
          "lastRunStatus": "queued",
          "generatedAt": None,
          "sourceMix": ["manual"],
        },
        "wizardStep": "step1_overview",
        "photoStepBuckets": default_photo_step_buckets(),
        "photoChecklistStatus": {
          "step1OverviewComplete": False,
          "step2HazardComplete": False,
          "reviewReady": False,
          "minimumSatisfied": False,
        },
        "doc3PhotoCandidates": [],
        "doc7PhotoCandidates": [],
        "workspaceEntryMode": "guided_photo_flow",
        "doc11Doc12AutofillMode": "resource_autofill",
        "photoEvidence": [],
        "findingCandidates": [],
        "sectionDrafts": {
          "doc5": {
            "progressOverview": "",
            "accidentTrend": "",
            "findingCase": "",
            "workEnvironmentRisk": "",
            "futureProcessFocus": "",
          },
          "doc7": [],
          "doc8": [],
          "doc11": [],
          "doc12": [],
          "doc13": [],
          "doc14": {"title": "", "body": "", "confidence": 0.0},
        },
        "validationResult": {"valid": False, "blockingIssues": [], "warnings": [], "reviewedFieldPaths": []},
        "documentsCompat": {},
        "createdAt": timestamp,
        "updatedAt": timestamp,
      },
      created_at=timestamp,
      updated_at=timestamp,
    )
    store.reports[report.id] = report
    return serialize_report(report)


@app.get("/api/v1/reports/{report_id}")
def get_report(report_id: str, user: User = Depends(require_user)) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
      raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    return serialize_report(report)


@app.patch("/api/v1/reports/{report_id}")
def patch_report(report_id: str, payload: UpdateReportRequest, user: User = Depends(require_user)) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    report.payload = payload.payload
    touch_report(report)
    return serialize_report(report)


def create_photo_asset(
    report_id: str,
    item: PhotoUploadInput,
    default_category: str,
    default_filename: str,
) -> PhotoAsset:
    return PhotoAsset(
        id=store.new_id("photo"),
        report_id=report_id,
        category=item.category or default_category,
        filename=item.filename or default_filename,
        data_url=item.data_url,
        location_hint=item.location_hint,
    )


@app.post("/api/v1/reports/{report_id}/photos")
def upload_photos(report_id: str, payload: UploadPhotosRequest, user: User = Depends(require_user)) -> list[dict[str, object]]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    uploaded = []
    for item in payload.photos:
        photo = create_photo_asset(report_id, item, "hazard", "photo.jpg")
        store.photos[photo.id] = photo
        uploaded.append(photo.model_dump())
    touch_report(report)
    return uploaded


@app.post("/api/v1/reports/{report_id}/photo-steps/step-1")
def upload_guided_step_one(
    report_id: str,
    payload: GuidedPhotoStepUploadRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)

    bucket = get_bucket(report.payload, "step1_overview")
    uploaded = []
    for index, item in enumerate(payload.photos, start=1):
        photo = create_photo_asset(
            report_id,
            item,
            "site_overview" if index == 1 else "process",
            f"step1-photo-{index}.jpg",
        )
        store.photos[photo.id] = photo
        bucket["uploadedPhotoIds"].append(photo.id)
        if bucket["representativePhotoId"] is None:
            bucket["representativePhotoId"] = photo.id
        uploaded.append(photo.model_dump())

    report.payload["wizardStep"] = "step1_overview"
    report.payload["currentSection"] = "photo-step-1"
    report.payload["doc3PhotoCandidates"] = bucket["uploadedPhotoIds"]
    sync_guided_photo_state(report.payload)
    touch_report(report)
    return {"uploadedPhotos": uploaded, "report": serialize_report(report)}


@app.post("/api/v1/reports/{report_id}/photo-steps/step-2")
def upload_guided_step_two(
    report_id: str,
    payload: GuidedPhotoStepUploadRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)

    bucket = get_bucket(report.payload, "step2_hazard")
    uploaded = []
    for index, item in enumerate(payload.photos, start=1):
        photo = create_photo_asset(report_id, item, "hazard", f"step2-photo-{index}.jpg")
        store.photos[photo.id] = photo
        bucket["uploadedPhotoIds"].append(photo.id)
        if bucket["representativePhotoId"] is None:
            bucket["representativePhotoId"] = photo.id
        uploaded.append(photo.model_dump())

    report.payload["wizardStep"] = "step2_hazard"
    report.payload["currentSection"] = "photo-step-2"
    report.payload["doc7PhotoCandidates"] = bucket["uploadedPhotoIds"]
    sync_guided_photo_state(report.payload)
    touch_report(report)
    return {"uploadedPhotos": uploaded, "report": serialize_report(report)}


@app.post("/api/v1/reports/{report_id}/photo-steps/review")
def review_guided_photos(
    report_id: str,
    payload: GuidedPhotoReviewRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)

    step1 = get_bucket(report.payload, "step1_overview")
    step2 = get_bucket(report.payload, "step2_hazard")
    report.payload["doc3PhotoCandidates"] = payload.doc3_photo_ids or step1["uploadedPhotoIds"]
    report.payload["doc7PhotoCandidates"] = payload.doc7_photo_ids or step2["uploadedPhotoIds"]
    step1["representativePhotoId"] = payload.representative_doc3_photo_id or step1["representativePhotoId"]
    step2["representativePhotoId"] = payload.representative_doc7_photo_id or step2["representativePhotoId"]
    step1["status"] = "reviewed"
    step2["status"] = "reviewed"
    report.payload["wizardStep"] = "review"
    report.payload["currentSection"] = "photo-review"
    sync_guided_photo_state(report.payload)
    touch_report(report)
    return {"report": serialize_report(report)}


@app.post("/api/v1/reports/{report_id}/draft-from-photos")
def draft_from_photos(
    report_id: str,
    payload: GenerateDraftFromPhotosRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)

    selected_photos = [
        store.photos[photo_id].model_dump()
        for photo_id in payload.photo_asset_ids
        if photo_id in store.photos
    ]
    if not selected_photos:
        raise HTTPException(status_code=400, detail="No valid photo assets supplied.")

    run = AiRun(id=store.new_id("airun"), report_id=report_id, status="succeeded")
    draft = build_draft_from_photos(report_id, selected_photos)
    run.payload = draft
    store.ai_runs[run.id] = run

    apply_ai_draft_to_report(
        report,
        run,
        draft,
        doc3_photo_ids=[],
        doc7_photo_ids=payload.photo_asset_ids,
    )
    touch_report(report)
    return {"aiRun": run.model_dump(), "report": serialize_report(report)}


@app.post("/api/v1/reports/{report_id}/draft-from-guided-photos")
def draft_from_guided_photos(
    report_id: str,
    payload: GenerateDraftFromGuidedPhotosRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)

    overview_photos = [
        store.photos[photo_id].model_dump()
        for photo_id in payload.doc3_photo_ids
        if photo_id in store.photos
    ]
    hazard_photos = [
        store.photos[photo_id].model_dump()
        for photo_id in payload.doc7_photo_ids
        if photo_id in store.photos
    ]
    if not overview_photos or not hazard_photos:
        raise HTTPException(status_code=400, detail="Guided photo buckets are incomplete.")

    report.payload["wizardStep"] = "ai_generating"
    report.payload["currentSection"] = "ai-generating"
    run = AiRun(id=store.new_id("airun"), report_id=report_id, status="succeeded")
    draft = build_draft_from_guided_photos(report_id, overview_photos, hazard_photos)
    run.payload = draft
    store.ai_runs[run.id] = run

    apply_ai_draft_to_report(
        report,
        run,
        draft,
        doc3_photo_ids=payload.doc3_photo_ids,
        doc7_photo_ids=payload.doc7_photo_ids,
    )
    touch_report(report)
    return {"aiRun": run.model_dump(), "report": serialize_report(report)}


@app.get("/api/v1/reports/{report_id}/ai-runs/{run_id}")
def get_ai_run(report_id: str, run_id: str, user: User = Depends(require_user)) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    run = store.ai_runs.get(run_id)
    if run is None or run.report_id != report_id:
        raise HTTPException(status_code=404, detail="AI run not found.")
    return run.model_dump()


@app.post("/api/v1/reports/{report_id}/review-complete")
def review_complete(report_id: str, payload: ReviewCompleteRequest, user: User = Depends(require_user)) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)

    report.payload["reviewMeta"]["responsibilityConfirmed"] = payload.responsibility_confirmed
    report.payload["reviewMeta"]["reviewCompleted"] = True
    report.payload["reviewMeta"]["reviewCompletedAt"] = utcnow()
    report.review_completed = True
    report.status = "review_completed"
    report.payload["status"] = "review_completed"
    touch_report(report)
    return serialize_report(report)


def create_export(report: ReportRecord, format_name: str) -> ReportExport:
    first_charge = False
    if not report.final_export_consumed:
        balance = ledger_balance(report.workspace_id)
        if balance < 1:
            raise HTTPException(status_code=402, detail="Insufficient credits.")
        add_ledger_entry(
            workspace_id=report.workspace_id,
            entry_type="consume_export",
            amount=-1,
            description="최초 final export 성공 차감",
            report_id=report.id,
        )
        report.final_export_consumed = True
        first_charge = True

    export = ReportExport(
      id=store.new_id("export"),
      report_id=report.id,
      format=format_name,
      first_charge_applied=first_charge,
    )
    store.exports[report.id].append(export)
    report.status = "exported"
    report.payload["status"] = "exported"
    return export


@app.post("/api/v1/reports/{report_id}/exports/pdf")
def export_pdf(report_id: str, payload: ExportRequest, user: User = Depends(require_user)) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    if not report.review_completed or not payload.confirm_reviewed:
        raise HTTPException(status_code=409, detail="Review completion is required before export.")
    export = create_export(report, "pdf")
    touch_report(report)
    return {"export": export.model_dump(), "balance": ledger_balance(report.workspace_id), "report": serialize_report(report)}


@app.post("/api/v1/reports/{report_id}/exports/hwpx")
def export_hwpx(report_id: str, payload: ExportRequest, user: User = Depends(require_user)) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    if not report.review_completed or not payload.confirm_reviewed:
        raise HTTPException(status_code=409, detail="Review completion is required before export.")
    export = create_export(report, "hwpx")
    touch_report(report)
    return {"export": export.model_dump(), "balance": ledger_balance(report.workspace_id), "report": serialize_report(report)}


@app.get("/api/v1/reports/{report_id}/exports")
def export_history(report_id: str, user: User = Depends(require_user)) -> list[dict[str, object]]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    return [item.model_dump() for item in store.exports[report.id]]
