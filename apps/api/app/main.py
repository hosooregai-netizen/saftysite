from __future__ import annotations

import base64
from datetime import datetime
from urllib.parse import urlencode

import httpx
from fastapi import Depends, FastAPI, Form, Header, HTTPException, Query, Response

from .apps_stack import (
    MailOAuthError,
    _clean,
    _collection,
    build_admin_reports_response,
    _contains_query,
    build_recipient_suggestions,
    build_safety_report_list,
    complete_mail_oauth,
    create_assignment,
    create_headquarter,
    create_headquarter_assignment,
    create_site,
    deactivate_assignment,
    deactivate_headquarter,
    deactivate_headquarter_assignment,
    deactivate_site,
    disconnect_mail_account,
    ensure_workspace_seed,
    get_site_detail_for_workspace,
    get_mail_message,
    get_mail_thread_detail,
    get_workspace_for_user,
    list_assigned_headquarters_for_user,
    list_assigned_sites_for_user,
    list_headquarter_assignments,
    list_headquarters_for_admin,
    list_mail_accounts,
    list_mail_threads,
    list_sites_for_admin,
    list_workspace_users,
    send_mail_message,
    start_mail_oauth,
    sync_mail_accounts,
    update_assignment,
    update_headquarter,
    update_headquarter_assignment,
    update_mail_thread_state,
    update_site,
    _new_id,
    _mail_provider_status,
)
from .config import (
    APP_BASE_URL,
    BILLING_PACKAGES,
    GOOGLE_APP_ALLOWED_REDIRECT_URIS,
    GOOGLE_APP_CLIENT_ID,
    GOOGLE_APP_CLIENT_SECRET,
    TOSS_PAYMENTS_API_BASE_URL,
    TOSS_PAYMENTS_SECRET_KEY,
)
from .drive_service import (
    build_relative_drive_path,
    build_drive_path,
    can_edit_item,
    can_read_item,
    can_share_item,
    is_descendant_of,
    is_drive_share_active,
    list_drive_items,
    list_drive_permissions_for_item,
    list_effective_permissions,
    list_workspace_groups,
    normalize_email_domain,
    purge_drive_item_tree,
    resolve_share_link_access,
    serialize_drive_item,
    serialize_drive_permission,
    serialize_public_drive_item_content,
    serialize_public_drive_item_metadata,
    serialize_drive_share,
    serialize_workspace_group,
)
from .models import (
    AiRun,
    AuthResponse,
    BillingConfirmRequest,
    BillingCheckoutRequest,
    ClaimAnonymousRequest,
    CreateReportRequest,
    CreateWorkspaceRequest,
    DriveItem,
    DrivePermission,
    DrivePermissionCreateRequest,
    DriveOwnerTransferRequest,
    DrivePermissionUpdateRequest,
    DriveShare,
    DriveShareLinkCreateRequest,
    DriveShareLinkUpdateRequest,
    ExportRequest,
    ExportDisclaimerAcceptance,
    GenerateDraftFromGuidedPhotosRequest,
    GenerateDraftFromPhotosRequest,
    GuestWorkspaceDriveItemInput,
    GuestWorkspaceDriveShareInput,
    GuestWorkspaceMailboxDraftInput,
    GuestWorkspacePhotoAlbumInput,
    GoogleAuthCompleteRequest,
    GoogleAuthStartRequest,
    ImportGuestWorkspaceCacheRequest,
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
    WorkspaceMailboxDraft,
    WorkspacePhotoAlbumItem,
    WorkspaceGroup,
    WorkspaceGroupCreateRequest,
    WorkspaceGroupMember,
    WorkspaceGroupMemberCreateRequest,
    WorkspaceGroupUpdateRequest,
    utcnow,
)
from .services.ai_pipeline import build_draft_from_guided_photos, build_draft_from_photos
from .services.credits import add_ledger_entry, grant_workspace_trial, ledger_balance, list_ledger_entries
from .store import store

app = FastAPI(title="Technical Guidance Standard Report SaaS API", version="0.1.0")

MINIMAL_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n"
    b"trailer<</Root 1 0 R>>\n%%EOF"
)


def join_non_empty(parts: list[object]) -> str:
    return " / ".join(str(part).strip() for part in parts if str(part or "").strip())


def format_project_period(start_date: object, end_date: object) -> str:
    start_value = str(start_date or "").strip()
    end_value = str(end_date or "").strip()
    if start_value and end_value:
        return f"{start_value} ~ {end_value}"
    return start_value or end_value


def format_amount_krw(value: object) -> str:
    if isinstance(value, bool):
        return ""
    if isinstance(value, (int, float)):
        amount = int(value)
        return f"{amount:,}원" if amount > 0 else ""
    value_text = str(value or "").strip().replace(",", "")
    if not value_text:
        return ""
    try:
        amount = int(float(value_text))
    except ValueError:
        return str(value).strip()
    return f"{amount:,}원" if amount > 0 else ""


def build_report_meta_seed(
    *,
    payload: CreateReportRequest,
    site: dict[str, object],
    user: User,
    workspace_name: str,
) -> dict[str, object]:
    headquarter = site.get("headquarter_detail") if isinstance(site.get("headquarter_detail"), dict) else {}
    primary_site_manager = (
        site.get("primary_site_manager") if isinstance(site.get("primary_site_manager"), dict) else {}
    )
    site_name = payload.site_name.strip() or str(site.get("site_name") or "").strip()
    customer_name = payload.customer_name.strip() or str(site.get("client_business_name") or "").strip()
    site_contact = join_non_empty(
        [
            primary_site_manager.get("name") or site.get("manager_name"),
            primary_site_manager.get("phone") or site.get("manager_phone"),
            primary_site_manager.get("email") or site.get("site_contact_email"),
        ]
    )
    headquarters_contact = join_non_empty(
        [
            headquarter.get("contact_name"),
            headquarter.get("contact_phone"),
        ]
    )
    visit_count = site.get("guidance_max_visit_round")
    total_visit_count = site.get("total_rounds")
    return {
        "workspaceName": workspace_name,
        "siteName": site_name,
        "customerName": customer_name,
        "guidanceAgencyName": user.organization_name or "",
        "visitDate": payload.visit_date,
        "drafterName": payload.drafter_name,
        "siteManagementNumber": str(site.get("management_number") or headquarter.get("management_number") or ""),
        "businessStartNumber": str(
            headquarter.get("opening_number")
            or site.get("client_management_number")
            or site.get("site_code")
            or ""
        ),
        "constructionPeriod": format_project_period(
            site.get("project_start_date"),
            site.get("project_end_date"),
        ),
        "constructionAmount": format_amount_krw(site.get("project_amount")),
        "siteManagerName": str(primary_site_manager.get("name") or site.get("manager_name") or ""),
        "corporationRegistrationNumber": str(
            site.get("client_corporate_registration_no")
            or headquarter.get("corporate_registration_no")
            or ""
        ),
        "businessRegistrationNumber": str(
            site.get("client_business_registration_no")
            or headquarter.get("business_registration_no")
            or ""
        ),
        "licenseNumber": str(headquarter.get("license_no") or ""),
        "headquartersContact": headquarters_contact,
        "headquartersAddress": str(headquarter.get("address") or ""),
        "constructionType": str(site.get("project_kind") or ""),
        "visitCount": str(visit_count or 1),
        "totalVisitCount": str(total_visit_count or ""),
        "previousImplementationStatus": "",
        "notificationMethod": "",
        "notificationRecipientName": "",
        "otherNotificationMethod": "",
        "progressRate": payload.progress_rate,
        "processSummary": payload.process_summary,
        "workerCount": payload.worker_count,
        "siteAddress": str(site.get("site_address") or ""),
        "siteContact": site_contact,
        "reportPriceKrw": 3000,
    }


def billing_orders_collection():
    return _collection("app_billing_orders")


def toss_basic_auth_header() -> str:
    token = base64.b64encode(f"{TOSS_PAYMENTS_SECRET_KEY}:".encode("utf-8")).decode("utf-8")
    return f"Basic {token}"


def require_toss_configuration() -> None:
    if TOSS_PAYMENTS_SECRET_KEY:
        return
    raise HTTPException(
        status_code=503,
        detail="토스 결제 비밀키가 설정되지 않았습니다. TOSS_PAYMENTS_SECRET_KEY를 확인해 주세요.",
    )


def build_billing_order_name(package_id: str, credits: int) -> str:
    package_labels = {
        "starter-10": "10건 팩",
        "team-30": "30건 팩",
        "agency-100": "100건 팩",
    }
    return f"안전사이트 크레딧 {package_labels.get(package_id, f'{credits}건 팩')}"


def create_billing_order_document(
    *,
    workspace_id: str,
    user_id: str,
    package_id: str,
    amount_krw: int,
    credits: int,
) -> dict[str, object]:
    timestamp = utcnow()
    order_id = _new_id("order")
    return {
        "_id": order_id,
        "id": order_id,
        "workspace_id": workspace_id,
        "user_id": user_id,
        "package_id": package_id,
        "amount_krw": amount_krw,
        "credits": credits,
        "order_name": build_billing_order_name(package_id, credits),
        "status": "pending",
        "checkout_url": None,
        "payment_key": None,
        "approved_at": None,
        "credit_granted": False,
        "credited_at": None,
        "approval_payload": {},
        "webhook_payload": {},
        "created_at": timestamp,
        "updated_at": timestamp,
    }


def get_billing_order(order_id: str) -> dict[str, object] | None:
    return _clean(billing_orders_collection().find_one({"_id": order_id}))


def save_billing_order(document: dict[str, object]) -> dict[str, object]:
    document["updated_at"] = utcnow()
    document["_id"] = document["id"]
    billing_orders_collection().replace_one({"_id": document["_id"]}, document, upsert=True)
    return _clean(document)


def build_toss_checkout_urls() -> tuple[str, str]:
    base_url = APP_BASE_URL.rstrip("/")
    return (f"{base_url}/billing/success", f"{base_url}/billing/fail")


def toss_post(path: str, payload: dict[str, object], *, idempotency_key: str) -> dict[str, object]:
    require_toss_configuration()
    response = httpx.post(
        f"{TOSS_PAYMENTS_API_BASE_URL.rstrip('/')}{path}",
        json=payload,
        headers={
            "Authorization": toss_basic_auth_header(),
            "Content-Type": "application/json",
            "Idempotency-Key": idempotency_key,
        },
        timeout=20.0,
    )
    if response.is_success:
        return response.json()

    detail = "토스 결제 요청에 실패했습니다."
    try:
        error_payload = response.json()
        detail = str(error_payload.get("message") or error_payload.get("code") or detail)
    except Exception:
        pass
    raise HTTPException(status_code=502, detail=detail)


def grant_purchase_credits_once(order: dict[str, object], *, payment_key: str) -> dict[str, object]:
    if bool(order.get("credit_granted")):
        return order

    entry = add_ledger_entry(
        workspace_id=str(order["workspace_id"]),
        entry_type="purchase",
        amount=int(order["credits"]),
        description=f"{order['package_id']} 결제 완료",
        source_order_id=str(order["id"]),
        source_payment_key=payment_key,
    )
    order["credit_granted"] = True
    order["credited_at"] = entry.created_at
    return save_billing_order(order)


def extract_webhook_payment_fields(payload: TossWebhookRequest) -> tuple[str, str, str, dict[str, object]]:
    data = payload.data if isinstance(payload.data, dict) else {}
    order_id = str(data.get("orderId") or payload.orderId or "").strip()
    payment_key = str(data.get("paymentKey") or payload.paymentKey or "").strip()
    status = str(data.get("status") or payload.status or "").strip().upper()
    return order_id, payment_key, status, data


def guided_photo_bucket_specs() -> list[dict[str, object]]:
    return [
        {
            "step": "step1_overview",
            "title": "현재 공정 또는 현장 전경",
            "description": "현재 공정이나 현장 전경을 보여주는 필수 사진 1장입니다.",
            "minRequired": 1,
            "recommendedCount": 1,
            "bucketRole": "current_process_photo",
            "uploadedPhotoIds": [],
            "representativePhotoId": None,
            "status": "pending",
        },
        {
            "step": "step2_hazard",
            "title": "현재 위험요인",
            "description": "현재 위험요인이나 기인물을 보여주는 필수 사진 1장입니다.",
            "minRequired": 1,
            "recommendedCount": 1,
            "bucketRole": "current_hazard_photo",
            "uploadedPhotoIds": [],
            "representativePhotoId": None,
            "status": "pending",
        },
        {
            "step": "step3_followup",
            "title": "이전 지적사항 확인",
            "description": "이전 기술지도 지적사항 이행 여부를 확인할 선택 사진입니다.",
            "minRequired": 0,
            "recommendedCount": 1,
            "bucketRole": "previous_guidance_check_photo",
            "uploadedPhotoIds": [],
            "representativePhotoId": None,
            "status": "skipped",
        },
        {
            "step": "step4_support",
            "title": "교육 및 지원활동",
            "description": "교육이나 지원활동이 있으면 선택 사진으로 추가합니다.",
            "minRequired": 0,
            "recommendedCount": 1,
            "bucketRole": "education_support_photo",
            "uploadedPhotoIds": [],
            "representativePhotoId": None,
            "status": "skipped",
        },
        {
            "step": "step5_site_overview",
            "title": "추가 현장 전경",
            "description": "현장 전경을 보강할 추가 선택 사진입니다.",
            "minRequired": 0,
            "recommendedCount": 1,
            "bucketRole": "site_overview_photo",
            "uploadedPhotoIds": [],
            "representativePhotoId": None,
            "status": "skipped",
        },
    ]


def default_photo_step_buckets() -> list[dict[str, object]]:
    return [dict(bucket) for bucket in guided_photo_bucket_specs()]


def normalize_guided_photo_buckets(payload: dict[str, object]) -> None:
    existing_rows = payload.get("photoStepBuckets")
    existing_list = existing_rows if isinstance(existing_rows, list) else []
    existing_by_step = {
        str(item.get("step")): item
        for item in existing_list
        if isinstance(item, dict)
    }
    normalized_rows: list[dict[str, object]] = []
    for bucket in guided_photo_bucket_specs():
        existing = existing_by_step.get(str(bucket["step"]))
        normalized_rows.append(
            {
                **bucket,
                "uploadedPhotoIds": list(existing.get("uploadedPhotoIds") or []) if isinstance(existing, dict) else [],
                "representativePhotoId": existing.get("representativePhotoId") if isinstance(existing, dict) else None,
                "status": str(existing.get("status") or bucket["status"]) if isinstance(existing, dict) else bucket["status"],
            }
        )
    payload["photoStepBuckets"] = normalized_rows


def get_bucket(payload: dict[str, object], step: str) -> dict[str, object]:
    normalize_guided_photo_buckets(payload)
    for bucket in payload["photoStepBuckets"]:
        if bucket["step"] == step:
            return bucket
    raise HTTPException(status_code=500, detail=f"Missing photo bucket for {step}.")


def sync_guided_photo_state(payload: dict[str, object]) -> None:
    normalize_guided_photo_buckets(payload)
    for bucket in payload["photoStepBuckets"]:
        if bucket["uploadedPhotoIds"] and bucket["status"] == "pending":
            bucket["status"] = "ready"
    step1 = get_bucket(payload, "step1_overview")
    step2 = get_bucket(payload, "step2_hazard")
    step1_complete = len(step1["uploadedPhotoIds"]) >= int(step1["minRequired"])
    step2_complete = len(step2["uploadedPhotoIds"]) >= int(step2["minRequired"])

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


def export_disclaimer_key(workspace_id: str, user_id: str) -> str:
    return f"{workspace_id}:{user_id}"


def get_export_disclaimer_acceptance(workspace_id: str, user_id: str) -> dict[str, object] | None:
    record = store.export_disclaimer_acceptances.get(export_disclaimer_key(workspace_id, user_id))
    return record.model_dump() if record is not None else None


def ensure_export_disclaimer_acceptance(report: ReportRecord, user: User, payload: ExportRequest) -> None:
    key = export_disclaimer_key(report.workspace_id, user.id)
    existing = store.export_disclaimer_acceptances.get(key)
    if existing is not None:
        return

    typed_name = payload.typed_signature_name.strip()
    if not payload.acknowledge_ai_disclaimer or not typed_name:
        raise HTTPException(
            status_code=409,
            detail="최초 1회 다운로드 전 책임 확인과 서명이 필요합니다.",
        )

    store.export_disclaimer_acceptances[key] = ExportDisclaimerAcceptance(
        id=store.new_id("disclaimer"),
        workspace_id=report.workspace_id,
        user_id=user.id,
        accepted_by_name=typed_name,
    )


def serialize_report(report: ReportRecord, user: User | None = None) -> dict[str, object]:
    normalize_guided_photo_buckets(report.payload)
    sync_guided_photo_state(report.payload)
    payload = report.model_dump()
    payload["exports"] = [item.model_dump() for item in store.exports[report.id]]
    payload["creditBalance"] = ledger_balance(report.workspace_id)
    acceptance = (
        get_export_disclaimer_acceptance(report.workspace_id, user.id) if user is not None else None
    )
    payload["exportDisclaimerAccepted"] = acceptance is not None
    payload["exportDisclaimerAcceptance"] = acceptance
    return payload


def _review_item_id(field_path: str) -> str:
    sanitized = "".join(character if character.isalnum() else "-" for character in field_path)
    return f"rq-{sanitized.strip('-') or 'item'}"


def _review_item_section(field_path: str) -> str:
    if field_path.startswith("reportMeta."):
        field_name = field_path.removeprefix("reportMeta.")
        if field_name == "notificationMethod":
            return "dispatch"
        return "reportMeta"
    if field_path.startswith("findingCandidates["):
        return "doc4"
    if field_path.startswith("sectionDrafts.doc8["):
        return "doc5"
    if field_path.startswith("photoObservations["):
        return "photoObservations"
    return "other"


def _review_item_field(field_path: str) -> str:
    if "." not in field_path:
        return field_path
    return field_path.rsplit(".", 1)[-1]


def _path_tokens(field_path: str) -> list[str | int]:
    tokens: list[str | int] = []
    buffer = ""
    index_buffer = ""
    in_index = False
    for character in field_path:
        if character == "." and not in_index:
            if buffer:
                tokens.append(buffer)
                buffer = ""
            continue
        if character == "[":
            if buffer:
                tokens.append(buffer)
                buffer = ""
            in_index = True
            index_buffer = ""
            continue
        if character == "]" and in_index:
            if index_buffer.isdigit():
                tokens.append(int(index_buffer))
            in_index = False
            index_buffer = ""
            continue
        if in_index:
            index_buffer += character
        else:
            buffer += character
    if buffer:
        tokens.append(buffer)
    return tokens


def _get_value_at_path(container: Any, field_path: str) -> Any:
    current = container
    for token in _path_tokens(field_path):
        if isinstance(token, int):
            if not isinstance(current, list) or token >= len(current):
                return None
            current = current[token]
        else:
            if not isinstance(current, dict) or token not in current:
                return None
            current = current[token]
    return current


def _set_value_at_path(container: Any, field_path: str, value: Any) -> bool:
    tokens = _path_tokens(field_path)
    if not tokens:
        return False
    current = container
    for token in tokens[:-1]:
        if isinstance(token, int):
            if not isinstance(current, list) or token >= len(current):
                return False
            current = current[token]
        else:
            if not isinstance(current, dict) or token not in current:
                return False
            current = current[token]
    last_token = tokens[-1]
    if isinstance(last_token, int):
        if not isinstance(current, list) or last_token >= len(current):
            return False
        current[last_token] = value
        return True
    if not isinstance(current, dict):
        return False
    current[last_token] = value
    return True


def _normalize_review_queue_item(
    item: dict[str, Any],
    *,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    field_path = str(item.get("fieldPath") or "").strip()
    current_value = item.get("currentValue")
    if current_value is None:
        current_value = item.get("value")
    if payload is not None and field_path:
        payload_value = _get_value_at_path(payload, field_path)
        if payload_value is not None:
            current_value = str(payload_value or "").strip()
    resolved = bool(item.get("resolved", False))
    status = str(item.get("status") or "pending").strip() or "pending"
    if status in {"reviewed", "confirmed"}:
        resolved = True
    normalized = dict(item)
    normalized["id"] = str(item.get("id") or _review_item_id(field_path))
    normalized["section"] = str(item.get("section") or _review_item_section(field_path))
    normalized["field"] = str(item.get("field") or _review_item_field(field_path))
    normalized["value"] = str(current_value or "")
    normalized["currentValue"] = str(current_value or "")
    normalized["reason"] = str(item.get("reason") or item.get("notes") or "").strip()
    normalized["severity"] = str(item.get("severity") or "warning")
    normalized["resolved"] = resolved
    normalized["status"] = "confirmed" if resolved else status
    normalized["evidencePhotoIds"] = [
        str(photo_id)
        for photo_id in list(item.get("evidencePhotoIds") or [])
        if str(photo_id or "").strip()
    ]
    normalized["notes"] = str(item.get("notes") or normalized["reason"])
    normalized["needsReview"] = not resolved
    return normalized


def _merge_review_queues(
    *,
    existing_queue: list[dict[str, Any]],
    next_queue: list[dict[str, Any]],
    payload: dict[str, Any],
) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for item in next_queue:
        normalized = _normalize_review_queue_item(item, payload=payload)
        field_path = str(normalized.get("fieldPath") or "").strip()
        if field_path:
            merged[field_path] = normalized
    for item in existing_queue:
        normalized_existing = _normalize_review_queue_item(item, payload=payload)
        field_path = str(normalized_existing.get("fieldPath") or "").strip()
        if not field_path:
            continue
        if field_path not in merged:
            merged[field_path] = normalized_existing
            continue
        current = merged[field_path]
        if bool(normalized_existing.get("resolved", False)):
            current["resolved"] = True
            current["status"] = str(normalized_existing.get("status") or "confirmed")
            current["needsReview"] = False
        current["id"] = str(normalized_existing.get("id") or current.get("id") or _review_item_id(field_path))
        current["currentValue"] = str(_get_value_at_path(payload, field_path) or "")
        current["value"] = current["currentValue"]
        if not str(current.get("label") or "").strip():
            current["label"] = normalized_existing.get("label", "")
        if not str(current.get("reason") or "").strip():
            current["reason"] = normalized_existing.get("reason", "")
        if not str(current.get("notes") or "").strip():
            current["notes"] = normalized_existing.get("notes", "")
        if not list(current.get("evidencePhotoIds") or []):
            current["evidencePhotoIds"] = list(normalized_existing.get("evidencePhotoIds") or [])
    return list(merged.values())


def _update_validation_from_review_queue(
    validation_result: dict[str, Any],
    review_queue: list[dict[str, Any]],
) -> dict[str, Any]:
    next_validation = dict(validation_result)
    blocking_issues = [
        str(message)
        for message in list(next_validation.get("blockingIssues") or [])
        if str(message or "").strip()
    ]
    warnings = [
        str(message)
        for message in list(next_validation.get("warnings") or [])
        if str(message or "").strip()
    ]
    unresolved_required = [
        item
        for item in review_queue
        if str(item.get("severity") or "") == "required" and not bool(item.get("resolved", False))
    ]
    unresolved_warning = [
        item
        for item in review_queue
        if str(item.get("severity") or "") in {"warning", "info"} and not bool(item.get("resolved", False))
    ]
    for item in unresolved_required:
        message = f"{str(item.get('label') or '').strip()}: {str(item.get('reason') or '사용자 확인이 필요합니다.').strip()}"
        if message not in blocking_issues:
            blocking_issues.append(message)
    if unresolved_required and "출력 전 필수 확인 항목이 남아 있습니다." not in warnings:
        warnings.append("출력 전 필수 확인 항목이 남아 있습니다.")
    if unresolved_warning and "검토 권장 항목이 남아 있습니다." not in warnings:
        warnings.append("검토 권장 항목이 남아 있습니다.")
    next_validation["blockingIssues"] = blocking_issues
    next_validation["warnings"] = warnings
    next_validation["reviewedFieldPaths"] = sorted(
        {
            str(item.get("fieldPath") or "").strip()
            for item in review_queue
            if bool(item.get("resolved", False)) and str(item.get("fieldPath") or "").strip()
        }
    )
    next_validation["valid"] = len(blocking_issues) == 0
    return next_validation


def apply_ai_draft_to_report(
    report: ReportRecord,
    run: AiRun,
    draft: dict[str, object],
    *,
    doc3_photo_ids: list[str],
    doc7_photo_ids: list[str],
) -> None:
    validation_result = dict(draft.get("validationResult", {}) or {})
    review_queue: list[dict[str, object]] = []
    existing_queue = [
        item
        for item in list(((report.payload.get("reviewMeta") or {}).get("reviewQueue") or []))
        if isinstance(item, dict)
    ]
    previous_payload = dict(report.payload)
    draft_review_queue = [
        item for item in list(draft.get("reviewQueue") or []) if isinstance(item, dict)
    ]

    minimum_photo_warning = None
    if not doc3_photo_ids and doc7_photo_ids:
        minimum_photo_warning = "현재 공정 또는 현장 전경 사진 1장을 함께 올리면 초안 정확도가 높아집니다."
        review_queue.append(
            {
                "id": _review_item_id("photoStepBuckets.step1_overview"),
                "section": "other",
                "field": "step1_overview",
                "fieldPath": "photoStepBuckets.step1_overview",
                "label": "현재 공정 또는 현장 전경 사진 보강",
                "currentValue": "",
                "suggestedValue": "",
                "source": "AI_PHOTO",
                "confidence": 0.35,
                "reason": minimum_photo_warning,
                "severity": "warning",
                "needsReview": True,
                "status": "pending",
                "evidencePhotoIds": list(doc7_photo_ids),
                "resolved": False,
                "notes": minimum_photo_warning,
            }
        )
    elif doc3_photo_ids and not doc7_photo_ids:
        minimum_photo_warning = "현재 위험요인 사진 1장을 함께 올리면 초안 정확도가 높아집니다."
        review_queue.append(
            {
                "id": _review_item_id("photoStepBuckets.step2_hazard"),
                "section": "other",
                "field": "step2_hazard",
                "fieldPath": "photoStepBuckets.step2_hazard",
                "label": "현재 위험요인 사진 보강",
                "currentValue": "",
                "suggestedValue": "",
                "source": "AI_PHOTO",
                "confidence": 0.35,
                "reason": minimum_photo_warning,
                "severity": "warning",
                "needsReview": True,
                "status": "pending",
                "evidencePhotoIds": list(doc3_photo_ids),
                "resolved": False,
                "notes": minimum_photo_warning,
            }
        )

    warnings = list(validation_result.get("warnings") or [])
    if minimum_photo_warning and minimum_photo_warning not in warnings:
        warnings.append(minimum_photo_warning)
    validation_result["warnings"] = warnings

    report.status = "draft_ready"
    report.payload["status"] = "draft_ready"
    report.payload["currentSection"] = "review"
    report.payload["wizardStep"] = "workspace"
    report.payload["photoEvidence"] = draft["photoEvidence"]
    report.payload["photoObservations"] = draft.get("photoObservations", [])
    report.payload["findingCandidates"] = draft["findingCandidates"]
    report.payload["sectionDrafts"] = draft["sectionDrafts"]
    report.payload["fieldProvenance"] = draft.get("fieldProvenance", [])
    report.payload["documentsCompat"] = {
        **(report.payload.get("documentsCompat") or {}),
        **(draft.get("documentsCompat") or {}),
    }
    report.payload["doc3PhotoCandidates"] = doc3_photo_ids
    report.payload["doc7PhotoCandidates"] = doc7_photo_ids
    report.payload["workspaceEntryMode"] = "guided_photo_flow"
    report.payload["doc11Doc12AutofillMode"] = "resource_autofill"
    report.payload["aiMeta"]["lastRunId"] = run.id
    report.payload["aiMeta"]["lastRunStatus"] = run.status
    report.payload["aiMeta"]["generatedAt"] = run.updated_at
    report.payload["aiMeta"]["sourceMix"] = ["vision", "system", "manual"]

    preserved_paths = {
        str(item.get("fieldPath") or "").strip()
        for item in existing_queue
        if isinstance(item, dict)
        and str(item.get("fieldPath") or "").strip()
        and bool(item.get("resolved", False) or str(item.get("status") or "").strip() in {"reviewed", "confirmed"})
    }
    for field_path in preserved_paths:
        previous_value = _get_value_at_path(previous_payload, field_path)
        if previous_value is not None:
            _set_value_at_path(report.payload, field_path, previous_value)

    merged_review_queue = _merge_review_queues(
        existing_queue=existing_queue,
        next_queue=[*review_queue, *draft_review_queue],
        payload=report.payload,
    )
    report.payload["reviewMeta"]["reviewQueue"] = merged_review_queue
    report.payload["reviewMeta"]["requiredFieldPaths"] = [
        "reportMeta.siteName",
        "reportMeta.customerName",
        "reportMeta.visitDate",
        "reportMeta.drafterName",
        "reportMeta.siteAddress",
        "reportMeta.siteContact",
        "reportMeta.progressRate",
        "reportMeta.visitCount",
        "reportMeta.totalVisitCount",
        "reportMeta.notificationMethod",
    ]
    report.payload["validationResult"] = _update_validation_from_review_queue(
        validation_result,
        merged_review_queue,
    )


def require_user(authorization: str | None = Header(default=None)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    token = authorization.removeprefix("Bearer ").strip()
    user = resolve_user_for_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid access token.")
    return user


def resolve_user_for_token(token: str) -> User | None:
    user_id = store.tokens.get(token)
    if not user_id or user_id not in store.users:
        return None
    return store.users[user_id]


def resolve_optional_user(authorization: str | None = Header(default=None)) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    return resolve_user_for_token(token)


def issue_auth_token(user: User) -> str:
    token = store.new_id("token")
    store.tokens[token] = user.id
    return token


def build_auth_response(user: User) -> AuthResponse:
    token = issue_auth_token(user)
    return AuthResponse(token=token, user=user.model_dump(exclude={"password"}))


def require_google_app_configuration() -> None:
    missing_fields: list[str] = []
    if not GOOGLE_APP_CLIENT_ID:
        missing_fields.append("GOOGLE_APP_CLIENT_ID")
    if not GOOGLE_APP_CLIENT_SECRET:
        missing_fields.append("GOOGLE_APP_CLIENT_SECRET")
    if missing_fields:
        raise HTTPException(
            status_code=503,
            detail=f"구글 로그인 설정이 아직 완료되지 않았습니다. ({', '.join(missing_fields)})",
        )


def build_google_auth_default_redirect() -> str:
    return f"{APP_BASE_URL.rstrip('/')}/auth/google/callback"


def validate_google_app_redirect_uri(requested_redirect_uri: str) -> str:
    requested = requested_redirect_uri.strip() or build_google_auth_default_redirect()
    allowed_redirects = GOOGLE_APP_ALLOWED_REDIRECT_URIS or [build_google_auth_default_redirect()]
    if requested not in allowed_redirects:
        raise HTTPException(status_code=409, detail="허용되지 않은 구글 로그인 redirect URI입니다.")
    return requested


def build_google_app_authorization_url(state: str, redirect_uri: str) -> str:
    query = urlencode(
        {
            "client_id": GOOGLE_APP_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
    )
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"


async def exchange_google_app_code(code: str, redirect_uri: str) -> dict[str, object]:
    require_google_app_configuration()
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_APP_CLIENT_ID,
                "client_secret": GOOGLE_APP_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        if not token_response.is_success:
            detail = token_response.text.strip() or "구글 토큰 교환에 실패했습니다."
            raise HTTPException(status_code=502, detail=f"구글 로그인 토큰 교환 실패: {detail}")

        token_payload = token_response.json()
        access_token = str(token_payload.get("access_token") or "").strip()
        if not access_token:
            raise HTTPException(status_code=502, detail="구글 로그인 access token을 받지 못했습니다.")

        profile_response = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if not profile_response.is_success:
            detail = profile_response.text.strip() or "구글 사용자 정보를 불러오지 못했습니다."
            raise HTTPException(status_code=502, detail=f"구글 사용자 정보 조회 실패: {detail}")

        return profile_response.json()


def resolve_or_create_google_user(profile: dict[str, object]) -> User:
    email = str(profile.get("email") or "").strip().lower()
    subject = str(profile.get("sub") or "").strip()
    name = str(profile.get("name") or "").strip() or (email.split("@")[0] if email else "구글 사용자")
    picture = str(profile.get("picture") or "").strip() or None

    if not email or not subject:
        raise HTTPException(status_code=502, detail="구글 사용자 정보에 필수 식별값이 없습니다.")

    user = next(
        (
            item
            for item in store.users.values()
            if item.auth_provider == "google" and item.oauth_subject == subject
        ),
        None,
    )
    if user is None:
        user = next((item for item in store.users.values() if item.email.lower() == email), None)

    if user is None:
        user = User(
            id=store.new_id("user"),
            email=email,
            password="",
            name=name,
            auth_provider="google",
            oauth_subject=subject,
            avatar_url=picture,
            last_login_at=utcnow(),
        )
        store.users[user.id] = user
        create_workspace_membership_for_user(user, name=f"{name} 작업공간")
        return user

    user.email = email
    user.name = name
    user.auth_provider = "google"
    user.oauth_subject = subject
    user.avatar_url = picture
    user.is_anonymous = False
    user.last_login_at = utcnow()
    user.updated_at = utcnow()
    store.users[user.id] = user
    return user


def create_workspace_membership_for_user(
    user: User,
    *,
    name: str,
) -> tuple[Workspace, Membership]:
    workspace = Workspace(id=store.new_id("workspace"), name=name, owner_user_id=user.id)
    membership = Membership(id=store.new_id("member"), workspace_id=workspace.id, user_id=user.id)
    store.workspaces[workspace.id] = workspace
    store.memberships[membership.id] = membership
    grant_workspace_trial(workspace.id)
    ensure_workspace_seed(workspace.id, user)
    return workspace, membership


def build_workspace_membership_response(
    workspace: Workspace,
    membership: Membership,
) -> dict[str, object]:
    return {
      "workspace": workspace.model_dump(),
      "membership": membership.model_dump(),
      "creditBalance": ledger_balance(workspace.id),
    }


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


def require_drive_item_for_workspace(item_id: str, workspace_id: str) -> DriveItem:
    item = store.drive_items.get(item_id)
    if item is None or item.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Drive item not found.")
    return item


def create_drive_permission_record(
    *,
    workspace_id: str,
    item_id: str,
    principal_type: str,
    principal_id: str,
    role: str,
    created_by: str,
    email: str | None = None,
    expires_at: str | None = None,
) -> DrivePermission:
    permission = DrivePermission(
        id=store.new_id("perm"),
        workspace_id=workspace_id,
        item_id=item_id,
        principal_type=principal_type,  # type: ignore[arg-type]
        principal_id=principal_id,
        email=email,
        role=role,  # type: ignore[arg-type]
        expires_at=expires_at,
        created_by=created_by,
    )
    store.drive_permissions[permission.id] = permission
    return permission


def ensure_drive_item_permission_defaults(item: DriveItem) -> None:
    if list_drive_permissions_for_item(store, item.workspace_id, item.id):
        return
    owner_user_id = item.owner_user_id or item.created_by
    if owner_user_id:
        create_drive_permission_record(
            workspace_id=item.workspace_id,
            item_id=item.id,
            principal_type="user",
            principal_id=owner_user_id,
            role="owner",
            email=store.users.get(owner_user_id).email if owner_user_id in store.users else None,
            created_by=item.created_by or owner_user_id,
        )
    if not item.parent_id:
        create_drive_permission_record(
            workspace_id=item.workspace_id,
            item_id=item.id,
            principal_type="workspace",
            principal_id=item.workspace_id,
            role="editor",
            created_by=item.created_by or owner_user_id or "system",
        )


def seed_drive_permissions_for_workspace(workspace_id: str) -> None:
    rows = [
        item
        for item in store.drive_items.values()
        if item.workspace_id == workspace_id
    ]
    rows.sort(key=lambda item: (item.parent_id is not None, item.created_at, item.id))
    for item in rows:
        ensure_drive_item_permission_defaults(item)


def validate_group_in_workspace(group_id: str, workspace_id: str) -> WorkspaceGroup:
    group = store.workspace_groups.get(group_id)
    if group is None or group.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Workspace group not found.")
    return group


def validate_group_member_workspace_user(workspace_id: str, user_id: str) -> User:
    user = store.users.get(user_id)
    if user is None or not is_workspace_member(store, workspace_id, user_id):
        raise HTTPException(status_code=404, detail="Workspace user not found.")
    return user


def normalize_permission_principal(
    workspace_id: str,
    payload: DrivePermissionCreateRequest,
) -> tuple[str, str, str | None]:
    principal_type = payload.principal_type
    principal_id = str(payload.principal_id or "").strip()
    email = str(payload.email or "").strip().lower() or None

    if principal_type == "workspace":
        return principal_type, workspace_id, None
    if principal_type == "user":
        if not principal_id:
            raise HTTPException(status_code=400, detail="사용자 공유 대상이 필요합니다.")
        user = validate_group_member_workspace_user(workspace_id, principal_id)
        return principal_type, user.id, user.email.lower()
    if principal_type == "group":
        if not principal_id:
            raise HTTPException(status_code=400, detail="그룹 공유 대상이 필요합니다.")
        group = validate_group_in_workspace(principal_id, workspace_id)
        return principal_type, group.id, None
    if principal_type == "domain":
        domain = normalize_email_domain(principal_id or email)
        if not domain:
            raise HTTPException(status_code=400, detail="도메인 공유 대상이 필요합니다.")
        return principal_type, domain, None
    if principal_type == "anyone":
        return principal_type, "anyone", None
    raise HTTPException(status_code=400, detail="지원하지 않는 공유 대상입니다.")


def create_item_default_permissions(item: DriveItem, user: User) -> None:
    ensure_drive_item_permission_defaults(item)
    if item.parent_id:
        return
    if not any(
        permission.workspace_id == item.workspace_id
        and permission.item_id == item.id
        and permission.principal_type == "workspace"
        for permission in store.drive_permissions.values()
    ):
        create_drive_permission_record(
            workspace_id=item.workspace_id,
            item_id=item.id,
            principal_type="workspace",
            principal_id=item.workspace_id,
            role="editor",
            created_by=user.id,
        )


def transfer_drive_item_owner(
    workspace_id: str,
    item: DriveItem,
    actor: User,
    target_user: User,
) -> DrivePermission:
    if item.owner_user_id != actor.id:
        raise HTTPException(status_code=403, detail="소유자만 owner 권한을 변경할 수 있습니다.")

    current_owner_rows = [
        permission
        for permission in store.drive_permissions.values()
        if permission.workspace_id == workspace_id
        and permission.item_id == item.id
        and permission.principal_type == "user"
        and permission.role == "owner"
    ]
    for permission in current_owner_rows:
        if permission.principal_id == target_user.id:
            continue
        permission.role = "editor"
        permission.email = store.users.get(permission.principal_id).email.lower() if permission.principal_id in store.users else permission.email
        permission.expires_at = None
        permission.updated_at = utcnow()
        store.drive_permissions[permission.id] = permission

    target_permission = next(
        (
            permission
            for permission in store.drive_permissions.values()
            if permission.workspace_id == workspace_id
            and permission.item_id == item.id
            and permission.principal_type == "user"
            and permission.principal_id == target_user.id
        ),
        None,
    )
    if target_permission is None:
        target_permission = create_drive_permission_record(
            workspace_id=workspace_id,
            item_id=item.id,
            principal_type="user",
            principal_id=target_user.id,
            role="owner",
            email=target_user.email.lower(),
            created_by=actor.id,
        )
    else:
        target_permission.role = "owner"
        target_permission.email = target_user.email.lower()
        target_permission.expires_at = None
        target_permission.updated_at = utcnow()
        store.drive_permissions[target_permission.id] = target_permission

    item.owner_user_id = target_user.id
    item.updated_by_user_id = actor.id
    item.updated_at = utcnow()
    store.drive_items[item.id] = item
    return target_permission


def ensure_public_share_root(
    token: str,
) -> tuple[DriveShare, DriveItem]:
    share = next((item for item in store.drive_shares.values() if item.token == token), None)
    if share is None or not is_drive_share_active(share):
        raise HTTPException(status_code=404, detail="Shared item not found.")
    item = store.drive_items.get(share.item_id)
    if item is None or item.is_deleted or item.trashed_at:
        raise HTTPException(status_code=404, detail="Shared item not found.")
    ensure_drive_item_permission_defaults(item)
    return share, item


def require_public_share_access(
    share: DriveShare,
    item: DriveItem,
    user: User | None,
) -> dict[str, object]:
    try:
        return resolve_share_link_access(store, share, item, user)
    except PermissionError as error:
        if str(error) == "restricted_login_required":
            raise HTTPException(status_code=401, detail="로그인이 필요한 공유 링크입니다.") from error
        raise HTTPException(status_code=404, detail="Shared item not found.") from error
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Shared item not found.") from error
    except ValueError as error:
        raise HTTPException(status_code=404, detail="Shared item not found.") from error


def require_public_share_descendant(
    root_item: DriveItem,
    item_id: str,
) -> DriveItem:
    item = store.drive_items.get(item_id)
    if (
        item is None
        or item.workspace_id != root_item.workspace_id
        or item.is_deleted
        or item.trashed_at
        or not is_descendant_of(store, root_item.workspace_id, item.id, root_item.id)
    ):
        raise HTTPException(status_code=404, detail="Shared item not found.")
    return item


def parse_iso_datetime(value: str | None) -> datetime | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None


def serialize_workspace_mailbox_draft(draft: WorkspaceMailboxDraft) -> dict[str, object]:
    attachments = []
    for item in draft.attachments:
        if not isinstance(item, dict):
            continue
        attachments.append(
            {
                "filename": str(item.get("filename") or "attachment.bin"),
                "contentType": str(item.get("content_type") or "application/octet-stream"),
                "dataBase64": str(item.get("data_base64") or "") or None,
                "downloadHeaders": item.get("download_headers") if isinstance(item.get("download_headers"), dict) else None,
                "downloadUrl": str(item.get("download_url") or "") or None,
                "reportKey": str(item.get("report_key") or "") or None,
                "sizeBytes": int(item.get("size_bytes") or 0) if str(item.get("size_bytes") or "").strip() else None,
                "source": str(item.get("source") or "") or None,
            }
        )
    return {
        "id": draft.id,
        "accountId": draft.account_id,
        "subject": draft.subject,
        "body": draft.body,
        "recipients": draft.recipients,
        "ccRecipients": draft.cc_recipients,
        "attachments": attachments,
        "headquarterId": draft.headquarter_id,
        "siteId": draft.site_id,
        "reportKeys": draft.report_keys,
        "createdAt": draft.created_at,
        "updatedAt": draft.updated_at,
    }


def list_workspace_mailbox_drafts(
    workspace_id: str,
    *,
    account_id: str = "",
    query: str = "",
) -> list[WorkspaceMailboxDraft]:
    normalized_query = query.strip().lower()
    rows = [
        item
        for item in store.workspace_mailbox_drafts.values()
        if item.workspace_id == workspace_id
    ]
    if account_id:
        rows = [item for item in rows if item.account_id == account_id]
    if normalized_query:
        rows = [
            item
            for item in rows
            if normalized_query in " ".join(
                [
                    item.subject,
                    item.body,
                    " ".join(item.recipients),
                    " ".join(item.cc_recipients),
                    " ".join(item.report_keys),
                ]
            ).lower()
        ]
    return sorted(rows, key=lambda item: item.updated_at, reverse=True)


def serialize_workspace_photo_album_item(
    item: WorkspacePhotoAlbumItem,
    workspace_id: str,
) -> dict[str, object]:
    site_detail = get_site_detail_for_workspace(workspace_id, item.site_id) if item.site_id else None
    headquarter_detail = (
        site_detail.get("headquarter_detail")
        if isinstance(site_detail, dict) and isinstance(site_detail.get("headquarter_detail"), dict)
        else None
    )
    return {
        "id": item.id,
        "site_id": item.site_id,
        "site_name": str(site_detail.get("site_name") or "") if isinstance(site_detail, dict) else "",
        "headquarter_id": item.headquarter_id,
        "headquarter_name": str(headquarter_detail.get("name") or "") if isinstance(headquarter_detail, dict) else "",
        "round_no": item.round_no,
        "captured_at": item.captured_at,
        "file_name": item.file_name,
        "content_type": item.content_type,
        "size_bytes": item.size_bytes,
        "data_url": item.data_url,
        "source_kind": item.source_kind,
        "uploaded_by_user_id": item.uploaded_by_user_id,
        "uploaded_by_name": item.uploaded_by_name,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def list_workspace_photo_album_items(
    workspace_id: str,
    *,
    headquarter_id: str = "",
    site_id: str = "",
    query: str = "",
) -> list[WorkspacePhotoAlbumItem]:
    normalized_query = query.strip().lower()
    rows = [
        item
        for item in store.workspace_photo_album_items.values()
        if item.workspace_id == workspace_id
    ]
    if headquarter_id:
        rows = [item for item in rows if item.headquarter_id == headquarter_id]
    if site_id:
        rows = [item for item in rows if item.site_id == site_id]
    if normalized_query:
        rows = [
            item
            for item in rows
            if normalized_query in " ".join(
                [
                    item.file_name,
                    item.site_id,
                    item.headquarter_id,
                    item.uploaded_by_name,
                ]
            ).lower()
        ]
    return sorted(rows, key=lambda item: (item.captured_at, item.created_at, item.file_name), reverse=True)


def find_existing_headquarter_for_import(workspace_id: str, payload: dict[str, object]) -> dict[str, object] | None:
    management_number = str(payload.get("management_number") or "").strip()
    opening_number = str(payload.get("opening_number") or "").strip()
    name = str(payload.get("name") or "").strip()
    existing = list_headquarters_for_admin(workspace_id, limit=1000, offset=0)["rows"]
    for row in existing:
        if management_number and str(row.get("management_number") or "").strip() == management_number:
            return row
        if opening_number and str(row.get("opening_number") or "").strip() == opening_number:
            return row
        if name and str(row.get("name") or "").strip() == name:
            return row
    return None


def find_existing_site_for_import(workspace_id: str, payload: dict[str, object]) -> dict[str, object] | None:
    site_name = str(payload.get("site_name") or "").strip()
    headquarter_id = str(payload.get("headquarter_id") or "").strip()
    management_number = str(payload.get("management_number") or "").strip()
    existing = list_sites_for_admin(workspace_id, limit=5000, offset=0)["rows"]
    for row in existing:
        if management_number and str(row.get("management_number") or "").strip() == management_number:
            return row
        if site_name and headquarter_id and row.get("site_name") == site_name and row.get("headquarter_id") == headquarter_id:
            return row
    return None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/mail/drafts")
def mail_drafts(
    account_id: str = Query(default="", alias="accountId"),
    query: str = "",
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    rows = list_workspace_mailbox_drafts(str(workspace["id"]), account_id=account_id, query=query)
    return {"rows": [serialize_workspace_mailbox_draft(draft) for draft in rows]}


@app.post("/api/v1/mail/drafts")
def mail_draft_create(
    payload: GuestWorkspaceMailboxDraftInput,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    timestamp = payload.saved_at or utcnow()
    draft = WorkspaceMailboxDraft(
        id=store.new_id("maildraft"),
        workspace_id=str(workspace["id"]),
        source_local_id=payload.local_id or None,
        account_id=payload.account_id,
        subject=payload.subject,
        body=payload.body,
        recipients=payload.recipients,
        cc_recipients=payload.cc_recipients,
        attachments=payload.attachments,
        headquarter_id=payload.headquarter_id,
        site_id=payload.site_id,
        report_keys=payload.report_keys,
        created_at=timestamp,
        updated_at=timestamp,
    )
    store.workspace_mailbox_drafts[draft.id] = draft
    return serialize_workspace_mailbox_draft(draft)


@app.patch("/api/v1/mail/drafts/{draft_id}")
def mail_draft_update(
    draft_id: str,
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    draft = store.workspace_mailbox_drafts.get(draft_id)
    if draft is None or draft.workspace_id != str(workspace["id"]):
        raise HTTPException(status_code=404, detail="Mail draft not found.")
    if "account_id" in payload:
        draft.account_id = str(payload.get("account_id") or "")
    if "subject" in payload:
        draft.subject = str(payload.get("subject") or "")
    if "body" in payload:
        draft.body = str(payload.get("body") or "")
    if "recipients" in payload and isinstance(payload.get("recipients"), list):
        draft.recipients = [str(item).strip() for item in payload.get("recipients", []) if str(item).strip()]
    if "cc_recipients" in payload and isinstance(payload.get("cc_recipients"), list):
        draft.cc_recipients = [str(item).strip() for item in payload.get("cc_recipients", []) if str(item).strip()]
    if "attachments" in payload and isinstance(payload.get("attachments"), list):
        draft.attachments = [
            item for item in payload.get("attachments", []) if isinstance(item, dict)
        ]
    if "headquarter_id" in payload:
        draft.headquarter_id = str(payload.get("headquarter_id") or "")
    if "site_id" in payload:
        draft.site_id = str(payload.get("site_id") or "")
    if "report_keys" in payload and isinstance(payload.get("report_keys"), list):
        draft.report_keys = [str(item).strip() for item in payload.get("report_keys", []) if str(item).strip()]
    draft.updated_at = utcnow()
    store.workspace_mailbox_drafts[draft.id] = draft
    return serialize_workspace_mailbox_draft(draft)


@app.delete("/api/v1/mail/drafts/{draft_id}")
def mail_draft_delete(draft_id: str, user: User = Depends(require_user)) -> dict[str, bool]:
    workspace = require_workspace_payload(user)
    draft = store.workspace_mailbox_drafts.get(draft_id)
    if draft is None or draft.workspace_id != str(workspace["id"]):
        raise HTTPException(status_code=404, detail="Mail draft not found.")
    del store.workspace_mailbox_drafts[draft.id]
    return {"ok": True}


@app.post("/api/v1/auth/signup", response_model=AuthResponse)
def signup(payload: SignupRequest) -> AuthResponse:
    existing = next((user for user in store.users.values() if user.email == payload.email), None)
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists.")

    user = User(id=store.new_id("user"), email=payload.email, password=payload.password, name=payload.name)
    store.users[user.id] = user
    return build_auth_response(user)


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

    user.last_login_at = utcnow()
    user.updated_at = utcnow()
    return build_auth_response(user)


@app.post("/api/v1/auth/anonymous", response_model=AuthResponse)
def anonymous_auth() -> AuthResponse:
    anonymous_id = store.new_id("anon")
    user = User(
        id=anonymous_id,
        email=f"{anonymous_id}@local.invalid",
        password="",
        name="임시 작성자",
        is_anonymous=True,
        role="client_viewer",
        position="임시세션",
        organization_name="대한안전산업연구원",
    )
    store.users[user.id] = user
    create_workspace_membership_for_user(user, name="임시 보고서 작업공간")
    return build_auth_response(user)


@app.post("/api/v1/auth/google/start")
def google_auth_start(payload: GoogleAuthStartRequest) -> dict[str, str]:
    require_google_app_configuration()
    redirect_uri = validate_google_app_redirect_uri(payload.redirect_uri)
    state = store.new_id("google_state")
    store.auth_oauth_states[state] = {
        "redirect_uri": redirect_uri,
        "created_at": utcnow(),
    }
    return {
        "authorization_url": build_google_app_authorization_url(state, redirect_uri),
        "redirect_uri": redirect_uri,
        "state": state,
    }


@app.post("/api/v1/auth/google/complete", response_model=AuthResponse)
async def google_auth_complete(payload: GoogleAuthCompleteRequest) -> AuthResponse:
    state_doc = store.auth_oauth_states.get(payload.state.strip())
    if state_doc is None:
        raise HTTPException(status_code=404, detail="유효하지 않은 구글 로그인 요청입니다.")

    redirect_uri = validate_google_app_redirect_uri(payload.redirect_uri)
    expected_redirect_uri = str(state_doc.get("redirect_uri") or "").strip()
    if expected_redirect_uri and expected_redirect_uri != redirect_uri:
        raise HTTPException(status_code=409, detail="구글 로그인 redirect URI가 일치하지 않습니다.")

    profile = await exchange_google_app_code(payload.code.strip(), redirect_uri)
    store.auth_oauth_states.pop(payload.state.strip(), None)
    user = resolve_or_create_google_user(profile)
    return build_auth_response(user)


@app.post("/api/v1/auth/claim-anonymous")
def claim_anonymous_workspace(
    payload: ClaimAnonymousRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    if user.is_anonymous:
        raise HTTPException(status_code=400, detail="Google 로그인 후 다시 시도해 주세요.")

    anonymous_user = resolve_user_for_token(payload.anonymous_token.strip())
    if anonymous_user is None or not anonymous_user.is_anonymous:
        raise HTTPException(status_code=404, detail="임시 세션을 찾을 수 없습니다.")

    transferred_workspace: Workspace | None = None
    transferred_membership: Membership | None = None

    for membership in list(store.memberships.values()):
        if membership.user_id != anonymous_user.id:
            continue

        workspace = store.workspaces.get(membership.workspace_id)
        if workspace is None:
            continue

        workspace.owner_user_id = user.id
        matching_membership = next(
            (
                item
                for item in store.memberships.values()
                if item.workspace_id == workspace.id and item.user_id == user.id
            ),
            None,
        )

        if matching_membership is None:
            matching_membership = Membership(
                id=store.new_id("member"),
                workspace_id=workspace.id,
                user_id=user.id,
                role="owner",
            )
            store.memberships[matching_membership.id] = matching_membership

        del store.memberships[membership.id]
        transferred_workspace = workspace
        transferred_membership = matching_membership

    for token, token_user_id in list(store.tokens.items()):
        if token_user_id == anonymous_user.id:
            del store.tokens[token]

    if transferred_workspace is None or transferred_membership is None:
        raise HTTPException(status_code=404, detail="이전할 임시 작업공간이 없습니다.")

    return build_workspace_membership_response(transferred_workspace, transferred_membership)


@app.get("/api/v1/auth/me")
def auth_me(user: User = Depends(require_user)) -> dict[str, object]:
    return user.model_dump(exclude={"password"})


@app.post("/api/v1/workspaces")
def create_workspace(payload: CreateWorkspaceRequest, user: User = Depends(require_user)) -> dict[str, object]:
    workspace, membership = create_workspace_membership_for_user(user, name=payload.name)
    return build_workspace_membership_response(workspace, membership)


@app.get("/api/v1/workspaces/me")
def list_my_workspaces(user: User = Depends(require_user)) -> list[dict[str, object]]:
    memberships = [item for item in store.memberships.values() if item.user_id == user.id]
    response = []
    for membership in memberships:
        workspace = store.workspaces[membership.workspace_id]
        ensure_workspace_seed(workspace.id, user)
        response.append(
            {
                "workspace": workspace.model_dump(),
                "membership": membership.model_dump(),
                "creditBalance": ledger_balance(workspace.id),
            }
        )
    return response


@app.post("/api/v1/workspaces/import-guest-cache")
def import_guest_workspace_cache(
    payload: ImportGuestWorkspaceCacheRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])

    headquarter_id_map: dict[str, str] = {}
    site_id_map: dict[str, str] = {}
    drive_id_map: dict[str, str] = {}
    share_id_map: dict[str, str] = {}
    imported_counts = {
        "headquarters": 0,
        "sites": 0,
        "mailboxDrafts": 0,
        "photoAlbum": 0,
        "driveItems": 0,
        "driveShares": 0,
    }

    for headquarter in payload.directory.headquarters:
        local_id = str(headquarter.get("id") or headquarter.get("local_id") or "").strip()
        existing = find_existing_headquarter_for_import(workspace_id, headquarter)
        if existing is None and str(headquarter.get("name") or "").strip():
            existing = create_headquarter(workspace_id, headquarter)
            imported_counts["headquarters"] += 1
        if existing is not None and local_id:
            headquarter_id_map[local_id] = str(existing.get("id") or "")

    for site in payload.directory.sites:
        local_id = str(site.get("id") or site.get("local_id") or "").strip()
        site_payload = dict(site)
        headquarter_id = str(site_payload.get("headquarter_id") or "").strip()
        if headquarter_id in headquarter_id_map:
            site_payload["headquarter_id"] = headquarter_id_map[headquarter_id]
        existing = find_existing_site_for_import(workspace_id, site_payload)
        if existing is None and str(site_payload.get("site_name") or "").strip():
            existing = create_site(workspace_id, site_payload)
            imported_counts["sites"] += 1
        if existing is not None and local_id:
            site_id_map[local_id] = str(existing.get("id") or "")

    for draft in payload.mailbox_drafts:
        existing = next(
            (
                item
                for item in store.workspace_mailbox_drafts.values()
                if item.workspace_id == workspace_id
                and item.source_local_id
                and item.source_local_id == draft.local_id
            ),
            None,
        )
        if existing is not None:
            continue
        timestamp = draft.saved_at or utcnow()
        draft_record = WorkspaceMailboxDraft(
            id=store.new_id("maildraft"),
            workspace_id=workspace_id,
            source_local_id=draft.local_id or None,
            account_id=draft.account_id,
            subject=draft.subject,
            body=draft.body,
            recipients=draft.recipients,
            cc_recipients=draft.cc_recipients,
            attachments=draft.attachments,
            headquarter_id=draft.headquarter_id,
            site_id=draft.site_id,
            report_keys=draft.report_keys,
            created_at=timestamp,
            updated_at=timestamp,
        )
        store.workspace_mailbox_drafts[draft_record.id] = draft_record
        imported_counts["mailboxDrafts"] += 1

    for photo in payload.photo_album:
        existing = next(
            (
                item
                for item in store.workspace_photo_album_items.values()
                if item.workspace_id == workspace_id
                and item.source_local_id
                and item.source_local_id == photo.local_id
            ),
            None,
        )
        if existing is not None:
            continue
        headquarter_id = headquarter_id_map.get(photo.headquarter_id, photo.headquarter_id)
        site_id = site_id_map.get(photo.site_id, photo.site_id)
        photo_record = WorkspacePhotoAlbumItem(
            id=store.new_id("wphoto"),
            workspace_id=workspace_id,
            source_local_id=photo.local_id or None,
            headquarter_id=headquarter_id,
            site_id=site_id,
            round_no=photo.round_no,
            captured_at=photo.captured_at or utcnow(),
            file_name=photo.file_name,
            content_type=photo.content_type,
            size_bytes=photo.size_bytes,
            data_url=photo.data_url,
            source_kind=photo.source_kind,
            uploaded_by_user_id=user.id,
            uploaded_by_name=user.name,
        )
        store.workspace_photo_album_items[photo_record.id] = photo_record
        imported_counts["photoAlbum"] += 1

    for drive_item in payload.drive.items:
        existing = next(
            (
                item
                for item in store.drive_items.values()
                if item.workspace_id == workspace_id
                and item.source_local_id
                and item.source_local_id == drive_item.local_id
            ),
            None,
        )
        if existing is not None:
            drive_id_map[drive_item.local_id] = existing.id
            continue

        item_record = DriveItem(
            id=store.new_id("drive"),
            workspace_id=workspace_id,
            source_local_id=drive_item.local_id or None,
            kind=drive_item.kind,
            name=drive_item.name,
            parent_id=None,
            headquarter_id=headquarter_id_map.get(drive_item.headquarter_id or "", drive_item.headquarter_id),
            site_id=site_id_map.get(drive_item.site_id or "", drive_item.site_id),
            file_type=drive_item.file_type,
            text_content=drive_item.text_content,
            external_url=drive_item.external_url,
            content_type=drive_item.content_type,
            size_bytes=drive_item.size_bytes,
            data_url=drive_item.data_url,
            thumbnail_data_url=drive_item.thumbnail_data_url,
            created_by=user.id,
            owner_user_id=user.id,
            updated_by_user_id=user.id,
        )
        store.drive_items[item_record.id] = item_record
        if drive_item.local_id:
            drive_id_map[drive_item.local_id] = item_record.id
        imported_counts["driveItems"] += 1

    for drive_item in payload.drive.items:
        if not drive_item.local_id:
            continue
        parent_local_id = drive_item.parent_local_id or ""
        if not parent_local_id or parent_local_id not in drive_id_map:
            continue
        drive_item_id = drive_id_map.get(drive_item.local_id)
        if not drive_item_id or drive_item_id not in store.drive_items:
            continue
        record = store.drive_items[drive_item_id]
        if record.parent_id != drive_id_map[parent_local_id]:
            record.parent_id = drive_id_map[parent_local_id]
            record.updated_at = utcnow()
            store.drive_items[drive_item_id] = record

    seed_drive_permissions_for_workspace(workspace_id)

    for share in payload.drive.shares:
        item_id = drive_id_map.get(share.item_local_id, share.item_local_id)
        if not item_id or item_id not in store.drive_items:
            continue
        existing = next(
            (
                item
                for item in store.drive_shares.values()
                if item.workspace_id == workspace_id
                and item.source_local_id
                and item.source_local_id == share.local_id
            ),
            None,
        )
        if existing is not None:
            share_id_map[share.local_id] = existing.id
            continue
        share_record = DriveShare(
            id=store.new_id("share"),
            workspace_id=workspace_id,
            source_local_id=share.local_id or None,
            token=store.new_id("public"),
            item_id=item_id,
            visibility=share.visibility,
            role=share.role,
            expires_at=share.expires_at,
            created_by=user.id,
        )
        store.drive_shares[share_record.id] = share_record
        if share.local_id:
            share_id_map[share.local_id] = share_record.id
        imported_counts["driveShares"] += 1

    return {
        "importedCounts": imported_counts,
        "idMap": {
            "directory": {
                "headquarters": headquarter_id_map,
                "sites": site_id_map,
            },
            "drive": {
                "items": drive_id_map,
                "shares": share_id_map,
            },
        },
    }


@app.get("/api/v1/photo-album")
def workspace_photo_album(
    headquarter_id: str = "",
    limit: int = 100,
    offset: int = 0,
    query: str = "",
    site_id: str = "",
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    rows = list_workspace_photo_album_items(
        str(workspace["id"]),
        headquarter_id=headquarter_id,
        site_id=site_id,
        query=query,
    )
    return {
        "rows": [
            serialize_workspace_photo_album_item(item, str(workspace["id"]))
            for item in rows[offset : offset + limit]
        ],
        "total": len(rows),
        "limit": limit,
        "offset": offset,
    }


@app.post("/api/v1/photo-album")
def workspace_photo_album_create(
    payload: GuestWorkspacePhotoAlbumInput,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    item = WorkspacePhotoAlbumItem(
        id=store.new_id("wphoto"),
        workspace_id=str(workspace["id"]),
        source_local_id=payload.local_id or None,
        headquarter_id=payload.headquarter_id,
        site_id=payload.site_id,
        round_no=payload.round_no,
        captured_at=payload.captured_at or utcnow(),
        file_name=payload.file_name,
        content_type=payload.content_type,
        size_bytes=payload.size_bytes,
        data_url=payload.data_url,
        source_kind=payload.source_kind,
        uploaded_by_user_id=user.id,
        uploaded_by_name=user.name,
    )
    store.workspace_photo_album_items[item.id] = item
    return serialize_workspace_photo_album_item(item, str(workspace["id"]))


@app.patch("/api/v1/photo-album/{item_id}")
def workspace_photo_album_update(
    item_id: str,
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    item = store.workspace_photo_album_items.get(item_id)
    if item is None or item.workspace_id != str(workspace["id"]):
        raise HTTPException(status_code=404, detail="Photo item not found.")
    if "round_no" in payload:
        item.round_no = int(payload.get("round_no") or 0)
    if "captured_at" in payload:
        item.captured_at = str(payload.get("captured_at") or item.captured_at)
    item.updated_at = utcnow()
    store.workspace_photo_album_items[item.id] = item
    return serialize_workspace_photo_album_item(item, str(workspace["id"]))


@app.delete("/api/v1/photo-album/{item_id}")
def workspace_photo_album_delete(item_id: str, user: User = Depends(require_user)) -> dict[str, bool]:
    workspace = require_workspace_payload(user)
    item = store.workspace_photo_album_items.get(item_id)
    if item is None or item.workspace_id != str(workspace["id"]):
        raise HTTPException(status_code=404, detail="Photo item not found.")
    del store.workspace_photo_album_items[item_id]
    return {"ok": True}


@app.get("/api/v1/drive/items")
def workspace_drive_items(
    parent_id: str | None = Query(default=None),
    include_deleted: bool = Query(default=False, alias="include_deleted"),
    query: str = "",
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    if parent_id:
        parent = require_drive_item_for_workspace(parent_id, workspace_id)
        if not include_deleted and (parent.is_deleted or parent.trashed_at):
            raise HTTPException(status_code=404, detail="Drive item not found.")
        if not can_read_item(store, user, parent):
            raise HTTPException(status_code=404, detail="Drive item not found.")
    rows = list_drive_items(
        store,
        workspace_id,
        parent_id=parent_id,
        include_deleted=include_deleted,
        query=query,
    )
    rows = [item for item in rows if can_read_item(store, user, item)]
    return {
        "rows": [serialize_drive_item(item) for item in rows],
    }


@app.post("/api/v1/drive/items")
def workspace_drive_item_create(payload: GuestWorkspaceDriveItemInput, user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    parent_id = payload.parent_local_id
    if parent_id:
        parent = require_drive_item_for_workspace(parent_id, workspace_id)
        if parent.is_deleted or parent.trashed_at or not can_edit_item(store, user, parent):
            raise HTTPException(status_code=404, detail="Drive item not found.")
    item = DriveItem(
        id=store.new_id("drive"),
        workspace_id=workspace_id,
        source_local_id=payload.local_id or None,
        kind=payload.kind,
        name=payload.name,
        parent_id=parent_id,
        headquarter_id=payload.headquarter_id,
        site_id=payload.site_id,
        file_type=payload.file_type,
        text_content=payload.text_content,
        external_url=payload.external_url,
        content_type=payload.content_type,
        size_bytes=payload.size_bytes,
        data_url=payload.data_url,
        thumbnail_data_url=payload.thumbnail_data_url,
        created_by=user.id,
        owner_user_id=user.id,
        updated_by_user_id=user.id,
    )
    store.drive_items[item.id] = item
    create_item_default_permissions(item, user)
    return serialize_drive_item(item)


@app.patch("/api/v1/drive/items/{item_id}")
def workspace_drive_item_update(
    item_id: str,
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    item = require_drive_item_for_workspace(item_id, workspace_id)
    if not can_edit_item(store, user, item):
        raise HTTPException(status_code=404, detail="Drive item not found.")
    did_mutate_content = False
    if "name" in payload:
        item.name = str(payload.get("name") or item.name)
        did_mutate_content = True
    if "parent_id" in payload:
        next_parent_id = str(payload.get("parent_id") or "") or None
        if next_parent_id:
            next_parent = require_drive_item_for_workspace(next_parent_id, workspace_id)
            if next_parent.is_deleted or next_parent.trashed_at or not can_edit_item(store, user, next_parent):
                raise HTTPException(status_code=404, detail="Drive item not found.")
            if next_parent.id == item.id or is_descendant_of(store, workspace_id, next_parent.id, item.id):
                raise HTTPException(status_code=400, detail="Drive item을 자기 하위 폴더로 이동할 수 없습니다.")
            item.parent_id = next_parent.id
        else:
            item.parent_id = None
        did_mutate_content = True
    if "text_content" in payload:
        item.text_content = str(payload.get("text_content") or "")
        did_mutate_content = True
    if "external_url" in payload:
        item.external_url = str(payload.get("external_url") or "")
        did_mutate_content = True
    if "file_type" in payload:
        next_file_type = str(payload.get("file_type") or "") or None
        item.file_type = next_file_type  # type: ignore[assignment]
        did_mutate_content = True
    if "content_type" in payload:
        item.content_type = str(payload.get("content_type") or "application/octet-stream")
        did_mutate_content = True
    if "size_bytes" in payload:
        try:
            item.size_bytes = max(0, int(payload.get("size_bytes") or 0))
        except (TypeError, ValueError):
            item.size_bytes = 0
        did_mutate_content = True
    if "data_url" in payload:
        item.data_url = str(payload.get("data_url") or "")
        did_mutate_content = True
    if "thumbnail_data_url" in payload:
        item.thumbnail_data_url = str(payload.get("thumbnail_data_url") or "")
        did_mutate_content = True
    if "headquarter_id" in payload:
        item.headquarter_id = str(payload.get("headquarter_id") or "") or None
        did_mutate_content = True
    if "site_id" in payload:
        item.site_id = str(payload.get("site_id") or "") or None
        did_mutate_content = True
    if "is_deleted" in payload:
        item.is_deleted = bool(payload.get("is_deleted"))
        item.trashed_at = utcnow() if item.is_deleted else None
        did_mutate_content = True
    if payload.get("restore"):
        item.is_deleted = False
        item.trashed_at = None
        did_mutate_content = True
    if "is_starred" in payload:
        item.is_starred = bool(payload.get("is_starred"))
    if "last_opened_at" in payload:
        next_last_opened_at = str(payload.get("last_opened_at") or "").strip()
        item.last_opened_at = next_last_opened_at or None
    if did_mutate_content:
        item.updated_by_user_id = user.id
        item.updated_at = utcnow()
    store.drive_items[item.id] = item
    return serialize_drive_item(item)


@app.delete("/api/v1/drive/items/{item_id}")
def workspace_drive_item_delete(
    item_id: str,
    purge: bool = False,
    user: User = Depends(require_user),
) -> dict[str, bool]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    item = require_drive_item_for_workspace(item_id, workspace_id)
    if not can_edit_item(store, user, item):
        raise HTTPException(status_code=404, detail="Drive item not found.")
    if purge:
        purge_drive_item_tree(store, workspace_id, item_id)
        return {"ok": True}
    item.is_deleted = True
    item.trashed_at = utcnow()
    item.updated_by_user_id = user.id
    item.updated_at = utcnow()
    store.drive_items[item.id] = item
    return {"ok": True}


@app.get("/api/v1/drive/items/{item_id}/permissions")
def workspace_drive_permissions(
    item_id: str,
    include_inherited: bool = Query(default=True, alias="include_inherited"),
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    item = require_drive_item_for_workspace(item_id, workspace_id)
    if not can_share_item(store, user, item):
        raise HTTPException(status_code=404, detail="Drive item not found.")
    rows = (
        list_effective_permissions(store, item)
        if include_inherited
        else [serialize_drive_permission(store, permission) for permission in list_drive_permissions_for_item(store, workspace_id, item.id)]
    )
    return {"rows": rows}


@app.post("/api/v1/drive/items/{item_id}/permissions")
def workspace_drive_permission_create(
    item_id: str,
    payload: DrivePermissionCreateRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    item = require_drive_item_for_workspace(item_id, workspace_id)
    if not can_share_item(store, user, item):
        raise HTTPException(status_code=404, detail="Drive item not found.")
    principal_type, principal_id, email = normalize_permission_principal(workspace_id, payload)
    if payload.role == "owner":
        if principal_type != "user":
            raise HTTPException(status_code=400, detail="owner 권한은 사용자에게만 부여할 수 있습니다.")
        target_user = validate_group_member_workspace_user(workspace_id, principal_id)
        return serialize_drive_permission(
            store,
            transfer_drive_item_owner(workspace_id, item, user, target_user),
        )
    existing = next(
        (
            permission
            for permission in store.drive_permissions.values()
            if permission.workspace_id == workspace_id
            and permission.item_id == item.id
            and permission.principal_type == principal_type
            and permission.principal_id == principal_id
        ),
        None,
    )
    if existing is not None:
        existing.role = payload.role
        existing.email = email
        existing.expires_at = payload.expires_at
        existing.updated_at = utcnow()
        store.drive_permissions[existing.id] = existing
        return serialize_drive_permission(store, existing)
    permission = create_drive_permission_record(
        workspace_id=workspace_id,
        item_id=item.id,
        principal_type=principal_type,
        principal_id=principal_id,
        role=payload.role,
        email=email,
        expires_at=payload.expires_at,
        created_by=user.id,
    )
    return serialize_drive_permission(store, permission)


@app.patch("/api/v1/drive/permissions/{permission_id}")
def workspace_drive_permission_update(
    permission_id: str,
    payload: DrivePermissionUpdateRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    permission = store.drive_permissions.get(permission_id)
    if permission is None or permission.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Drive permission not found.")
    item = require_drive_item_for_workspace(permission.item_id, workspace_id)
    if not can_share_item(store, user, item):
        raise HTTPException(status_code=404, detail="Drive item not found.")
    if permission.role == "owner" or payload.role == "owner":
        if item.owner_user_id != user.id:
            raise HTTPException(status_code=403, detail="소유자만 owner 권한을 변경할 수 있습니다.")
        raise HTTPException(status_code=400, detail="owner 권한 변경은 현재 MVP에서 지원하지 않습니다.")
    if payload.role is not None:
        permission.role = payload.role
    permission.expires_at = payload.expires_at
    permission.updated_at = utcnow()
    store.drive_permissions[permission.id] = permission
    return serialize_drive_permission(store, permission)


@app.post("/api/v1/drive/items/{item_id}/transfer-owner")
def workspace_drive_transfer_owner(
    item_id: str,
    payload: DriveOwnerTransferRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    item = require_drive_item_for_workspace(item_id, workspace_id)
    target_user = validate_group_member_workspace_user(workspace_id, payload.target_user_id)
    permission = transfer_drive_item_owner(workspace_id, item, user, target_user)
    return serialize_drive_permission(store, permission)


@app.delete("/api/v1/drive/permissions/{permission_id}")
def workspace_drive_permission_delete(
    permission_id: str,
    user: User = Depends(require_user),
) -> dict[str, bool]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    permission = store.drive_permissions.get(permission_id)
    if permission is None or permission.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Drive permission not found.")
    item = require_drive_item_for_workspace(permission.item_id, workspace_id)
    if not can_share_item(store, user, item):
        raise HTTPException(status_code=404, detail="Drive item not found.")
    if permission.role == "owner":
        if item.owner_user_id != user.id:
            raise HTTPException(status_code=403, detail="소유자만 owner 권한을 변경할 수 있습니다.")
        raise HTTPException(status_code=400, detail="기본 owner 권한은 삭제할 수 없습니다.")
    del store.drive_permissions[permission.id]
    return {"ok": True}


@app.get("/api/v1/drive/groups")
def workspace_drive_groups(user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    rows = list_workspace_groups(store, str(workspace["id"]))
    return {"rows": [serialize_workspace_group(store, group) for group in rows]}


@app.post("/api/v1/drive/groups")
def workspace_drive_group_create(
    payload: WorkspaceGroupCreateRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    group = WorkspaceGroup(
        id=store.new_id("group"),
        workspace_id=workspace_id,
        name=payload.name.strip(),
        description=payload.description.strip(),
        created_by=user.id,
    )
    store.workspace_groups[group.id] = group
    return serialize_workspace_group(store, group)


@app.patch("/api/v1/drive/groups/{group_id}")
def workspace_drive_group_update(
    group_id: str,
    payload: WorkspaceGroupUpdateRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    group = validate_group_in_workspace(group_id, str(workspace["id"]))
    if payload.name is not None:
        group.name = payload.name.strip()
    if payload.description is not None:
        group.description = payload.description.strip()
    group.updated_at = utcnow()
    store.workspace_groups[group.id] = group
    return serialize_workspace_group(store, group)


@app.delete("/api/v1/drive/groups/{group_id}")
def workspace_drive_group_delete(group_id: str, user: User = Depends(require_user)) -> dict[str, bool]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    group = validate_group_in_workspace(group_id, workspace_id)
    del store.workspace_groups[group.id]
    for member_id, member in list(store.workspace_group_members.items()):
        if member.workspace_id == workspace_id and member.group_id == group.id:
            del store.workspace_group_members[member_id]
    for permission_id, permission in list(store.drive_permissions.items()):
        if permission.workspace_id == workspace_id and permission.principal_type == "group" and permission.principal_id == group.id:
            del store.drive_permissions[permission_id]
    return {"ok": True}


@app.post("/api/v1/drive/groups/{group_id}/members")
def workspace_drive_group_member_create(
    group_id: str,
    payload: WorkspaceGroupMemberCreateRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    group = validate_group_in_workspace(group_id, workspace_id)
    target_user = validate_group_member_workspace_user(workspace_id, payload.user_id)
    existing = next(
        (
            member
            for member in store.workspace_group_members.values()
            if member.workspace_id == workspace_id and member.group_id == group.id and member.user_id == target_user.id
        ),
        None,
    )
    if existing is None:
        existing = WorkspaceGroupMember(
            id=store.new_id("group-member"),
            workspace_id=workspace_id,
            group_id=group.id,
            user_id=target_user.id,
            created_by=user.id,
        )
        store.workspace_group_members[existing.id] = existing
    return serialize_workspace_group(store, group)


@app.delete("/api/v1/drive/groups/{group_id}/members/{member_id}")
def workspace_drive_group_member_delete(
    group_id: str,
    member_id: str,
    user: User = Depends(require_user),
) -> dict[str, bool]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    group = validate_group_in_workspace(group_id, workspace_id)
    member = store.workspace_group_members.get(member_id)
    if member is None or member.workspace_id != workspace_id or member.group_id != group.id:
        raise HTTPException(status_code=404, detail="Workspace group member not found.")
    del store.workspace_group_members[member.id]
    return {"ok": True}


@app.get("/api/v1/drive/shares")
def workspace_drive_shares(
    item_id: str = "",
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    if item_id:
        item = require_drive_item_for_workspace(item_id, workspace_id)
        if not can_share_item(store, user, item):
            raise HTTPException(status_code=404, detail="Drive item not found.")
    rows = [
        share
        for share in store.drive_shares.values()
        if share.workspace_id == workspace_id
        and (not item_id or share.item_id == item_id)
        and share.item_id in store.drive_items
        and can_share_item(store, user, store.drive_items[share.item_id])
    ]
    rows.sort(key=lambda item: item.created_at, reverse=True)
    return {
        "rows": [serialize_drive_share(share) for share in rows],
    }


@app.post("/api/v1/drive/shares")
def workspace_drive_share_create(
    payload: DriveShareLinkCreateRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    item_id = str(payload.item_id or payload.item_local_id or "").strip()
    item = require_drive_item_for_workspace(item_id, workspace_id)
    if not can_share_item(store, user, item):
        raise HTTPException(status_code=404, detail="Drive item not found.")
    share = DriveShare(
        id=store.new_id("share"),
        workspace_id=workspace_id,
        source_local_id=payload.local_id or None,
        token=store.new_id("public"),
        item_id=item.id,
        visibility=payload.visibility,
        role=payload.role,
        expires_at=payload.expires_at,
        created_by=user.id,
    )
    store.drive_shares[share.id] = share
    return serialize_drive_share(share)


@app.patch("/api/v1/drive/shares/{share_id}")
def workspace_drive_share_update(
    share_id: str,
    payload: DriveShareLinkUpdateRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    share = store.drive_shares.get(share_id)
    if share is None or share.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Drive share not found.")
    item = require_drive_item_for_workspace(share.item_id, workspace_id)
    if not can_share_item(store, user, item):
        raise HTTPException(status_code=404, detail="Drive item not found.")
    if payload.visibility is not None:
        share.visibility = payload.visibility
    if payload.role is not None:
        share.role = payload.role
    share.expires_at = payload.expires_at
    if payload.is_revoked is not None:
        share.is_revoked = payload.is_revoked
        share.revoked_at = utcnow() if payload.is_revoked else None
    share.updated_at = utcnow()
    store.drive_shares[share.id] = share
    return serialize_drive_share(share)


@app.delete("/api/v1/drive/shares/{share_id}")
def workspace_drive_share_delete(share_id: str, user: User = Depends(require_user)) -> dict[str, bool]:
    workspace = require_workspace_payload(user)
    workspace_id = str(workspace["id"])
    seed_drive_permissions_for_workspace(workspace_id)
    share = store.drive_shares.get(share_id)
    if share is None or share.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Drive share not found.")
    item = require_drive_item_for_workspace(share.item_id, workspace_id)
    if not can_share_item(store, user, item):
        raise HTTPException(status_code=404, detail="Drive item not found.")
    share.is_revoked = True
    share.revoked_at = utcnow()
    share.updated_at = utcnow()
    store.drive_shares[share.id] = share
    return {"ok": True}


@app.get("/api/v1/drive/shares/{token}")
def public_drive_share(
    token: str,
    user: User | None = Depends(resolve_optional_user),
) -> dict[str, object]:
    share, item = ensure_public_share_root(token)
    require_public_share_access(share, item, user)
    children = (
        [
            serialize_public_drive_item_metadata(child)
            for child in list_drive_items(store, item.workspace_id, parent_id=item.id)
            if not child.is_deleted and not child.trashed_at
        ]
        if item.kind == "folder"
        else []
    )
    return {
        "share": serialize_drive_share(share),
        "item": serialize_public_drive_item_content(item) if item.kind == "file" else serialize_public_drive_item_metadata(item),
        "path": [{"id": item.id, "name": item.name, "kind": item.kind}],
        "children": children,
        "root_item_id": item.id,
    }


@app.get("/api/v1/drive/shares/{token}/items")
def public_drive_share_children(
    token: str,
    parent_id: str | None = Query(default=None),
    user: User | None = Depends(resolve_optional_user),
) -> dict[str, object]:
    share, root_item = ensure_public_share_root(token)
    require_public_share_access(share, root_item, user)
    target_parent = root_item if not parent_id else require_public_share_descendant(root_item, parent_id)
    if target_parent.kind != "folder":
        raise HTTPException(status_code=404, detail="Shared item not found.")
    rows = [
        serialize_public_drive_item_metadata(child)
        for child in list_drive_items(store, root_item.workspace_id, parent_id=target_parent.id)
        if not child.is_deleted and not child.trashed_at
    ]
    return {
        "share": serialize_drive_share(share),
        "root_item": serialize_public_drive_item_metadata(root_item),
        "parent": serialize_public_drive_item_metadata(target_parent),
        "path": build_relative_drive_path(store, root_item.workspace_id, target_parent, root_item.id),
        "rows": rows,
    }


@app.get("/api/v1/drive/shares/{token}/items/{item_id}")
def public_drive_share_item(
    token: str,
    item_id: str,
    user: User | None = Depends(resolve_optional_user),
) -> dict[str, object]:
    share, root_item = ensure_public_share_root(token)
    require_public_share_access(share, root_item, user)
    item = require_public_share_descendant(root_item, item_id)
    return {
        "share": serialize_drive_share(share),
        "root_item": serialize_public_drive_item_metadata(root_item),
        "path": build_relative_drive_path(store, root_item.workspace_id, item, root_item.id),
        "item": serialize_public_drive_item_content(item),
    }


@app.post("/api/v1/billing/checkout")
def billing_checkout(payload: BillingCheckoutRequest, user: User = Depends(require_user)) -> dict[str, object]:
    require_workspace_access(payload.workspace_id, user)
    require_toss_configuration()
    package_info = BILLING_PACKAGES[payload.package_id]
    order = create_billing_order_document(
        workspace_id=payload.workspace_id,
        user_id=user.id,
        package_id=payload.package_id,
        amount_krw=package_info["amount_krw"],
        credits=package_info["credits"],
    )
    success_url, fail_url = build_toss_checkout_urls()
    toss_payment = toss_post(
        "/v1/payments",
        {
            "amount": package_info["amount_krw"],
            "flowMode": "DEFAULT",
            "method": "CARD",
            "orderId": order["id"],
            "orderName": order["order_name"],
            "successUrl": success_url,
            "failUrl": fail_url,
        },
        idempotency_key=str(order["id"]),
    )
    checkout = toss_payment.get("checkout") if isinstance(toss_payment.get("checkout"), dict) else {}
    order["checkout_url"] = checkout.get("url")
    order["status"] = "payment_created"
    order["approval_payload"] = toss_payment
    saved_order = save_billing_order(order)
    return {
      "checkoutUrl": saved_order.get("checkout_url"),
      "orderId": saved_order["id"],
      "workspaceId": payload.workspace_id,
      "package": package_info,
    }


@app.post("/api/v1/billing/confirm")
def billing_confirm(payload: BillingConfirmRequest, user: User = Depends(require_user)) -> dict[str, object]:
    order = get_billing_order(payload.order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="결제 주문을 찾을 수 없습니다.")
    require_workspace_access(str(order["workspace_id"]), user)
    if int(order["amount_krw"]) != payload.amount:
        raise HTTPException(status_code=409, detail="결제 금액이 주문 정보와 일치하지 않습니다.")

    if bool(order.get("credit_granted")) and str(order.get("payment_key") or "") == payload.payment_key:
        return {
            "ok": True,
            "order": order,
            "balance": ledger_balance(str(order["workspace_id"])),
        }

    confirmed_payment = toss_post(
        "/v1/payments/confirm",
        {
            "paymentKey": payload.payment_key,
            "orderId": payload.order_id,
            "amount": payload.amount,
        },
        idempotency_key=f"confirm:{payload.order_id}",
    )
    order["payment_key"] = payload.payment_key
    order["status"] = "paid"
    order["approved_at"] = str(confirmed_payment.get("approvedAt") or utcnow())
    order["approval_payload"] = confirmed_payment
    saved_order = save_billing_order(order)
    saved_order = grant_purchase_credits_once(saved_order, payment_key=payload.payment_key)
    return {
        "ok": True,
        "order": saved_order,
        "balance": ledger_balance(str(saved_order["workspace_id"])),
    }


@app.post("/api/v1/billing/webhooks/toss")
def billing_webhook(payload: TossWebhookRequest) -> dict[str, object]:
    order_id, payment_key, status, data = extract_webhook_payment_fields(payload)
    if not order_id:
        return {"ok": False, "message": "Webhook ignored because orderId is missing."}

    order = get_billing_order(order_id)
    if order is None:
        return {"ok": False, "message": "Webhook ignored because order was not found."}

    order["webhook_payload"] = {
        "eventType": payload.eventType,
        "createdAt": payload.createdAt,
        "data": data,
        "status": status,
    }
    if payment_key:
        order["payment_key"] = payment_key
    if status == "DONE":
        order["status"] = "paid"
    elif status:
        order["status"] = str(status).lower()
    saved_order = save_billing_order(order)

    if status == "DONE" and payment_key:
        saved_order = grant_purchase_credits_once(saved_order, payment_key=payment_key)

    return {
        "ok": True,
        "order": saved_order,
        "balance": ledger_balance(str(saved_order["workspace_id"])),
    }


@app.get("/api/v1/credits/balance")
def credits_balance(workspace_id: str, user: User = Depends(require_user)) -> dict[str, int]:
    require_workspace_access(workspace_id, user)
    return {"workspaceId": workspace_id, "balance": ledger_balance(workspace_id)}


@app.get("/api/v1/credits/ledger")
def credits_ledger(workspace_id: str, user: User = Depends(require_user)) -> list[dict[str, object]]:
    require_workspace_access(workspace_id, user)
    return [entry.model_dump() for entry in list_ledger_entries(workspace_id)]


@app.get("/api/v1/reports")
def list_reports(workspace_id: str, user: User = Depends(require_user)) -> list[dict[str, object]]:
    require_workspace_access(workspace_id, user)
    reports = [
        report
        for report in store.reports.values()
        if report.workspace_id == workspace_id
    ]
    reports.sort(key=lambda item: item.updated_at, reverse=True)
    return [serialize_report(report, user) for report in reports]


@app.post("/api/v1/reports")
def create_report(payload: CreateReportRequest, user: User = Depends(require_user)) -> dict[str, object]:
    require_workspace_access(payload.workspace_id, user)
    site = get_site_detail_for_workspace(payload.workspace_id, payload.site_id)
    if site is None:
        raise HTTPException(status_code=404, detail="선택한 현장을 찾을 수 없습니다.")

    workspace_name = store.workspaces[payload.workspace_id].name
    report_meta = build_report_meta_seed(
        payload=payload,
        site=site,
        user=user,
        workspace_name=workspace_name,
    )
    report_id = store.new_id("report")
    timestamp = utcnow()
    report = ReportRecord(
      id=report_id,
      workspace_id=payload.workspace_id,
      created_by=user.id,
      site_id=payload.site_id,
      headquarter_id=str(site.get("headquarter_id") or "") or None,
      payload={
        "id": report_id,
        "workspaceId": payload.workspace_id,
        "status": "draft",
        "currentSection": "photo-step-1",
        "reportMeta": report_meta,
        "reviewMeta": {
          "reviewCompleted": False,
          "reviewCompletedAt": None,
          "responsibilityConfirmed": False,
          "requiredFieldPaths": [
            "reportMeta.siteName",
            "reportMeta.customerName",
            "reportMeta.visitDate",
            "reportMeta.drafterName",
            "reportMeta.siteAddress",
            "reportMeta.siteContact",
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
        "photoObservations": [],
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
        "fieldProvenance": [],
        "documentsCompat": {},
        "createdAt": timestamp,
        "updatedAt": timestamp,
      },
      created_at=timestamp,
      updated_at=timestamp,
    )
    store.reports[report.id] = report
    return serialize_report(report, user)


@app.get("/api/v1/reports/{report_id}")
def get_report(report_id: str, user: User = Depends(require_user)) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
      raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    return serialize_report(report, user)


@app.patch("/api/v1/reports/{report_id}")
def patch_report(report_id: str, payload: UpdateReportRequest, user: User = Depends(require_user)) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    report.payload = payload.payload
    touch_report(report)
    return serialize_report(report, user)


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


def upload_guided_step_bucket(
    report: ReportRecord,
    *,
    report_id: str,
    user: User,
    step: str,
    payload: GuidedPhotoStepUploadRequest,
) -> dict[str, object]:
    step_config = {
        "step-1": {
            "bucket_step": "step1_overview",
            "default_category": "site_overview",
            "filename_prefix": "step1-photo",
            "wizard_step": "step1_overview",
            "current_section": "photo-step-1",
            "candidate_field": "doc3PhotoCandidates",
        },
        "step-2": {
            "bucket_step": "step2_hazard",
            "default_category": "hazard",
            "filename_prefix": "step2-photo",
            "wizard_step": "step2_hazard",
            "current_section": "photo-step-2",
            "candidate_field": "doc7PhotoCandidates",
        },
        "step-3": {
            "bucket_step": "step3_followup",
            "default_category": "followup",
            "filename_prefix": "step3-photo",
            "wizard_step": "step2_hazard",
            "current_section": "photo-step-2",
            "candidate_field": None,
        },
        "step-4": {
            "bucket_step": "step4_support",
            "default_category": "education",
            "filename_prefix": "step4-photo",
            "wizard_step": "step2_hazard",
            "current_section": "photo-step-2",
            "candidate_field": None,
        },
        "step-5": {
            "bucket_step": "step5_site_overview",
            "default_category": "site_overview",
            "filename_prefix": "step5-photo",
            "wizard_step": "step2_hazard",
            "current_section": "photo-step-2",
            "candidate_field": None,
        },
    }.get(step)
    if step_config is None:
        raise HTTPException(status_code=404, detail="Unknown guided photo step.")

    bucket = get_bucket(report.payload, str(step_config["bucket_step"]))
    uploaded = []
    for index, item in enumerate(payload.photos, start=1):
        photo = create_photo_asset(
            report_id,
            item,
            str(step_config["default_category"]),
            f"{step_config['filename_prefix']}-{index}.jpg",
        )
        store.photos[photo.id] = photo
        bucket["uploadedPhotoIds"].append(photo.id)
        if bucket["representativePhotoId"] is None:
            bucket["representativePhotoId"] = photo.id
        uploaded.append(photo.model_dump())

    if uploaded and bucket["status"] == "skipped":
        bucket["status"] = "ready"
    report.payload["wizardStep"] = str(step_config["wizard_step"])
    report.payload["currentSection"] = str(step_config["current_section"])
    candidate_field = step_config["candidate_field"]
    if isinstance(candidate_field, str):
        report.payload[candidate_field] = list(bucket["uploadedPhotoIds"])
    sync_guided_photo_state(report.payload)
    touch_report(report)
    return {"uploadedPhotos": uploaded, "report": serialize_report(report, user)}


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
    return upload_guided_step_bucket(report, report_id=report_id, user=user, step="step-1", payload=payload)


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
    return upload_guided_step_bucket(report, report_id=report_id, user=user, step="step-2", payload=payload)


@app.post("/api/v1/reports/{report_id}/photo-steps/step-3")
def upload_guided_step_three(
    report_id: str,
    payload: GuidedPhotoStepUploadRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    return upload_guided_step_bucket(report, report_id=report_id, user=user, step="step-3", payload=payload)


@app.post("/api/v1/reports/{report_id}/photo-steps/step-4")
def upload_guided_step_four(
    report_id: str,
    payload: GuidedPhotoStepUploadRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    return upload_guided_step_bucket(report, report_id=report_id, user=user, step="step-4", payload=payload)


@app.post("/api/v1/reports/{report_id}/photo-steps/step-5")
def upload_guided_step_five(
    report_id: str,
    payload: GuidedPhotoStepUploadRequest,
    user: User = Depends(require_user),
) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    return upload_guided_step_bucket(report, report_id=report_id, user=user, step="step-5", payload=payload)


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
    return {"report": serialize_report(report, user)}


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

    selected_photo_ids = set(payload.photo_asset_ids)
    doc3_photo_ids = [
        photo_id
        for photo_id in report.payload.get("doc3PhotoCandidates", [])
        if photo_id in selected_photo_ids
    ]
    doc7_photo_ids = [
        photo_id
        for photo_id in report.payload.get("doc7PhotoCandidates", [])
        if photo_id in selected_photo_ids
    ]

    run = AiRun(id=store.new_id("airun"), report_id=report_id, status="succeeded")
    draft = build_draft_from_photos(
        report_id,
        selected_photos,
        report_meta=report.payload.get("reportMeta", {}),
    )
    run.payload = draft
    store.ai_runs[run.id] = run

    apply_ai_draft_to_report(
        report,
        run,
        draft,
        doc3_photo_ids=doc3_photo_ids,
        doc7_photo_ids=doc7_photo_ids,
    )
    touch_report(report)
    return {"aiRun": run.model_dump(), "report": serialize_report(report, user)}


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
    draft = build_draft_from_guided_photos(
        report_id,
        overview_photos,
        hazard_photos,
        report_meta=report.payload.get("reportMeta", {}),
    )
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
    return {"aiRun": run.model_dump(), "report": serialize_report(report, user)}


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
    return serialize_report(report, user)


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
    ensure_export_disclaimer_acceptance(report, user, payload)
    export = create_export(report, "pdf")
    touch_report(report)
    return {
        "export": export.model_dump(),
        "balance": ledger_balance(report.workspace_id),
        "report": serialize_report(report, user),
        "exportDisclaimerAcceptance": get_export_disclaimer_acceptance(report.workspace_id, user.id),
    }


@app.post("/api/v1/reports/{report_id}/exports/hwpx")
def export_hwpx(report_id: str, payload: ExportRequest, user: User = Depends(require_user)) -> dict[str, object]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    if not report.review_completed or not payload.confirm_reviewed:
        raise HTTPException(status_code=409, detail="Review completion is required before export.")
    ensure_export_disclaimer_acceptance(report, user, payload)
    export = create_export(report, "hwpx")
    touch_report(report)
    return {
        "export": export.model_dump(),
        "balance": ledger_balance(report.workspace_id),
        "report": serialize_report(report, user),
        "exportDisclaimerAcceptance": get_export_disclaimer_acceptance(report.workspace_id, user.id),
    }


@app.get("/api/v1/reports/{report_id}/exports")
def export_history(report_id: str, user: User = Depends(require_user)) -> list[dict[str, object]]:
    report = store.reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_workspace_access(report.workspace_id, user)
    return [item.model_dump() for item in store.exports[report.id]]


def require_workspace_payload(user: User) -> dict[str, object]:
    try:
        return get_workspace_for_user(user)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post("/api/v1/safety/auth/token")
def safety_login(username: str = Form(...), password: str = Form(...)) -> dict[str, str]:
    user = next(
        (
            item
            for item in store.users.values()
            if item.email == username and item.password == password
        ),
        None,
    )
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    user.last_login_at = utcnow()
    user.updated_at = utcnow()
    token = store.new_id("token")
    store.tokens[token] = user.id
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/v1/safety/auth/me")
def safety_auth_me(user: User = Depends(require_user)) -> dict[str, object]:
    require_workspace_payload(user)
    return user.model_dump(exclude={"password"})


@app.get("/api/v1/safety/users")
def safety_users(
    active_only: bool = True,
    limit: int = 500,
    offset: int = 0,
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    workspace = require_workspace_payload(user)
    rows = list_workspace_users(workspace["id"])
    if active_only:
        rows = [item for item in rows if item.get("is_active", True)]
    return rows[offset : offset + limit]


@app.get("/api/v1/safety/headquarters")
def safety_headquarters(
    active_only: bool = True,
    id: str = "",
    limit: int = 500,
    offset: int = 0,
    query: str = "",
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    workspace = require_workspace_payload(user)
    response = list_headquarters_for_admin(
        workspace["id"],
        headquarter_id=id,
        limit=limit,
        offset=offset,
        query=query,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    rows = response["rows"]
    if active_only:
        rows = [item for item in rows if item.get("is_active", True)]
    return rows


@app.post("/api/v1/safety/headquarters")
def safety_create_headquarter(payload: dict[str, object], user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return create_headquarter(workspace["id"], payload)


@app.patch("/api/v1/safety/headquarters/{headquarter_id}")
def safety_update_headquarter(
    headquarter_id: str,
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    row = update_headquarter(workspace["id"], headquarter_id, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Headquarter not found.")
    return row


@app.delete("/api/v1/safety/headquarters/{headquarter_id}")
def safety_delete_headquarter(headquarter_id: str, user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    row = deactivate_headquarter(workspace["id"], headquarter_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Headquarter not found.")
    return row


@app.get("/api/v1/safety/sites")
def safety_sites(
    active_only: bool = True,
    include_headquarter_detail: bool = True,
    include_assigned_user: bool = True,
    assignment: str = "",
    headquarter_id: str = "",
    limit: int = 500,
    offset: int = 0,
    query: str = "",
    site_id: str = "",
    sort_by: str = "site_name",
    sort_dir: str = "asc",
    status: str = "",
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    workspace = require_workspace_payload(user)
    response = list_sites_for_admin(
        workspace["id"],
        assignment=assignment,
        headquarter_id=headquarter_id,
        limit=limit,
        offset=offset,
        query=query,
        site_id=site_id,
        sort_by=sort_by,
        sort_dir=sort_dir,
        status=status,
    )
    rows = response["rows"]
    if active_only:
        rows = [item for item in rows if item.get("is_active", True) and item.get("status") != "deleted"]
    if not include_headquarter_detail:
        for row in rows:
            row["headquarter_detail"] = None
    if not include_assigned_user:
        for row in rows:
            row["assigned_user"] = None
            row["assigned_users"] = []
    return rows


@app.post("/api/v1/safety/sites")
def safety_create_site(payload: dict[str, object], user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return create_site(workspace["id"], payload)


@app.get("/api/v1/safety/sites/{site_id}")
def safety_get_site(
    site_id: str,
    include_headquarter_detail: bool = True,
    include_assigned_user: bool = True,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    response = list_sites_for_admin(
        workspace["id"],
        limit=1,
        offset=0,
        site_id=site_id,
    )
    row = response["rows"][0] if response["rows"] else None
    if row is None:
        raise HTTPException(status_code=404, detail="Site not found.")
    if not include_headquarter_detail:
        row["headquarter_detail"] = None
    if not include_assigned_user:
        row["assigned_user"] = None
        row["assigned_users"] = []
    return row


@app.patch("/api/v1/safety/sites/{site_id}")
def safety_update_site(site_id: str, payload: dict[str, object], user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    row = update_site(workspace["id"], site_id, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Site not found.")
    return row


@app.delete("/api/v1/safety/sites/{site_id}")
def safety_delete_site(site_id: str, user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    row = deactivate_site(workspace["id"], site_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Site not found.")
    return row


@app.get("/api/v1/safety/assignments")
def safety_assignments(
    active_only: bool = True,
    limit: int = 500,
    offset: int = 0,
    site_id: str = "",
    user_id: str = "",
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    workspace = require_workspace_payload(user)
    return list_assignments(
        workspace["id"],
        active_only=active_only,
        limit=limit,
        offset=offset,
        site_id=site_id,
        user_id=user_id,
    )


@app.post("/api/v1/safety/assignments")
def safety_create_assignment(payload: dict[str, object], user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return create_assignment(workspace["id"], user.id, payload)


@app.patch("/api/v1/safety/assignments/{assignment_id}")
def safety_update_assignment(
    assignment_id: str,
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    row = update_assignment(workspace["id"], assignment_id, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    return row


@app.delete("/api/v1/safety/assignments/{assignment_id}")
def safety_delete_assignment(assignment_id: str, user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    row = deactivate_assignment(workspace["id"], assignment_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    return row


@app.get("/api/v1/safety/headquarter-assignments")
def safety_headquarter_assignments(
    active_only: bool = True,
    headquarter_id: str = "",
    limit: int = 500,
    offset: int = 0,
    user_id: str = "",
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    workspace = require_workspace_payload(user)
    return list_headquarter_assignments(
        workspace["id"],
        active_only=active_only,
        limit=limit,
        offset=offset,
        headquarter_id=headquarter_id,
        user_id=user_id,
    )


@app.post("/api/v1/safety/headquarter-assignments")
def safety_create_headquarter_assignment(
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return create_headquarter_assignment(workspace["id"], user.id, payload)


@app.patch("/api/v1/safety/headquarter-assignments/{assignment_id}")
def safety_update_headquarter_assignment(
    assignment_id: str,
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    row = update_headquarter_assignment(workspace["id"], assignment_id, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Headquarter assignment not found.")
    return row


@app.delete("/api/v1/safety/headquarter-assignments/{assignment_id}")
def safety_delete_headquarter_assignment(
    assignment_id: str,
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    row = deactivate_headquarter_assignment(workspace["id"], assignment_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Headquarter assignment not found.")
    return row


@app.get("/api/v1/safety/assignments/me/sites")
def safety_assigned_sites(
    active_only: bool = True,
    limit: int = 500,
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    workspace = require_workspace_payload(user)
    rows = list_assigned_sites_for_user(workspace["id"], user.id, limit=limit)
    if active_only:
        return rows
    return rows


@app.get("/api/v1/safety/headquarter-assignments/me")
def safety_assigned_headquarters(
    active_only: bool = True,
    limit: int = 500,
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    workspace = require_workspace_payload(user)
    rows = list_assigned_headquarters_for_user(workspace["id"], user.id, limit=limit)
    if active_only:
        return rows
    return rows


@app.get("/api/v1/safety/content-items")
def safety_content_items(
    active_only: bool = True,
    include_body: bool = False,
    limit: int = 1000,
    offset: int = 0,
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    _ = (active_only, include_body, limit, offset, user)
    return []


@app.get("/api/v1/safety/reports")
def safety_report_list(
    active_only: bool = True,
    limit: int = 100,
    site_id: str = "",
    report_key: str = "",
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    _ = active_only
    workspace = require_workspace_payload(user)
    return build_safety_report_list(workspace["id"], site_id=site_id, limit=limit, report_key=report_key)


@app.get("/api/v1/admin/headquarters/list")
def admin_headquarters_list(
    id: str = "",
    limit: int = 30,
    offset: int = 0,
    query: str = "",
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return list_headquarters_for_admin(
        workspace["id"],
        headquarter_id=id,
        limit=limit,
        offset=offset,
        query=query,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@app.get("/api/v1/admin/sites/list")
def admin_sites_list(
    assignment: str = "",
    headquarter_id: str = "",
    limit: int = 50,
    offset: int = 0,
    query: str = "",
    site_id: str = "",
    sort_by: str = "site_name",
    sort_dir: str = "asc",
    status: str = "",
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return list_sites_for_admin(
        workspace["id"],
        assignment=assignment,
        headquarter_id=headquarter_id,
        limit=limit,
        offset=offset,
        query=query,
        site_id=site_id,
        sort_by=sort_by,
        sort_dir=sort_dir,
        status=status,
    )


@app.get("/api/v1/admin/sites/{site_id}")
def admin_site_detail(site_id: str, user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    response = list_sites_for_admin(workspace["id"], limit=1, offset=0, site_id=site_id)
    row = response["rows"][0] if response["rows"] else None
    if row is None:
        raise HTTPException(status_code=404, detail="Site not found.")
    return row


@app.get("/api/v1/admin/users/list")
def admin_users_list(
    active_only: bool = True,
    limit: int = 50,
    offset: int = 0,
    query: str = "",
    role: str = "",
    sort_by: str = "name",
    sort_dir: str = "asc",
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    rows = list_workspace_users(workspace["id"])
    if active_only:
        rows = [item for item in rows if item.get("is_active", True)]
    if role:
        rows = [item for item in rows if item.get("role") == role]
    if query:
        rows = [item for item in rows if _contains_query([item.get("name"), item.get("email")], query)]
    reverse = sort_dir == "desc"
    rows.sort(key=lambda item: str(item.get(sort_by, "")), reverse=reverse)
    return {
        "limit": limit,
        "offset": offset,
        "refreshedAt": utcnow(),
        "rows": rows[offset : offset + limit],
        "total": len(rows),
    }


@app.get("/api/v1/admin/directory/assignments")
def admin_directory_assignments(
    active_only: bool = True,
    limit: int = 500,
    offset: int = 0,
    site_id: str = "",
    user_id: str = "",
    user: User = Depends(require_user),
) -> list[dict[str, object]]:
    workspace = require_workspace_payload(user)
    return list_assignments(
        workspace["id"],
        active_only=active_only,
        limit=limit,
        offset=offset,
        site_id=site_id,
        user_id=user_id,
    )


@app.get("/api/v1/admin/reports")
def admin_reports(
    limit: int = 20,
    offset: int = 0,
    mail_attachable_only: bool = False,
    query: str = "",
    report_key: str = "",
    site_id: str = "",
    sort_by: str = "updatedAt",
    sort_dir: str = "desc",
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return build_admin_reports_response(
        workspace["id"],
        limit=limit,
        offset=offset,
        mail_attachable_only=mail_attachable_only,
        query=query,
        report_key=report_key,
        site_id=site_id,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@app.get("/api/v1/admin/reports/{report_key}/original-pdf")
def admin_report_original_pdf(report_key: str, user: User = Depends(require_user)) -> Response:
    workspace = require_workspace_payload(user)
    report = store.reports.get(report_key)
    if report is None or report.workspace_id != workspace["id"]:
        raise HTTPException(status_code=404, detail="Report not found.")

    filename = f"{report_key}.pdf"
    return Response(
        content=MINIMAL_PDF_BYTES,
        media_type="application/pdf",
        headers={
            "content-disposition": f"attachment; filename={filename}",
        },
    )


@app.get("/api/v1/mail/accounts")
def mail_accounts(user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return {"rows": list_mail_accounts(workspace["id"], user.id)}


@app.get("/api/v1/mail/providers/status")
def mail_provider_statuses(
    google_redirect_uri: str = Query(default="", alias="googleRedirectUri"),
    user: User = Depends(require_user),
) -> dict[str, object]:
    _ = require_workspace_payload(user)
    return {
        "rows": [
            _mail_provider_status("google", google_redirect_uri),
        ]
    }


def _resolve_mail_provider(provider: str) -> str:
    if provider == "google":
        return "google"
    raise HTTPException(status_code=404, detail="SaaS 메일 연동은 현재 구글 로그인만 지원합니다.")


@app.post("/api/v1/mail/accounts/connect/{provider}/start")
def mail_connect_start(
    provider: str,
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    try:
        return start_mail_oauth(
            workspace["id"],
            user.id,
            _resolve_mail_provider(provider),  # type: ignore[arg-type]
            str(payload.get("redirect_uri") or ""),
        )
    except MailOAuthError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post("/api/v1/mail/accounts/connect/{provider}/complete")
def mail_connect_complete(
    provider: str,
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    try:
        return complete_mail_oauth(
            workspace["id"],
            user.id,
            _resolve_mail_provider(provider),  # type: ignore[arg-type]
            str(payload.get("state") or ""),
            str(payload.get("auth_code") or ""),
            str(payload.get("redirect_uri") or ""),
        )
    except MailOAuthError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.delete("/api/v1/mail/accounts/{account_id}")
def mail_disconnect(account_id: str, user: User = Depends(require_user)) -> dict[str, bool]:
    workspace = require_workspace_payload(user)
    disconnect_mail_account(workspace["id"], user.id, account_id)
    return {"ok": True}


@app.get("/api/v1/mail/threads")
def mail_threads(
    account_id: str = Query(default="", alias="accountId"),
    box: str = "",
    headquarter_id: str = Query(default="", alias="headquarterId"),
    limit: int = 100,
    offset: int = 0,
    query: str = "",
    report_key: str = Query(default="", alias="reportKey"),
    site_id: str = Query(default="", alias="siteId"),
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return list_mail_threads(
        workspace["id"],
        account_id=account_id,
        box=box,
        headquarter_id=headquarter_id,
        limit=limit,
        offset=offset,
        query=query,
        report_key=report_key,
        site_id=site_id,
    )


@app.get("/api/v1/mail/threads/{thread_id}")
def mail_thread_detail(thread_id: str, user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    detail = get_mail_thread_detail(workspace["id"], thread_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Mail thread not found.")
    return detail


@app.patch("/api/v1/mail/threads/{thread_id}")
def mail_thread_update(
    thread_id: str,
    payload: dict[str, object],
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    thread = update_mail_thread_state(workspace["id"], thread_id, payload)
    if thread is None:
        raise HTTPException(status_code=404, detail="Mail thread not found.")
    return thread


@app.get("/api/v1/mail/messages/{message_id}")
def mail_message_detail(message_id: str, user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    message = get_mail_message(workspace["id"], message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Mail message not found.")
    return message


@app.get("/api/v1/mail/recipient-suggestions")
def mail_recipient_suggestions(
    account_id: str = Query(default="", alias="accountId"),
    limit: int = 8,
    query: str = "",
    user: User = Depends(require_user),
) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return {"rows": build_recipient_suggestions(workspace["id"], account_id=account_id, limit=limit, query=query)}


@app.post("/api/v1/mail/send")
def mail_send(payload: dict[str, object], user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    try:
        return send_mail_message(workspace["id"], user.id, payload)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post("/api/v1/mail/send-report")
def mail_send_report(payload: dict[str, object], user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    try:
        return send_mail_message(workspace["id"], user.id, payload)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post("/api/v1/mail/prepare-report")
def mail_prepare_report(payload: dict[str, object], user: User = Depends(require_user)) -> dict[str, object]:
    _ = (payload, require_workspace_payload(user))
    return {"prepared": True, "skipped": None}


@app.post("/api/v1/mail/sync")
def mail_sync(user: User = Depends(require_user)) -> dict[str, object]:
    workspace = require_workspace_payload(user)
    return sync_mail_accounts(workspace["id"], user.id)
