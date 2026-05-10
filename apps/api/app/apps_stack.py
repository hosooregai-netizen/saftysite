from __future__ import annotations

import base64
from collections import defaultdict
from datetime import datetime, timedelta
from email.message import EmailMessage
from email.utils import formataddr
from email.utils import getaddresses, parseaddr
from html import escape
import re
from typing import Any, Literal
from urllib.parse import urlencode
from uuid import uuid4

import httpx
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import DuplicateKeyError

from .config import (
    APP_BASE_URL,
    GOOGLE_MAIL_ALLOWED_REDIRECT_URIS,
    GOOGLE_MAIL_CLIENT_ID,
    GOOGLE_MAIL_CLIENT_SECRET,
    MAIL_ACCOUNT_TOKEN_SECRET,
    MONGODB_DB_NAME,
    MONGODB_URI,
    NAVER_MAIL_ALLOWED_REDIRECT_URIS,
    NAVER_MAIL_CLIENT_ID,
    NAVER_MAIL_CLIENT_SECRET,
    NAVER_WORKS_ALLOWED_REDIRECT_URIS,
    NAVER_WORKS_CLIENT_ID,
    NAVER_WORKS_CLIENT_SECRET,
)
from .mail_google_service import (
    GoogleMailHistoryExpiredError,
    GoogleMailServiceError,
    decrypt_mail_secret,
    encrypt_mail_secret,
    exchange_google_mail_code,
    fetch_gmail_attachment,
    fetch_gmail_profile,
    fetch_gmail_thread,
    fetch_google_userinfo,
    list_gmail_history_thread_ids,
    list_gmail_thread_ids,
    modify_gmail_thread_labels,
    refresh_google_mail_token,
    send_gmail_message,
    trash_gmail_thread,
    untrash_gmail_thread,
)
from .models import ReportRecord, User, utcnow
from .store import store

MailProvider = Literal["google", "naver_mail", "naver_works"]

_mongo_client = MongoClient(MONGODB_URI)
_db = _mongo_client[MONGODB_DB_NAME]
_indexes_ready = False
MAIL_OAUTH_STATE_TTL_MINUTES = 15
GMAIL_INITIAL_BACKFILL_DAYS = 90


class MailOAuthError(ValueError):
    def __init__(self, message: str, *, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


def ensure_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return

    _cleanup_legacy_mail_oauth_states()
    _db["app_headquarters"].create_index([("workspace_id", ASCENDING)])
    _db["app_sites"].create_index([("workspace_id", ASCENDING)])
    _db["app_sites"].create_index([("headquarter_id", ASCENDING)])
    _db["app_assignments"].create_index([("workspace_id", ASCENDING), ("site_id", ASCENDING)])
    _db["app_assignments"].create_index([("workspace_id", ASCENDING), ("user_id", ASCENDING)])
    _db["app_headquarter_assignments"].create_index(
        [("workspace_id", ASCENDING), ("headquarter_id", ASCENDING)]
    )
    _db["app_headquarter_assignments"].create_index(
        [("workspace_id", ASCENDING), ("user_id", ASCENDING)]
    )
    _db["app_mail_accounts"].create_index([("workspace_id", ASCENDING), ("user_id", ASCENDING)])
    _db["app_mail_accounts"].create_index([("workspace_id", ASCENDING), ("provider", ASCENDING), ("email", ASCENDING)])
    _db["app_mail_oauth_states"].create_index([("state", ASCENDING)], unique=True)
    _db["app_mail_oauth_states"].create_index(
        [("expires_at", ASCENDING)],
        expireAfterSeconds=0,
        name="mail_oauth_state_ttl",
    )
    _db["app_mail_threads"].create_index([("workspace_id", ASCENDING), ("accountId", ASCENDING)])
    _db["app_mail_threads"].create_index([("workspace_id", ASCENDING), ("accountId", ASCENDING), ("providerThreadId", ASCENDING)])
    _db["app_mail_threads"].create_index([("workspace_id", ASCENDING), ("trashedAt", ASCENDING)])
    _db["app_mail_threads"].create_index([("workspace_id", ASCENDING), ("archivedAt", ASCENDING)])
    _db["app_mail_threads"].create_index([("workspace_id", ASCENDING), ("isStarred", ASCENDING)])
    _db["app_mail_messages"].create_index([("workspace_id", ASCENDING), ("threadId", ASCENDING)])
    _db["app_mail_messages"].create_index([("workspace_id", ASCENDING), ("accountId", ASCENDING)])
    _db["app_mail_messages"].create_index([("workspace_id", ASCENDING), ("accountId", ASCENDING), ("providerMessageId", ASCENDING)])
    _db["app_credit_ledger"].create_index([("workspace_id", ASCENDING), ("created_at", DESCENDING)])
    _db["app_credit_ledger"].create_index([("source_order_id", ASCENDING)])
    _db["app_billing_orders"].create_index([("workspace_id", ASCENDING), ("created_at", DESCENDING)])
    _db["app_billing_orders"].create_index([("payment_key", ASCENDING)], sparse=True)
    _migrate_mail_account_owner_fields()
    _indexes_ready = True


def _collection(name: str):
    ensure_indexes()
    return _db[name]


def _cleanup_legacy_mail_oauth_states() -> None:
    _db["app_mail_oauth_states"].delete_many(
        {
            "$or": [
                {"state": {"$exists": False}},
                {"state": None},
            ]
        }
    )


def _migrate_mail_account_owner_fields() -> None:
    collection = _db["app_mail_accounts"]
    collection.update_many(
        {
            "$and": [
                {"userId": {"$exists": True, "$ne": None}},
                {
                    "$or": [
                        {"user_id": {"$exists": False}},
                        {"user_id": None},
                        {"user_id": ""},
                    ]
                },
            ]
        },
        [{"$set": {"user_id": "$userId"}}],
    )
    collection.update_many(
        {
            "$and": [
                {"user_id": {"$exists": True, "$ne": None}},
                {
                    "$or": [
                        {"userId": {"$exists": False}},
                        {"userId": None},
                        {"userId": ""},
                    ]
                },
            ]
        },
        [{"$set": {"userId": "$user_id"}}],
    )


def _normalize_text(value: Any) -> str:
    return str(value or "").strip()


def _normalize_lower(value: Any) -> str:
    return _normalize_text(value).lower()


def _contains_query(fields: list[Any], query: str) -> bool:
    if not query:
        return True
    haystack = " ".join(_normalize_text(field) for field in fields).lower()
    return query.lower() in haystack


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


def _clean(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if doc is None:
        return None
    next_doc = dict(doc)
    next_doc.pop("_id", None)
    return next_doc


def _mail_oauth_state_expires_at() -> datetime:
    return datetime.utcnow() + timedelta(minutes=MAIL_OAUTH_STATE_TTL_MINUTES)


def _mail_account_owner_query(workspace_id: str, user_id: str) -> dict[str, Any]:
    return {
        "workspace_id": workspace_id,
        "$or": [
            {"user_id": user_id},
            {"userId": user_id},
        ],
    }


def _list_mail_accounts_internal(workspace_id: str, user_id: str) -> list[dict[str, Any]]:
    owner_query = _mail_account_owner_query(workspace_id, user_id)
    rows = [
        _clean(item)
        for item in _collection("app_mail_accounts").find(
            {
                **owner_query,
                "isActive": True,
            }
        )
    ]
    rows.sort(key=lambda item: item.get("updatedAt", ""), reverse=True)
    return [item for item in rows if item]


def _serialize_mail_account(account: dict[str, Any]) -> dict[str, Any]:
    public_account = dict(account)
    for field_name in (
        "accessTokenEncrypted",
        "refreshTokenEncrypted",
        "tokenType",
        "tokenScope",
        "tokenExpiresAt",
    ):
        public_account.pop(field_name, None)
    public_account["userId"] = _normalize_text(public_account.get("userId") or public_account.get("user_id")) or None
    public_account.pop("user_id", None)
    return public_account


def _mail_account_metadata(account: dict[str, Any]) -> dict[str, Any]:
    metadata = account.get("metadata")
    if isinstance(metadata, dict):
        return dict(metadata)
    return {}


def _document_metadata(document: dict[str, Any] | None) -> dict[str, Any]:
    if not document:
        return {}
    metadata = document.get("metadata")
    if isinstance(metadata, dict):
        return dict(metadata)
    return {}


def _update_mail_account_document(account_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    updates = {key: value for key, value in updates.items()}
    updates["updatedAt"] = utcnow()
    _collection("app_mail_accounts").update_one({"_id": account_id}, {"$set": updates})
    next_account = _clean(_collection("app_mail_accounts").find_one({"_id": account_id}))
    return next_account or {}


def _update_mail_account_metadata(account: dict[str, Any], metadata_patch: dict[str, Any]) -> dict[str, Any]:
    metadata = _mail_account_metadata(account)
    metadata.update(metadata_patch)
    return _update_mail_account_document(account["id"], {"metadata": metadata})


def _mail_token_secret() -> str:
    secret = MAIL_ACCOUNT_TOKEN_SECRET.strip()
    if not secret:
        raise MailOAuthError("메일 토큰 암호화 키가 설정되지 않았습니다.", status_code=500)
    return secret


def _read_mail_refresh_token(account: dict[str, Any]) -> str:
    encrypted = _normalize_text(account.get("refreshTokenEncrypted"))
    if not encrypted:
        return ""
    return decrypt_mail_secret(encrypted, secret_key=_mail_token_secret())


def _read_mail_access_token(account: dict[str, Any]) -> str:
    encrypted = _normalize_text(account.get("accessTokenEncrypted"))
    if not encrypted:
        return ""
    return decrypt_mail_secret(encrypted, secret_key=_mail_token_secret())


def _store_mail_tokens(
    account: dict[str, Any],
    *,
    access_token: str,
    expires_in: int | None,
    refresh_token: str | None,
    scope: str,
    token_type: str,
) -> dict[str, Any]:
    timestamp = utcnow()
    expires_at = (
        timestamp + timedelta(seconds=max(int(expires_in or 0), 0))
        if expires_in is not None and int(expires_in or 0) > 0
        else None
    )
    updates: dict[str, Any] = {
        "accessTokenEncrypted": encrypt_mail_secret(access_token, secret_key=_mail_token_secret()),
        "tokenType": token_type or "Bearer",
        "tokenScope": scope,
        "tokenExpiresAt": expires_at.isoformat() if expires_at else None,
    }
    if refresh_token:
        updates["refreshTokenEncrypted"] = encrypt_mail_secret(refresh_token, secret_key=_mail_token_secret())
    return _update_mail_account_document(account["id"], updates)


def _ensure_google_mail_access_token(
    client: httpx.Client,
    account: dict[str, Any],
) -> tuple[str, dict[str, Any]]:
    access_token = _read_mail_access_token(account)
    expires_at = _normalize_text(account.get("tokenExpiresAt"))
    expires_dt = None
    if expires_at:
        try:
            expires_dt = datetime.fromisoformat(expires_at)
        except ValueError:
            expires_dt = None

    if access_token and expires_dt and expires_dt > datetime.utcnow() + timedelta(seconds=45):
        return access_token, account

    refresh_token = _read_mail_refresh_token(account)
    if not refresh_token:
        raise MailOAuthError("구글 메일 refresh token이 없어 다시 연결이 필요합니다.", status_code=409)

    refreshed = refresh_google_mail_token(
        client,
        client_id=GOOGLE_MAIL_CLIENT_ID,
        client_secret=GOOGLE_MAIL_CLIENT_SECRET,
        refresh_token=refresh_token,
    )
    next_account = _store_mail_tokens(
        account,
        access_token=str(refreshed.get("access_token") or "").strip(),
        expires_in=int(refreshed.get("expires_in") or 0) or None,
        refresh_token=str(refreshed.get("refresh_token") or "").strip() or None,
        scope=str(refreshed.get("scope") or account.get("tokenScope") or "").strip(),
        token_type=str(refreshed.get("token_type") or account.get("tokenType") or "Bearer").strip(),
    )
    return _read_mail_access_token(next_account), next_account


def _normalize_gmail_labels(message: dict[str, Any]) -> set[str]:
    labels = message.get("labelIds") or []
    return {
        _normalize_text(label)
        for label in labels
        if _normalize_text(label)
    }


def _gmail_timestamp_to_iso(value: Any) -> str | None:
    raw = _normalize_text(value)
    if not raw:
        return None
    try:
        return datetime.utcfromtimestamp(int(raw) / 1000).isoformat()
    except (TypeError, ValueError):
        return None


def _gmail_base64_to_text(value: str) -> str:
    if not value:
        return ""
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8")).decode("utf-8", errors="replace")


def _gmail_base64_to_bytes(value: str) -> bytes:
    if not value:
        return b""
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))


def _extract_participants_from_headers(headers: list[dict[str, str]], key: str) -> list[dict[str, Any]]:
    values = [header.get("value", "") for header in headers if _normalize_lower(header.get("name")) == key.lower()]
    if not values:
        return []
    participants = []
    for name, email in getaddresses(values):
        normalized_email = _normalize_text(email).lower()
        if not normalized_email:
            continue
        participants.append(
            {
                "email": normalized_email,
                "name": _normalize_text(name) or None,
            }
        )
    return participants


def _extract_single_header(headers: list[dict[str, str]], key: str) -> str:
    for header in headers:
        if _normalize_lower(header.get("name")) == key.lower():
            return _normalize_text(header.get("value"))
    return ""


def _render_plain_body_html(value: str) -> str:
    if not value.strip():
        return ""
    return "<pre>" + escape(value).replace("\n", "<br />") + "</pre>"


def _collect_gmail_payload_content(
    client: httpx.Client,
    *,
    access_token: str,
    message_id: str,
    payload: dict[str, Any],
) -> tuple[str, str, list[dict[str, Any]]]:
    html_body = ""
    plain_body = ""
    attachments: list[dict[str, Any]] = []

    def walk(part: dict[str, Any]) -> None:
        nonlocal html_body, plain_body
        mime_type = _normalize_lower(part.get("mimeType"))
        filename = _normalize_text(part.get("filename"))
        body = part.get("body") if isinstance(part.get("body"), dict) else {}
        data_value = _normalize_text(body.get("data"))
        attachment_id = _normalize_text(body.get("attachmentId"))
        size_bytes = int(body.get("size") or 0) or None

        if mime_type == "text/html" and data_value and not html_body:
            html_body = _gmail_base64_to_text(data_value)
        elif mime_type == "text/plain" and data_value and not plain_body:
            plain_body = _gmail_base64_to_text(data_value)

        if filename or attachment_id:
            attachment_bytes = b""
            if data_value:
                attachment_bytes = _gmail_base64_to_bytes(data_value)
            elif attachment_id:
                attachment_payload = fetch_gmail_attachment(
                    client,
                    access_token=access_token,
                    attachment_id=attachment_id,
                    message_id=message_id,
                )
                attachment_bytes = _gmail_base64_to_bytes(_normalize_text(attachment_payload.get("data")))
                size_bytes = int(attachment_payload.get("size") or size_bytes or 0) or size_bytes
            attachments.append(
                {
                    "attachmentId": attachment_id or None,
                    "contentType": mime_type or "application/octet-stream",
                    "dataBase64": base64.b64encode(attachment_bytes).decode("ascii") if attachment_bytes else None,
                    "filename": filename or f"attachment-{len(attachments) + 1}",
                    "sizeBytes": size_bytes,
                    "source": "gmail",
                }
            )

        for child in part.get("parts", []) or []:
            if isinstance(child, dict):
                walk(child)

    walk(payload)
    body_html = html_body or _render_plain_body_html(plain_body)
    body_preview = plain_body or _normalize_text(body_html)
    return body_html, body_preview, attachments


def _participant_signature(participant: dict[str, Any]) -> str:
    return _normalize_lower(participant.get("email"))


def _merge_participants(*groups: list[dict[str, Any]]) -> list[dict[str, Any]]:
    bucket: dict[str, dict[str, Any]] = {}
    for group in groups:
        for participant in group:
            signature = _participant_signature(participant)
            if not signature:
                continue
            if signature not in bucket:
                bucket[signature] = {
                    "email": signature,
                    "name": _normalize_text(participant.get("name")) or None,
                }
            elif not bucket[signature].get("name") and _normalize_text(participant.get("name")):
                bucket[signature]["name"] = _normalize_text(participant.get("name")) or None
    return list(bucket.values())


def _thread_state_timestamp(current_value: Any, is_active: bool, timestamp: str | None) -> str | None:
    if not is_active:
        return None
    normalized_current = _normalize_text(current_value)
    return normalized_current or timestamp


def _gmail_thread_mailbox_state(thread_payload: dict[str, Any]) -> dict[str, Any]:
    messages = thread_payload.get("messages", []) or []
    latest_message = None
    latest_internal_date = -1
    label_snapshot: set[str] = set()
    unread_count = 0
    for message in messages:
        if not isinstance(message, dict):
            continue
        label_ids = _normalize_gmail_labels(message)
        label_snapshot.update(label_ids)
        if "UNREAD" in label_ids:
            unread_count += 1
        internal_date = int(_normalize_text(message.get("internalDate")) or 0)
        if internal_date >= latest_internal_date:
            latest_internal_date = internal_date
            latest_message = message
    return {
        "isStarred": "STARRED" in label_snapshot,
        "inTrash": "TRASH" in label_snapshot,
        "isUnread": unread_count > 0,
        "lastMessage": latest_message if isinstance(latest_message, dict) else None,
        "labelSnapshot": sorted(label_snapshot),
        "messageCount": len([message for message in messages if isinstance(message, dict)]),
        "unreadCount": unread_count,
    }


def _build_gmail_message_record(
    client: httpx.Client,
    *,
    access_token: str,
    workspace_id: str,
    account: dict[str, Any],
    thread_id: str,
    message_payload: dict[str, Any],
    thread_report_key: str | None,
    thread_site_id: str | None,
    thread_headquarter_id: str | None,
) -> dict[str, Any]:
    payload = message_payload.get("payload") if isinstance(message_payload.get("payload"), dict) else {}
    headers = payload.get("headers", []) if isinstance(payload.get("headers"), list) else []
    sent_at = _gmail_timestamp_to_iso(message_payload.get("internalDate"))
    labels = _normalize_gmail_labels(message_payload)
    from_name, from_email = parseaddr(_extract_single_header(headers, "From"))
    to_recipients = _extract_participants_from_headers(headers, "To")
    cc_recipients = _extract_participants_from_headers(headers, "Cc")
    body_html, body_preview, attachments = _collect_gmail_payload_content(
        client,
        access_token=access_token,
        message_id=_normalize_text(message_payload.get("id")),
        payload=payload,
    )

    return {
        "providerMessageId": _normalize_text(message_payload.get("id")),
        "workspace_id": workspace_id,
        "threadId": thread_id,
        "accountId": account["id"],
        "direction": "outgoing" if "SENT" in labels else "incoming",
        "subject": _extract_single_header(headers, "Subject"),
        "body": body_html,
        "bodyPreview": body_preview[:240],
        "fromEmail": _normalize_text(from_email).lower(),
        "fromName": _normalize_text(from_name) or None,
        "to": to_recipients,
        "cc": cc_recipients,
        "sentAt": sent_at,
        "deliveredAt": sent_at,
        "readAt": None if "UNREAD" in labels else sent_at,
        "reportKey": thread_report_key,
        "reportKeys": [thread_report_key] if thread_report_key else [],
        "siteId": thread_site_id or "",
        "headquarterId": thread_headquarter_id or "",
        "metadata": {
            "attachments": attachments,
            "gmailHistoryId": _normalize_text(message_payload.get("historyId")) or None,
            "gmailLabelIds": sorted(labels),
            "source": "gmail",
        },
    }


def _upsert_gmail_thread_bundle(
    client: httpx.Client,
    *,
    access_token: str,
    workspace_id: str,
    account: dict[str, Any],
    thread_payload: dict[str, Any],
) -> tuple[int, int]:
    provider_thread_id = _normalize_text(thread_payload.get("id"))
    if not provider_thread_id:
        return 0, 0

    timestamp = utcnow()
    messages = [message for message in thread_payload.get("messages", []) or [] if isinstance(message, dict)]
    thread_state = _gmail_thread_mailbox_state(thread_payload)
    latest_message = thread_state.get("lastMessage") if isinstance(thread_state.get("lastMessage"), dict) else None
    payload = latest_message.get("payload") if isinstance(latest_message, dict) and isinstance(latest_message.get("payload"), dict) else {}
    headers = payload.get("headers", []) if isinstance(payload.get("headers"), list) else []
    thread_subject = _extract_single_header(headers, "Subject")
    thread_report_key = None
    thread_site_id = None
    thread_headquarter_id = None
    last_message_at = _gmail_timestamp_to_iso(latest_message.get("internalDate")) if latest_message else None
    participants = []
    if latest_message:
        from_participant = {
            "email": _normalize_text(parseaddr(_extract_single_header(headers, "From"))[1]).lower(),
            "name": _normalize_text(parseaddr(_extract_single_header(headers, "From"))[0]) or None,
        }
        participants = _merge_participants(
            [from_participant],
            _extract_participants_from_headers(headers, "To"),
            _extract_participants_from_headers(headers, "Cc"),
        )

    existing_thread = _clean(
        _collection("app_mail_threads").find_one(
            {
                "workspace_id": workspace_id,
                "accountId": account["id"],
                "providerThreadId": provider_thread_id,
            }
        )
    )
    thread_id = existing_thread.get("id") if existing_thread else _new_id("thread")
    thread_document = {
        "_id": thread_id,
        "id": thread_id,
        "providerThreadId": provider_thread_id,
        "workspace_id": workspace_id,
        "accountId": account["id"],
        "accountEmail": account["email"],
        "accountDisplayName": account["displayName"],
        "accountLabel": account.get("mailboxLabel") or account["displayName"],
        "provider": account["provider"],
        "scope": account["scope"],
        "subject": thread_subject,
        "snippet": _normalize_text(thread_payload.get("snippet")),
        "participants": participants,
        "reportKey": thread_report_key,
        "siteId": thread_site_id or "",
        "headquarterId": thread_headquarter_id or "",
        "archivedAt": _thread_state_timestamp(
            existing_thread.get("archivedAt") if existing_thread else None,
            not thread_state["inTrash"] and "INBOX" not in thread_state["labelSnapshot"] and thread_state["messageCount"] > 0,
            last_message_at or timestamp,
        ),
        "isStarred": bool(thread_state["isStarred"]),
        "lastMessageAt": last_message_at or (existing_thread.get("lastMessageAt") if existing_thread else None),
        "lastOpenedAt": existing_thread.get("lastOpenedAt") if existing_thread else None,
        "unreadCount": int(thread_state["unreadCount"] or 0),
        "messageCount": int(thread_state["messageCount"] or 0),
        "status": "read" if int(thread_state["unreadCount"] or 0) == 0 else "delivered",
        "lastDirection": "outgoing" if latest_message and "SENT" in _normalize_gmail_labels(latest_message) else "incoming",
        "trashedAt": _thread_state_timestamp(
            existing_thread.get("trashedAt") if existing_thread else None,
            bool(thread_state["inTrash"]),
            last_message_at or timestamp,
        ),
        "metadata": {
            **_document_metadata(existing_thread),
            "gmailHistoryId": _normalize_text(thread_payload.get("historyId")) or None,
            "gmailLabelIds": thread_state["labelSnapshot"],
            "source": "gmail",
        },
        "createdAt": existing_thread.get("createdAt") if existing_thread else timestamp,
        "updatedAt": timestamp,
    }
    _collection("app_mail_threads").replace_one({"_id": thread_id}, thread_document, upsert=True)

    processed_messages = 0
    for message_payload in messages:
        message_record = _build_gmail_message_record(
            client,
            access_token=access_token,
            workspace_id=workspace_id,
            account=account,
            thread_id=thread_id,
            message_payload=message_payload,
            thread_report_key=thread_report_key,
            thread_site_id=thread_site_id,
            thread_headquarter_id=thread_headquarter_id,
        )
        provider_message_id = _normalize_text(message_record.get("providerMessageId"))
        if not provider_message_id:
            continue
        existing_message = _clean(
            _collection("app_mail_messages").find_one(
                {
                    "workspace_id": workspace_id,
                    "accountId": account["id"],
                    "providerMessageId": provider_message_id,
                }
            )
        )
        message_id = existing_message.get("id") if existing_message else _new_id("message")
        message_document = {
            "_id": message_id,
            "id": message_id,
            **message_record,
            "createdAt": existing_message.get("createdAt") if existing_message else timestamp,
            "updatedAt": timestamp,
        }
        _collection("app_mail_messages").replace_one({"_id": message_id}, message_document, upsert=True)
        processed_messages += 1

    return 1, processed_messages


def _find_google_mail_account_for_upsert(workspace_id: str, user_id: str, *, email: str, google_user_id: str) -> dict[str, Any] | None:
    owner_query = _mail_account_owner_query(workspace_id, user_id)
    matchers: list[dict[str, Any]] = [{"email": email}]
    if google_user_id:
        matchers.append({"metadata.googleUserId": google_user_id})
    query = {**owner_query, "provider": "google", "$or": matchers}
    return _clean(_collection("app_mail_accounts").find_one(query))


def _mail_thread_in_trash(thread: dict[str, Any]) -> bool:
    return bool(_normalize_text(thread.get("trashedAt")))


def _mail_thread_archived(thread: dict[str, Any]) -> bool:
    return bool(_normalize_text(thread.get("archivedAt")))


def _mail_thread_matches_box(thread: dict[str, Any], box: str) -> bool:
    normalized_box = _normalize_lower(box) or "all"
    in_trash = _mail_thread_in_trash(thread)
    archived = _mail_thread_archived(thread)
    is_outgoing = thread.get("lastDirection") == "outgoing"
    is_starred = bool(thread.get("isStarred"))

    if normalized_box == "trash":
        return in_trash
    if in_trash:
        return False
    if normalized_box == "sent":
        return is_outgoing
    if normalized_box == "inbox":
        return not is_outgoing and not archived
    if normalized_box == "starred":
        return is_starred
    if normalized_box == "drafts":
        return False
    return True


def _default_workspace_redirect(provider: MailProvider) -> str:
    if provider == "google":
        return f"{APP_BASE_URL.rstrip('/')}/mail/connect/google"
    if provider == "naver_works":
        return f"{APP_BASE_URL.rstrip('/')}/mail/connect/naver-works"
    return f"{APP_BASE_URL.rstrip('/')}/mail/connect/naver"


def _provider_config(provider: MailProvider) -> dict[str, Any]:
    if provider == "google":
        return {
            "allowed_redirect_uris": GOOGLE_MAIL_ALLOWED_REDIRECT_URIS,
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "client_id": GOOGLE_MAIL_CLIENT_ID,
            "client_secret": GOOGLE_MAIL_CLIENT_SECRET,
            "default_redirect_uri": _default_workspace_redirect("google"),
            "scope": "openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send",
        }
    if provider == "naver_works":
        return {
            "allowed_redirect_uris": NAVER_WORKS_ALLOWED_REDIRECT_URIS,
            "auth_url": "https://auth.worksmobile.com/oauth2/v2.0/authorize",
            "client_id": NAVER_WORKS_CLIENT_ID,
            "client_secret": NAVER_WORKS_CLIENT_SECRET,
            "default_redirect_uri": _default_workspace_redirect("naver_works"),
            "scope": "mail mail.read mail.send",
        }
    return {
        "allowed_redirect_uris": NAVER_MAIL_ALLOWED_REDIRECT_URIS,
        "auth_url": "https://nid.naver.com/oauth2.0/authorize",
        "client_id": NAVER_MAIL_CLIENT_ID,
        "client_secret": NAVER_MAIL_CLIENT_SECRET,
        "default_redirect_uri": _default_workspace_redirect("naver_mail"),
        "scope": "name email",
    }


def _mail_provider_status(provider: MailProvider, requested_redirect_uri: str) -> dict[str, Any]:
    config = _provider_config(provider)
    missing_fields = []
    if not config["client_id"]:
        missing_fields.append("client_id")
    if not config["client_secret"]:
        missing_fields.append("client_secret")

    allowed_redirect_uris = config["allowed_redirect_uris"] or [config["default_redirect_uri"]]
    requested = requested_redirect_uri or config["default_redirect_uri"]
    is_redirect_allowed = requested in allowed_redirect_uris
    enabled = len(missing_fields) == 0

    if not enabled:
        message = "메일 공급자 설정이 아직 완료되지 않았습니다."
    elif not is_redirect_allowed:
        message = "현재 redirect URI가 허용 목록에 없습니다."
    else:
        message = "메일 공급자를 연결할 준비가 되었습니다."

    return {
        "provider": provider,
        "enabled": enabled,
        "defaultRedirectUri": config["default_redirect_uri"],
        "allowedRedirectUris": allowed_redirect_uris,
        "requestedRedirectUri": requested,
        "isRedirectAllowed": is_redirect_allowed,
        "missingFields": missing_fields,
        "message": message,
    }


def _gmail_backfill_queries() -> list[str]:
    return [
        f"newer_than:{GMAIL_INITIAL_BACKFILL_DAYS}d in:inbox",
        f"newer_than:{GMAIL_INITIAL_BACKFILL_DAYS}d in:sent",
    ]


def _perform_initial_gmail_backfill(
    client: httpx.Client,
    *,
    workspace_id: str,
    account: dict[str, Any],
    access_token: str,
) -> tuple[dict[str, Any], dict[str, int]]:
    thread_ids: set[str] = set()
    for gmail_query in _gmail_backfill_queries():
        thread_ids.update(
            list_gmail_thread_ids(
                client,
                access_token=access_token,
                query=gmail_query,
            )
        )

    processed_threads = 0
    processed_messages = 0
    for provider_thread_id in sorted(thread_ids):
        thread_payload = fetch_gmail_thread(client, access_token=access_token, thread_id=provider_thread_id)
        thread_count, message_count = _upsert_gmail_thread_bundle(
            client,
            access_token=access_token,
            workspace_id=workspace_id,
            account=account,
            thread_payload=thread_payload,
        )
        processed_threads += thread_count
        processed_messages += message_count

    profile = fetch_gmail_profile(client, access_token=access_token)
    next_account = _update_mail_account_metadata(
        account,
        {
            "historyCursor": _normalize_text(profile.get("historyId")) or _mail_account_metadata(account).get("historyCursor"),
            "initialBackfillCompleted": True,
            "lastFullSyncAt": utcnow(),
            "lastIncrementalSyncAt": None,
            "queuedPageToken": None,
            "syncError": None,
            "syncStartedAt": None,
            "syncStatus": "idle",
        },
    )
    return next_account, {
        "backfill_accounts": 1,
        "incremental_accounts": 0,
        "message_count": processed_messages,
        "thread_count": processed_threads,
    }


def _perform_incremental_gmail_sync(
    client: httpx.Client,
    *,
    workspace_id: str,
    account: dict[str, Any],
    access_token: str,
) -> tuple[dict[str, Any], dict[str, int]]:
    metadata = _mail_account_metadata(account)
    history_cursor = _normalize_text(metadata.get("historyCursor"))
    if not history_cursor:
        return _perform_initial_gmail_backfill(
            client,
            workspace_id=workspace_id,
            account=account,
            access_token=access_token,
        )

    try:
        thread_ids, latest_history_id = list_gmail_history_thread_ids(
            client,
            access_token=access_token,
            start_history_id=history_cursor,
        )
    except GoogleMailHistoryExpiredError:
        reset_account = _update_mail_account_metadata(
            account,
            {
                "historyCursor": None,
                "initialBackfillCompleted": False,
                "syncError": "Gmail 변경 이력 커서가 만료되어 전체 메일을 다시 가져옵니다.",
                "syncStartedAt": None,
                "syncStatus": "idle",
            },
        )
        return _perform_initial_gmail_backfill(
            client,
            workspace_id=workspace_id,
            account=reset_account,
            access_token=access_token,
        )

    processed_threads = 0
    processed_messages = 0
    for provider_thread_id in thread_ids:
        try:
            thread_payload = fetch_gmail_thread(client, access_token=access_token, thread_id=provider_thread_id)
        except GoogleMailServiceError as error:
            if error.status_code == 404:
                continue
            raise
        thread_count, message_count = _upsert_gmail_thread_bundle(
            client,
            access_token=access_token,
            workspace_id=workspace_id,
            account=account,
            thread_payload=thread_payload,
        )
        processed_threads += thread_count
        processed_messages += message_count

    next_account = _update_mail_account_metadata(
        account,
        {
            "historyCursor": latest_history_id or history_cursor,
            "lastIncrementalSyncAt": utcnow(),
            "queuedPageToken": None,
            "syncError": None,
            "syncStartedAt": None,
            "syncStatus": "idle",
        },
    )
    return next_account, {
        "backfill_accounts": 0,
        "incremental_accounts": 1,
        "message_count": processed_messages,
        "thread_count": processed_threads,
    }


def _sync_google_mail_account(
    client: httpx.Client,
    *,
    workspace_id: str,
    account: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, int]]:
    syncing_account = _update_mail_account_metadata(
        account,
        {
            "syncError": None,
            "syncStartedAt": utcnow(),
            "syncStatus": "backfilling"
            if not bool(_mail_account_metadata(account).get("initialBackfillCompleted"))
            else "incremental",
        },
    )
    access_token, refreshed_account = _ensure_google_mail_access_token(client, syncing_account)
    metadata = _mail_account_metadata(refreshed_account)
    if not bool(metadata.get("initialBackfillCompleted")):
        return _perform_initial_gmail_backfill(
            client,
            workspace_id=workspace_id,
            account=refreshed_account,
            access_token=access_token,
        )
    return _perform_incremental_gmail_sync(
        client,
        workspace_id=workspace_id,
        account=refreshed_account,
        access_token=access_token,
    )


def get_workspace_for_user(user: User) -> dict[str, Any]:
    memberships = [item for item in store.memberships.values() if item.user_id == user.id]
    memberships.sort(key=lambda item: item.created_at)
    if not memberships:
        raise ValueError("User has no workspace.")
    workspace = store.workspaces.get(memberships[0].workspace_id)
    if workspace is None:
        raise ValueError("Workspace not found.")
    ensure_workspace_seed(workspace.id, user)
    return workspace.model_dump()


def list_workspace_users(workspace_id: str) -> list[dict[str, Any]]:
    memberships = [item for item in store.memberships.values() if item.workspace_id == workspace_id]
    users: list[dict[str, Any]] = []
    for membership in memberships:
        user = store.users.get(membership.user_id)
        if user is None:
            continue
        users.append(
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "phone": user.phone,
                "role": user.role,
                "position": user.position,
                "organization_name": user.organization_name,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
                "last_login_at": user.last_login_at,
            }
        )
    return users


def ensure_workspace_seed(workspace_id: str, user: User) -> None:
    headquarters = _collection("app_headquarters")
    if headquarters.count_documents({"workspace_id": workspace_id}, limit=1) > 0:
        return

    timestamp = utcnow()
    hq1 = {
        "_id": _new_id("hq"),
        "id": _new_id("hq"),
        "workspace_id": workspace_id,
        "name": "성수개발",
        "management_number": "HQ-2026-001",
        "opening_number": "OPEN-3321",
        "business_registration_no": "104-81-33211",
        "corporate_registration_no": "110111-2233445",
        "license_no": "건설업-성동-2044",
        "contact_name": "이도현",
        "contact_phone": "02-412-1100",
        "address": "서울특별시 성동구 성수이로 55",
        "memo": "도심 복합시설 중심 고객사",
        "is_active": True,
        "lifecycle_status": "active",
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    hq1["_id"] = hq1["id"]
    hq2 = {
        "_id": _new_id("hq"),
        "id": _new_id("hq"),
        "workspace_id": workspace_id,
        "name": "남부인프라",
        "management_number": "HQ-2026-002",
        "opening_number": "OPEN-4472",
        "business_registration_no": "215-81-44721",
        "corporate_registration_no": "110111-9988776",
        "license_no": "건설업-강남-8132",
        "contact_name": "정유진",
        "contact_phone": "02-6222-7788",
        "address": "서울특별시 강남구 테헤란로 412",
        "memo": "고층 외장 및 철골 현장 다수 운영",
        "is_active": True,
        "lifecycle_status": "active",
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    hq2["_id"] = hq2["id"]
    headquarters.insert_many([hq1, hq2])

    sites = _collection("app_sites")
    site1 = {
        "_id": _new_id("site"),
        "id": _new_id("site"),
        "workspace_id": workspace_id,
        "headquarter_id": hq1["id"],
        "site_name": "성수동 복합시설 신축공사",
        "site_code": "SITE-001",
        "management_number": "TG-2026-0512",
        "labor_office": "서울동부지청",
        "guidance_officer_name": user.name,
        "project_start_date": "2026-01-03",
        "project_end_date": "2026-11-28",
        "project_amount": 18400000000,
        "project_scale": "지하 3층 / 지상 18층",
        "project_kind": "복합시설 신축",
        "client_management_number": "CL-3344",
        "client_business_name": "성수개발",
        "client_representative_name": "최수혁",
        "client_corporate_registration_no": "110111-2233445",
        "client_business_registration_no": "104-81-33211",
        "order_type_division": "민간",
        "technical_guidance_kind": "표준 기술지도",
        "manager_name": "박성민",
        "inspector_name": user.name,
        "contract_contact_name": "이도현",
        "manager_phone": "010-2481-3370",
        "site_contact_email": "site1@example.com",
        "site_managers": [
            {
                "id": _new_id("sm"),
                "name": "박성민",
                "phone": "010-2481-3370",
                "email": "site1@example.com",
                "is_primary": True,
            }
        ],
        "primary_site_manager": {
            "id": _new_id("sm"),
            "name": "박성민",
            "phone": "010-2481-3370",
            "email": "site1@example.com",
            "is_primary": True,
        },
        "client_contacts": [
            {
                "id": _new_id("cc"),
                "name": "이도현",
                "phone": "02-412-1100",
                "email": "hq1@example.com",
            }
        ],
        "site_address": "서울특별시 성동구 아차산로 00 일대",
        "status": "active",
        "lifecycle_status": "active",
        "is_active": True,
        "memo": "표준 기술지도 샘플 현장",
        "contract_type": "private",
        "contract_status": "active",
        "total_rounds": 7,
        "guidance_max_visit_round": 3,
        "per_visit_amount": 3000000,
        "total_contract_amount": 21000000,
        "last_visit_date": "2026-05-02",
        "required_completion_fields": ["site_address", "manager_phone"],
        "dispatch_policy": {
            "enabled": True,
            "alerts_enabled": True,
            "updated_at": timestamp,
            "updated_by": user.id,
        },
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    site1["_id"] = site1["id"]
    site2 = {
        "_id": _new_id("site"),
        "id": _new_id("site"),
        "workspace_id": workspace_id,
        "headquarter_id": hq2["id"],
        "site_name": "역삼동 업무시설 외장 보수공사",
        "site_code": "SITE-002",
        "management_number": "TG-2026-0624",
        "labor_office": "서울강남지청",
        "guidance_officer_name": user.name,
        "project_start_date": "2026-03-10",
        "project_end_date": "2026-09-30",
        "project_amount": 7200000000,
        "project_scale": "지상 12층 외장 보수",
        "project_kind": "보수 공사",
        "client_management_number": "CL-9921",
        "client_business_name": "남부인프라",
        "client_representative_name": "한정훈",
        "client_corporate_registration_no": "110111-9988776",
        "client_business_registration_no": "215-81-44721",
        "order_type_division": "민간",
        "technical_guidance_kind": "표준 기술지도",
        "manager_name": "서유라",
        "inspector_name": user.name,
        "contract_contact_name": "정유진",
        "manager_phone": "010-7722-4110",
        "site_contact_email": "site2@example.com",
        "site_managers": [
            {
                "id": _new_id("sm"),
                "name": "서유라",
                "phone": "010-7722-4110",
                "email": "site2@example.com",
                "is_primary": True,
            }
        ],
        "primary_site_manager": {
            "id": _new_id("sm"),
            "name": "서유라",
            "phone": "010-7722-4110",
            "email": "site2@example.com",
            "is_primary": True,
        },
        "client_contacts": [],
        "site_address": "서울특별시 강남구 테헤란로 412",
        "status": "active",
        "lifecycle_status": "active",
        "is_active": True,
        "memo": "외장 보수 샘플 현장",
        "contract_type": "maintenance",
        "contract_status": "active",
        "total_rounds": 5,
        "guidance_max_visit_round": 1,
        "per_visit_amount": 2500000,
        "total_contract_amount": 12500000,
        "last_visit_date": "2026-04-21",
        "required_completion_fields": ["site_address"],
        "dispatch_policy": {
            "enabled": True,
            "alerts_enabled": True,
            "updated_at": timestamp,
            "updated_by": user.id,
        },
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    site2["_id"] = site2["id"]
    sites.insert_many([site1, site2])

    assignments = _collection("app_assignments")
    assignments.insert_many(
        [
            {
                "_id": _new_id("assign"),
                "id": _new_id("assign"),
                "workspace_id": workspace_id,
                "user_id": user.id,
                "site_id": site1["id"],
                "role_on_site": "현장 지도요원",
                "memo": None,
                "is_active": True,
                "assigned_by": user.id,
                "assigned_at": timestamp,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            {
                "_id": _new_id("assign"),
                "id": _new_id("assign"),
                "workspace_id": workspace_id,
                "user_id": user.id,
                "site_id": site2["id"],
                "role_on_site": "현장 지도요원",
                "memo": None,
                "is_active": True,
                "assigned_by": user.id,
                "assigned_at": timestamp,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        ]
    )

    headquarter_assignments = _collection("app_headquarter_assignments")
    headquarter_assignments.insert_many(
        [
            {
                "_id": _new_id("hqassign"),
                "id": _new_id("hqassign"),
                "workspace_id": workspace_id,
                "user_id": user.id,
                "headquarter_id": hq1["id"],
                "role_on_headquarter": "담당 연구원",
                "memo": None,
                "is_active": True,
                "assigned_by": user.id,
                "assigned_at": timestamp,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            {
                "_id": _new_id("hqassign"),
                "id": _new_id("hqassign"),
                "workspace_id": workspace_id,
                "user_id": user.id,
                "headquarter_id": hq2["id"],
                "role_on_headquarter": "담당 연구원",
                "memo": None,
                "is_active": True,
                "assigned_by": user.id,
                "assigned_at": timestamp,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        ]
    )


def _user_summary(user_id: str, workspace_id: str) -> dict[str, Any] | None:
    members = {item.user_id for item in store.memberships.values() if item.workspace_id == workspace_id}
    if user_id not in members:
        return None
    user = store.users.get(user_id)
    if user is None:
        return None
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


def _headquarter_detail(headquarter: dict[str, Any], site_count: int = 0) -> dict[str, Any]:
    return {
        "id": headquarter["id"],
        "name": headquarter.get("name", ""),
        "management_number": headquarter.get("management_number"),
        "opening_number": headquarter.get("opening_number"),
        "business_registration_no": headquarter.get("business_registration_no"),
        "corporate_registration_no": headquarter.get("corporate_registration_no"),
        "license_no": headquarter.get("license_no"),
        "contact_name": headquarter.get("contact_name"),
        "contact_phone": headquarter.get("contact_phone"),
        "address": headquarter.get("address"),
        "memo": headquarter.get("memo"),
        "is_active": bool(headquarter.get("is_active", True)),
        "site_count": site_count,
        "lifecycle_status": headquarter.get("lifecycle_status", "active"),
        "created_at": headquarter.get("created_at"),
        "updated_at": headquarter.get("updated_at"),
    }


def _site_with_relations(
    site: dict[str, Any],
    headquarter_by_id: dict[str, dict[str, Any]],
    users_by_id: dict[str, dict[str, Any]],
    assignments_by_site_id: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    matched_headquarter = headquarter_by_id.get(site["headquarter_id"])
    active_assignments = [item for item in assignments_by_site_id.get(site["id"], []) if item.get("is_active", True)]
    assigned_user = _user_summary(active_assignments[0]["user_id"], site["workspace_id"]) if active_assignments else None
    assigned_users = [
        users_by_id[item["user_id"]]
        for item in active_assignments
        if item["user_id"] in users_by_id
    ]

    return {
        "id": site["id"],
        "headquarter_id": site["headquarter_id"],
        "headquarter": (
            {"id": matched_headquarter["id"], "name": matched_headquarter["name"]}
            if matched_headquarter
            else None
        ),
        "headquarter_detail": _headquarter_detail(matched_headquarter, 0) if matched_headquarter else None,
        "assigned_user": assigned_user,
        "assigned_users": assigned_users,
        "active_assignment_count": len(active_assignments),
        "site_name": site.get("site_name"),
        "site_code": site.get("site_code"),
        "management_number": site.get("management_number"),
        "labor_office": site.get("labor_office"),
        "guidance_officer_name": site.get("guidance_officer_name"),
        "project_start_date": site.get("project_start_date"),
        "project_end_date": site.get("project_end_date"),
        "project_amount": site.get("project_amount"),
        "project_scale": site.get("project_scale"),
        "project_kind": site.get("project_kind"),
        "client_management_number": site.get("client_management_number"),
        "client_business_name": site.get("client_business_name"),
        "client_representative_name": site.get("client_representative_name"),
        "client_corporate_registration_no": site.get("client_corporate_registration_no"),
        "client_business_registration_no": site.get("client_business_registration_no"),
        "order_type_division": site.get("order_type_division"),
        "technical_guidance_kind": site.get("technical_guidance_kind"),
        "manager_name": site.get("manager_name"),
        "inspector_name": site.get("inspector_name"),
        "contract_contact_name": site.get("contract_contact_name"),
        "manager_phone": site.get("manager_phone"),
        "site_contact_email": site.get("site_contact_email"),
        "site_managers": site.get("site_managers", []),
        "primary_site_manager": site.get("primary_site_manager"),
        "client_contacts": site.get("client_contacts", []),
        "site_address": site.get("site_address"),
        "status": site.get("status", "active"),
        "lifecycle_status": site.get("lifecycle_status", site.get("status", "active")),
        "is_active": bool(site.get("is_active", True)),
        "pause_start_date": site.get("pause_start_date"),
        "memo": site.get("memo"),
        "contract_date": site.get("contract_date"),
        "contract_start_date": site.get("contract_start_date"),
        "contract_end_date": site.get("contract_end_date"),
        "contract_signed_date": site.get("contract_signed_date"),
        "contract_type": site.get("contract_type"),
        "contract_status": site.get("contract_status"),
        "total_rounds": site.get("total_rounds"),
        "guidance_max_visit_round": site.get("guidance_max_visit_round"),
        "per_visit_amount": site.get("per_visit_amount"),
        "total_contract_amount": site.get("total_contract_amount"),
        "last_visit_date": site.get("last_visit_date"),
        "required_completion_fields": site.get("required_completion_fields", []),
        "dispatch_policy": site.get("dispatch_policy"),
        "created_at": site.get("created_at"),
        "updated_at": site.get("updated_at"),
    }


def _workspace_directory(workspace_id: str) -> dict[str, Any]:
    headquarter_docs = [_clean(item) for item in _collection("app_headquarters").find({"workspace_id": workspace_id})]
    site_docs = [_clean(item) for item in _collection("app_sites").find({"workspace_id": workspace_id})]
    assignment_docs = [_clean(item) for item in _collection("app_assignments").find({"workspace_id": workspace_id})]
    hq_assignment_docs = [_clean(item) for item in _collection("app_headquarter_assignments").find({"workspace_id": workspace_id})]
    users = list_workspace_users(workspace_id)
    users_by_id = {item["id"]: item for item in users}
    assignments_by_site_id: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for assignment in assignment_docs:
        assignments_by_site_id[assignment["site_id"]].append(assignment)
    headquarter_site_count = defaultdict(int)
    for site in site_docs:
        headquarter_site_count[site["headquarter_id"]] += 1
    headquarter_by_id = {item["id"]: item for item in headquarter_docs}
    return {
        "headquarters": [
            _headquarter_detail(item, headquarter_site_count[item["id"]]) for item in headquarter_docs
        ],
        "headquarter_docs": headquarter_docs,
        "headquarter_assignments": hq_assignment_docs,
        "sites": [
            _site_with_relations(item, headquarter_by_id, users_by_id, assignments_by_site_id)
            for item in site_docs
        ],
        "site_docs": site_docs,
        "assignments": [
            {
                "id": item["id"],
                "user_id": item["user_id"],
                "site_id": item["site_id"],
                "role_on_site": item.get("role_on_site", ""),
                "memo": item.get("memo"),
                "is_active": bool(item.get("is_active", True)),
                "assigned_by": item.get("assigned_by"),
                "assigned_at": item.get("assigned_at"),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
                "user": (
                    {
                        "id": users_by_id[item["user_id"]]["id"],
                        "name": users_by_id[item["user_id"]]["name"],
                    }
                    if item["user_id"] in users_by_id
                    else None
                ),
                "site": (
                    {
                        "id": item["site_id"],
                        "name": next(
                            (
                                site["site_name"]
                                for site in site_docs
                                if site["id"] == item["site_id"]
                            ),
                            item["site_id"],
                        ),
                    }
                ),
            }
            for item in assignment_docs
        ],
        "users": users,
    }


def list_headquarters_for_admin(
    workspace_id: str,
    *,
    headquarter_id: str = "",
    limit: int = 30,
    offset: int = 0,
    query: str = "",
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> dict[str, Any]:
    directory = _workspace_directory(workspace_id)
    rows = directory["headquarters"]
    if headquarter_id:
        rows = [item for item in rows if item["id"] == headquarter_id]
    if query:
        rows = [
            item
            for item in rows
            if _contains_query(
                [
                    item["name"],
                    item.get("management_number"),
                    item.get("opening_number"),
                    item.get("contact_name"),
                ],
                query,
            )
        ]
    reverse = sort_dir != "asc"
    rows = sorted(rows, key=lambda item: _normalize_text(item.get(sort_by)), reverse=reverse)
    summary = {
        "completedCount": len(rows),
        "contactGapCount": sum(1 for item in rows if not _normalize_text(item.get("contact_phone"))),
        "memoGapCount": sum(1 for item in rows if not _normalize_text(item.get("memo"))),
        "registrationGapCount": sum(
            1
            for item in rows
            if not _normalize_text(item.get("business_registration_no"))
            or not _normalize_text(item.get("opening_number"))
        ),
    }
    return {
        "limit": limit,
        "offset": offset,
        "refreshedAt": utcnow(),
        "rows": rows[offset : offset + limit],
        "summary": summary,
        "total": len(rows),
    }


def list_sites_for_admin(
    workspace_id: str,
    *,
    assignment: str = "",
    headquarter_id: str = "",
    limit: int = 50,
    offset: int = 0,
    query: str = "",
    site_id: str = "",
    sort_by: str = "site_name",
    sort_dir: str = "asc",
    status: str = "",
) -> dict[str, Any]:
    directory = _workspace_directory(workspace_id)
    rows = directory["sites"]
    if site_id:
        rows = [item for item in rows if item["id"] == site_id]
    if headquarter_id:
        rows = [item for item in rows if item["headquarter_id"] == headquarter_id]
    if assignment == "assigned":
        rows = [item for item in rows if (item.get("active_assignment_count") or 0) > 0]
    elif assignment == "unassigned":
        rows = [item for item in rows if (item.get("active_assignment_count") or 0) == 0]
    if status:
        rows = [item for item in rows if _normalize_text(item.get("status")) == _normalize_text(status)]
    if query:
        rows = [
            item
            for item in rows
            if _contains_query(
                [
                    item.get("client_business_name"),
                    item.get("site_name"),
                    item.get("manager_name"),
                    item.get("site_address"),
                ],
                query,
            )
        ]
    reverse = sort_dir == "desc"
    rows = sorted(rows, key=lambda item: _normalize_text(item.get(sort_by)), reverse=reverse)
    return {
        "limit": limit,
        "offset": offset,
        "refreshedAt": utcnow(),
        "rows": rows[offset : offset + limit],
        "total": len(rows),
    }


def list_assignments(
    workspace_id: str,
    *,
    active_only: bool = True,
    limit: int = 500,
    offset: int = 0,
    site_id: str = "",
    user_id: str = "",
) -> list[dict[str, Any]]:
    directory = _workspace_directory(workspace_id)
    rows = directory["assignments"]
    if active_only:
        rows = [item for item in rows if item.get("is_active", True)]
    if site_id:
        rows = [item for item in rows if item["site_id"] == site_id]
    if user_id:
        rows = [item for item in rows if item["user_id"] == user_id]
    return rows[offset : offset + limit]


def list_headquarter_assignments(
    workspace_id: str,
    *,
    active_only: bool = True,
    limit: int = 500,
    offset: int = 0,
    headquarter_id: str = "",
    user_id: str = "",
) -> list[dict[str, Any]]:
    directory = _workspace_directory(workspace_id)
    users_by_id = {item["id"]: item for item in directory["users"]}
    headquarter_by_id = {item["id"]: item for item in directory["headquarters"]}
    rows: list[dict[str, Any]] = []
    for item in directory["headquarter_assignments"]:
        if active_only and not item.get("is_active", True):
            continue
        if headquarter_id and item["headquarter_id"] != headquarter_id:
            continue
        if user_id and item["user_id"] != user_id:
            continue
        rows.append(
            {
                "id": item["id"],
                "user_id": item["user_id"],
                "headquarter_id": item["headquarter_id"],
                "role_on_headquarter": item.get("role_on_headquarter", ""),
                "memo": item.get("memo"),
                "is_active": bool(item.get("is_active", True)),
                "assigned_by": item.get("assigned_by"),
                "assigned_at": item.get("assigned_at"),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
                "user": (
                    {
                        "id": users_by_id[item["user_id"]]["id"],
                        "name": users_by_id[item["user_id"]]["name"],
                    }
                    if item["user_id"] in users_by_id
                    else None
                ),
                "headquarter": (
                    {
                        "id": item["headquarter_id"],
                        "name": headquarter_by_id[item["headquarter_id"]]["name"],
                    }
                    if item["headquarter_id"] in headquarter_by_id
                    else None
                ),
            }
        )
    return rows[offset : offset + limit]


def create_headquarter(workspace_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    timestamp = utcnow()
    document = {
        "id": _new_id("hq"),
        "workspace_id": workspace_id,
        "name": payload.get("name", "").strip(),
        "management_number": payload.get("management_number"),
        "opening_number": payload.get("opening_number"),
        "business_registration_no": payload.get("business_registration_no"),
        "corporate_registration_no": payload.get("corporate_registration_no"),
        "license_no": payload.get("license_no"),
        "contact_name": payload.get("contact_name"),
        "contact_phone": payload.get("contact_phone"),
        "address": payload.get("address"),
        "memo": payload.get("memo"),
        "is_active": bool(payload.get("is_active", True)),
        "lifecycle_status": payload.get("lifecycle_status", "active"),
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    document["_id"] = document["id"]
    _collection("app_headquarters").replace_one({"_id": document["_id"]}, document, upsert=True)
    return _headquarter_detail(document, 0)


def update_headquarter(workspace_id: str, headquarter_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    current = _clean(_collection("app_headquarters").find_one({"_id": headquarter_id, "workspace_id": workspace_id}))
    if current is None:
        return None
    current.update({key: value for key, value in payload.items() if key != "id"})
    current["updated_at"] = utcnow()
    current["_id"] = headquarter_id
    _collection("app_headquarters").replace_one({"_id": headquarter_id}, current, upsert=True)
    site_count = _collection("app_sites").count_documents({"workspace_id": workspace_id, "headquarter_id": headquarter_id})
    return _headquarter_detail(current, site_count)


def deactivate_headquarter(workspace_id: str, headquarter_id: str) -> dict[str, Any] | None:
    return update_headquarter(
        workspace_id,
        headquarter_id,
        {"is_active": False, "lifecycle_status": "deleted"},
    )


def create_site(workspace_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    timestamp = utcnow()
    document = {
        "id": _new_id("site"),
        "workspace_id": workspace_id,
        "headquarter_id": payload.get("headquarter_id"),
        "site_name": payload.get("site_name", "").strip(),
        "site_code": payload.get("site_code"),
        "management_number": payload.get("management_number"),
        "labor_office": payload.get("labor_office"),
        "guidance_officer_name": payload.get("guidance_officer_name"),
        "project_start_date": payload.get("project_start_date"),
        "project_end_date": payload.get("project_end_date"),
        "project_amount": payload.get("project_amount"),
        "project_scale": payload.get("project_scale"),
        "project_kind": payload.get("project_kind"),
        "client_management_number": payload.get("client_management_number"),
        "client_business_name": payload.get("client_business_name"),
        "client_representative_name": payload.get("client_representative_name"),
        "client_corporate_registration_no": payload.get("client_corporate_registration_no"),
        "client_business_registration_no": payload.get("client_business_registration_no"),
        "order_type_division": payload.get("order_type_division"),
        "technical_guidance_kind": payload.get("technical_guidance_kind"),
        "manager_name": payload.get("manager_name"),
        "inspector_name": payload.get("inspector_name"),
        "contract_contact_name": payload.get("contract_contact_name"),
        "manager_phone": payload.get("manager_phone"),
        "site_contact_email": payload.get("site_contact_email"),
        "site_managers": payload.get("site_managers", []),
        "primary_site_manager": payload.get("site_managers", [None])[0] if payload.get("site_managers") else None,
        "client_contacts": payload.get("client_contacts", []),
        "site_address": payload.get("site_address"),
        "status": payload.get("status", "active"),
        "lifecycle_status": payload.get("lifecycle_status", payload.get("status", "active")),
        "is_active": payload.get("status", "active") != "deleted",
        "pause_start_date": payload.get("pause_start_date"),
        "memo": payload.get("memo"),
        "contract_date": payload.get("contract_date"),
        "contract_start_date": payload.get("contract_start_date"),
        "contract_end_date": payload.get("contract_end_date"),
        "contract_signed_date": payload.get("contract_signed_date"),
        "contract_type": payload.get("contract_type"),
        "contract_status": payload.get("contract_status"),
        "total_rounds": payload.get("total_rounds"),
        "guidance_max_visit_round": payload.get("guidance_max_visit_round"),
        "per_visit_amount": payload.get("per_visit_amount"),
        "total_contract_amount": payload.get("total_contract_amount"),
        "last_visit_date": payload.get("last_visit_date"),
        "required_completion_fields": payload.get("required_completion_fields", []),
        "dispatch_policy": payload.get("dispatch_policy"),
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    document["_id"] = document["id"]
    _collection("app_sites").replace_one({"_id": document["_id"]}, document, upsert=True)
    directory = _workspace_directory(workspace_id)
    return _site_with_relations(
        document,
        {item["id"]: item for item in directory["headquarter_docs"]},
        {item["id"]: item for item in directory["users"]},
        defaultdict(list),
    )


def update_site(workspace_id: str, site_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    current = _clean(_collection("app_sites").find_one({"_id": site_id, "workspace_id": workspace_id}))
    if current is None:
        return None
    current.update({key: value for key, value in payload.items() if key != "id"})
    current["updated_at"] = utcnow()
    current["_id"] = site_id
    _collection("app_sites").replace_one({"_id": site_id}, current, upsert=True)
    directory = _workspace_directory(workspace_id)
    assignments_by_site_id: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for assignment in directory["assignments"]:
        assignments_by_site_id[assignment["site_id"]].append(assignment)
    return _site_with_relations(
        current,
        {item["id"]: item for item in directory["headquarter_docs"]},
        {item["id"]: item for item in directory["users"]},
        assignments_by_site_id,
    )


def deactivate_site(workspace_id: str, site_id: str) -> dict[str, Any] | None:
    return update_site(
        workspace_id,
        site_id,
        {"status": "deleted", "lifecycle_status": "deleted", "is_active": False},
    )


def create_assignment(workspace_id: str, assigned_by: str, payload: dict[str, Any]) -> dict[str, Any]:
    timestamp = utcnow()
    document = {
        "_id": _new_id("assign"),
        "id": _new_id("assign"),
        "workspace_id": workspace_id,
        "user_id": payload.get("user_id"),
        "site_id": payload.get("site_id"),
        "role_on_site": payload.get("role_on_site", "현장 지도요원"),
        "memo": payload.get("memo"),
        "is_active": True,
        "assigned_by": assigned_by,
        "assigned_at": timestamp,
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    document["_id"] = document["id"]
    _collection("app_assignments").replace_one({"_id": document["_id"]}, document, upsert=True)
    return list_assignments(
        workspace_id,
        active_only=False,
        limit=1,
        offset=0,
        site_id=document["site_id"],
        user_id=document["user_id"],
    )[0]


def update_assignment(workspace_id: str, assignment_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    current = _clean(_collection("app_assignments").find_one({"_id": assignment_id, "workspace_id": workspace_id}))
    if current is None:
        return None
    current.update({key: value for key, value in payload.items() if key != "id"})
    current["updated_at"] = utcnow()
    current["_id"] = assignment_id
    _collection("app_assignments").replace_one({"_id": assignment_id}, current, upsert=True)
    return list_assignments(
        workspace_id,
        active_only=False,
        limit=1,
        offset=0,
        site_id=current["site_id"],
        user_id=current["user_id"],
    )[0]


def deactivate_assignment(workspace_id: str, assignment_id: str) -> dict[str, Any] | None:
    return update_assignment(workspace_id, assignment_id, {"is_active": False})


def create_headquarter_assignment(workspace_id: str, assigned_by: str, payload: dict[str, Any]) -> dict[str, Any]:
    timestamp = utcnow()
    document = {
        "_id": _new_id("hqassign"),
        "id": _new_id("hqassign"),
        "workspace_id": workspace_id,
        "user_id": payload.get("user_id"),
        "headquarter_id": payload.get("headquarter_id"),
        "role_on_headquarter": payload.get("role_on_headquarter", "담당 연구원"),
        "memo": payload.get("memo"),
        "is_active": True,
        "assigned_by": assigned_by,
        "assigned_at": timestamp,
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    _collection("app_headquarter_assignments").replace_one({"_id": document["_id"]}, document, upsert=True)
    return list_headquarter_assignments(
        workspace_id,
        active_only=False,
        limit=1,
        offset=0,
        headquarter_id=document["headquarter_id"],
        user_id=document["user_id"],
    )[0]


def update_headquarter_assignment(workspace_id: str, assignment_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    current = _clean(
        _collection("app_headquarter_assignments").find_one({"_id": assignment_id, "workspace_id": workspace_id})
    )
    if current is None:
        return None
    current.update({key: value for key, value in payload.items() if key != "id"})
    current["updated_at"] = utcnow()
    current["_id"] = assignment_id
    _collection("app_headquarter_assignments").replace_one({"_id": assignment_id}, current, upsert=True)
    return list_headquarter_assignments(
        workspace_id,
        active_only=False,
        limit=1,
        offset=0,
        headquarter_id=current["headquarter_id"],
        user_id=current["user_id"],
    )[0]


def deactivate_headquarter_assignment(workspace_id: str, assignment_id: str) -> dict[str, Any] | None:
    return update_headquarter_assignment(workspace_id, assignment_id, {"is_active": False})


def list_assigned_sites_for_user(workspace_id: str, user_id: str, *, limit: int = 500) -> list[dict[str, Any]]:
    directory = _workspace_directory(workspace_id)
    active_assignments = [
        item for item in directory["assignments"] if item["user_id"] == user_id and item.get("is_active", True)
    ]
    sites_by_id = {item["id"]: item for item in directory["sites"]}
    users_by_id = {item["id"]: item for item in directory["users"]}
    rows: list[dict[str, Any]] = []
    for assignment in active_assignments[:limit]:
        site = sites_by_id.get(assignment["site_id"])
        if site is None:
            continue
        rows.append(
            {
                "id": assignment["id"],
                "headquarter_id": site["headquarter_id"],
                "headquarter": site["headquarter"],
                "assigned_user": (
                    {
                        "id": assignment["user_id"],
                        "name": users_by_id[assignment["user_id"]]["name"],
                        "email": users_by_id[assignment["user_id"]]["email"],
                        "role": users_by_id[assignment["user_id"]]["role"],
                    }
                    if assignment["user_id"] in users_by_id
                    else None
                ),
                "active_assignment_count": site.get("active_assignment_count") or 0,
                "site_name": site["site_name"],
                "client_business_name": site.get("client_business_name"),
                "site_address": site.get("site_address"),
                "total_rounds": site.get("total_rounds"),
                "created_at": assignment.get("created_at"),
                "updated_at": assignment.get("updated_at"),
            }
        )
    return rows


def list_assigned_headquarters_for_user(workspace_id: str, user_id: str, *, limit: int = 500) -> list[dict[str, Any]]:
    directory = _workspace_directory(workspace_id)
    assignments = [
        item
        for item in directory["headquarter_assignments"]
        if item["user_id"] == user_id and item.get("is_active", True)
    ]
    headquarter_by_id = {item["id"]: item for item in directory["headquarters"]}
    users_by_id = {item["id"]: item for item in directory["users"]}
    rows: list[dict[str, Any]] = []
    for assignment in assignments[:limit]:
        headquarter = headquarter_by_id.get(assignment["headquarter_id"])
        if headquarter is None:
            continue
        rows.append(
            {
                "id": assignment["id"],
                "headquarter_id": headquarter["id"],
                "headquarter": headquarter,
                "assigned_user": (
                    {
                        "id": assignment["user_id"],
                        "name": users_by_id[assignment["user_id"]]["name"],
                        "email": users_by_id[assignment["user_id"]]["email"],
                        "role": users_by_id[assignment["user_id"]]["role"],
                    }
                    if assignment["user_id"] in users_by_id
                    else None
                ),
                "site_count": headquarter.get("site_count", 0),
                "created_at": assignment.get("created_at"),
                "updated_at": assignment.get("updated_at"),
            }
        )
    return rows


def get_site_detail_for_workspace(workspace_id: str, site_id: str) -> dict[str, Any] | None:
    directory = _workspace_directory(workspace_id)
    return next((item for item in directory["sites"] if item["id"] == site_id), None)


def _map_report_status(status: str) -> tuple[str, str]:
    if status in {"review_completed", "exported"}:
        return "published", "published"
    if status == "draft_ready":
        return "submitted", "submitted"
    return "draft", "draft"


def _match_site_for_report(directory_sites: list[dict[str, Any]], report: ReportRecord) -> dict[str, Any] | None:
    if report.site_id:
        for site in directory_sites:
            if site["id"] == report.site_id:
                return site
    site_name = _normalize_lower(report.payload.get("reportMeta", {}).get("siteName"))
    if site_name:
        for site in directory_sites:
            if _normalize_lower(site.get("site_name")) == site_name:
                return site
    return directory_sites[0] if directory_sites else None


def build_safety_report_list(
    workspace_id: str,
    *,
    site_id: str = "",
    limit: int = 100,
    report_key: str = "",
) -> list[dict[str, Any]]:
    directory = _workspace_directory(workspace_id)
    reports = [
        report for report in store.reports.values() if report.workspace_id == workspace_id
    ]
    reports.sort(key=lambda item: item.updated_at, reverse=True)
    rows: list[dict[str, Any]] = []
    for report in reports:
        site = _match_site_for_report(directory["site_docs"], report)
        workflow_status, mapped_status = _map_report_status(report.status)
        visit_date = report.payload.get("reportMeta", {}).get("visitDate")
        if site_id and site and site["id"] != site_id:
            continue
        if report_key and report.id != report_key:
            continue
        exports = store.exports[report.id]
        rows.append(
            {
                "id": report.id,
                "report_key": report.id,
                "report_title": f"{report.payload.get('reportMeta', {}).get('siteName', '기술지도 보고서')} 결과보고서",
                "site_id": site["id"] if site else "",
                "headquarter_id": site["headquarter_id"] if site else None,
                "assigned_user_id": report.created_by,
                "visit_date": visit_date,
                "visit_round": int(report.payload.get("reportMeta", {}).get("visitCount") or 1),
                "total_round": int(report.payload.get("reportMeta", {}).get("totalVisitCount") or 0) or None,
                "progress_rate": int(str(report.payload.get("reportMeta", {}).get("progressRate") or "0").replace("%", "") or "0") or None,
                "status": mapped_status,
                "workflow_status": workflow_status,
                "payload_version": 1,
                "latest_revision_no": 1,
                "submitted_at": report.updated_at if mapped_status != "draft" else None,
                "published_at": report.updated_at if workflow_status == "published" else None,
                "last_autosaved_at": report.updated_at,
                "dispatch_completed": False,
                "report_type": "technical_guidance",
                "review": None,
                "dispatch": None,
                "document_kind": None,
                "originalPdfAvailable": any(item.format == "pdf" for item in exports),
                "originalPdfDownloadPath": f"/api/admin/reports/{report.id}/original-pdf",
                "meta": report.payload.get("reportMeta", {}),
                "created_at": report.created_at,
                "updated_at": report.updated_at,
            }
        )
    return rows[:limit]


def build_admin_reports_response(
    workspace_id: str,
    *,
    limit: int = 20,
    offset: int = 0,
    mail_attachable_only: bool = False,
    query: str = "",
    report_key: str = "",
    site_id: str = "",
    sort_by: str = "updatedAt",
    sort_dir: str = "desc",
) -> dict[str, Any]:
    directory = _workspace_directory(workspace_id)
    site_rows = directory["sites"]
    reports = [
        report for report in store.reports.values() if report.workspace_id == workspace_id
    ]
    rows: list[dict[str, Any]] = []
    for report in reports:
        site = _match_site_for_report(directory["site_docs"], report)
        workflow_status, mapped_status = _map_report_status(report.status)
        exports = store.exports[report.id]
        row = {
            "assigneeName": next(
                (
                    user["name"]
                    for user in directory["users"]
                    if user["id"] == report.created_by
                ),
                "",
            ),
            "assigneeUserId": report.created_by,
            "checkerUserId": "",
            "deadlineDate": report.payload.get("reportMeta", {}).get("visitDate", ""),
            "dispatchStatus": "",
            "dispatchSignal": "",
            "headquarterId": site["headquarter_id"] if site else "",
            "headquarterName": site["headquarter"]["name"] if site and site.get("headquarter") else report.payload.get("reportMeta", {}).get("customerName", ""),
            "lifecycleStatus": "active",
            "qualityStatus": "unchecked",
            "reportKey": report.id,
            "reportType": "technical_guidance",
            "siteId": site["id"] if site else "",
            "siteName": site["site_name"] if site else report.payload.get("reportMeta", {}).get("siteName", ""),
            "status": mapped_status,
            "updatedAt": report.updated_at,
            "visitDate": report.payload.get("reportMeta", {}).get("visitDate", ""),
            "controllerReview": None,
            "dispatch": None,
            "periodLabel": "",
            "progressRate": int(str(report.payload.get("reportMeta", {}).get("progressRate") or "0").replace("%", "") or "0") or None,
            "reportMonth": str(report.payload.get("reportMeta", {}).get("visitDate", ""))[:7],
            "originalPdfAvailable": any(item.format == "pdf" for item in exports),
            "originalPdfDownloadPath": f"/api/admin/reports/{report.id}/original-pdf",
            "reportTitle": f"{report.payload.get('reportMeta', {}).get('siteName', '기술지도')} 결과보고서",
            "routeParam": report.id,
            "sortLabel": f"{report.payload.get('reportMeta', {}).get('siteName', '')} {report.payload.get('reportMeta', {}).get('visitDate', '')}",
            "workflowStatus": workflow_status,
        }
        if report_key and row["reportKey"] != report_key:
            continue
        if site_id and row["siteId"] != site_id:
            continue
        if mail_attachable_only and str(row["reportKey"]).startswith("legacy:") and not row["originalPdfAvailable"]:
            continue
        if query and not _contains_query(
            [row["reportTitle"], row["siteName"], row["headquarterName"], row["visitDate"]],
            query,
        ):
            continue
        rows.append(row)

    reverse = sort_dir != "asc"
    rows.sort(key=lambda item: _normalize_text(item.get(sort_by) or item.get("updatedAt")), reverse=reverse)
    return {
        "limit": limit,
        "offset": offset,
        "rows": rows[offset : offset + limit],
        "total": len(rows),
    }


def list_mail_accounts(workspace_id: str, user_id: str) -> list[dict[str, Any]]:
    return [_serialize_mail_account(item) for item in _list_mail_accounts_internal(workspace_id, user_id)]


def start_mail_oauth(workspace_id: str, user_id: str, provider: MailProvider, redirect_uri: str) -> dict[str, Any]:
    config = _provider_config(provider)
    if not config["client_id"] or not config["client_secret"]:
        raise MailOAuthError("메일 공급자 설정이 아직 완료되지 않았습니다.", status_code=400)
    state = _new_id("oauth")
    requested_redirect = redirect_uri or config["default_redirect_uri"]
    if config["allowed_redirect_uris"] and requested_redirect not in config["allowed_redirect_uris"]:
        raise MailOAuthError("허용되지 않은 redirect URI입니다.", status_code=400)

    state_document = {
        "_id": state,
        "id": state,
        "state": state,
        "workspace_id": workspace_id,
        "user_id": user_id,
        "provider": provider,
        "redirect_uri": requested_redirect,
        "created_at": utcnow(),
        "expires_at": _mail_oauth_state_expires_at(),
    }
    try:
        _collection("app_mail_oauth_states").insert_one(state_document)
    except DuplicateKeyError as error:
        raise MailOAuthError("이미 진행 중인 메일 연결 요청이 있습니다. 다시 시도해 주세요.", status_code=409) from error

    query = {
        "client_id": config["client_id"],
        "redirect_uri": requested_redirect,
        "response_type": "code",
        "scope": config["scope"],
        "state": state,
    }
    if provider == "google":
        query["access_type"] = "offline"
        query["prompt"] = "consent"
        query["include_granted_scopes"] = "true"
    return {
        "authorization_url": f"{config['auth_url']}?{urlencode(query)}",
        "provider": provider,
        "state": state,
    }


def complete_mail_oauth(
    workspace_id: str,
    user_id: str,
    provider: MailProvider,
    state: str,
    auth_code: str,
    redirect_uri: str,
) -> dict[str, Any]:
    normalized_state = state.strip()
    if not normalized_state:
        raise MailOAuthError("유효하지 않은 메일 연결 요청입니다.", status_code=404)
    normalized_auth_code = _normalize_text(auth_code)
    if not normalized_auth_code:
        raise MailOAuthError("메일 연결 승인 코드가 없습니다.", status_code=400)

    state_doc = _clean(_collection("app_mail_oauth_states").find_one({"state": normalized_state}))
    if state_doc is None:
        raise MailOAuthError("유효하지 않은 메일 연결 요청입니다.", status_code=404)
    if state_doc.get("provider") != provider:
        raise MailOAuthError("유효하지 않은 메일 연결 요청입니다.", status_code=404)
    if state_doc.get("workspace_id") != workspace_id or state_doc.get("user_id") != user_id:
        raise MailOAuthError("유효하지 않은 메일 연결 요청입니다.", status_code=404)

    expires_at = state_doc.get("expires_at")
    if isinstance(expires_at, datetime) and expires_at <= datetime.utcnow():
        _collection("app_mail_oauth_states").delete_one({"state": normalized_state})
        raise MailOAuthError("메일 연결 요청이 만료되었습니다.", status_code=409)

    expected_redirect_uri = _normalize_text(state_doc.get("redirect_uri"))
    normalized_redirect_uri = _normalize_text(redirect_uri)
    if expected_redirect_uri and normalized_redirect_uri and expected_redirect_uri != normalized_redirect_uri:
        raise MailOAuthError("메일 연결 redirect URI가 일치하지 않습니다.", status_code=409)

    if provider != "google":
        raise MailOAuthError("현재는 구글 메일 계정만 연결할 수 있습니다.", status_code=400)

    config = _provider_config(provider)
    if not config["client_id"] or not config["client_secret"]:
        raise MailOAuthError("메일 공급자 설정이 아직 완료되지 않았습니다.", status_code=400)

    try:
        with httpx.Client(timeout=60.0) as client:
            token_payload = exchange_google_mail_code(
                client,
                client_id=config["client_id"],
                client_secret=config["client_secret"],
                code=normalized_auth_code,
                redirect_uri=expected_redirect_uri or normalized_redirect_uri or config["default_redirect_uri"],
            )
            access_token = _normalize_text(token_payload.get("access_token"))
            refresh_token = _normalize_text(token_payload.get("refresh_token"))
            userinfo = fetch_google_userinfo(client, access_token=access_token)
            gmail_profile = fetch_gmail_profile(client, access_token=access_token)
    except GoogleMailServiceError as error:
        raise MailOAuthError(str(error), status_code=error.status_code) from error

    gmail_address = _normalize_text(gmail_profile.get("emailAddress")).lower()
    google_user_id = _normalize_text(userinfo.get("sub"))
    display_name = _normalize_text(userinfo.get("name")) or gmail_address
    mailbox_label = display_name or gmail_address or "Google Mail"
    if not gmail_address:
        raise MailOAuthError("Gmail 계정 이메일을 확인하지 못했습니다.", status_code=409)

    existing_account = _find_google_mail_account_for_upsert(
        workspace_id,
        user_id,
        email=gmail_address,
        google_user_id=google_user_id,
    )
    if existing_account is None:
        fallback_google_accounts = [
            account
            for account in _list_mail_accounts_internal(workspace_id, user_id)
            if account.get("provider") == "google"
        ]
        if len(fallback_google_accounts) == 1 and _normalize_text(fallback_google_accounts[0].get("email")).endswith(
            "@connected.local"
        ):
            existing_account = fallback_google_accounts[0]

    existing_refresh_token = _read_mail_refresh_token(existing_account) if existing_account else ""
    if not refresh_token and not existing_refresh_token:
        raise MailOAuthError(
            "구글 메일 오프라인 접근 권한이 없어 다시 동의가 필요합니다. 다시 연결해 주세요.",
            status_code=409,
        )

    timestamp = utcnow()
    existing_accounts = _list_mail_accounts_internal(workspace_id, user_id)
    existing_metadata = _mail_account_metadata(existing_account) if existing_account else {}
    account_id = existing_account.get("id") if existing_account else _new_id("mailacct")
    account = {
        "id": account_id,
        "provider": provider,
        "scope": "personal",
        "connectionStatus": "connected",
        "email": gmail_address,
        "displayName": display_name,
        "mailboxLabel": mailbox_label,
        "isActive": True,
        "isDefault": bool(existing_account.get("isDefault")) if existing_account else len(existing_accounts) == 0,
        "user_id": user_id,
        "userId": user_id,
        "workspace_id": workspace_id,
        "lastSyncedAt": existing_account.get("lastSyncedAt") if existing_account else None,
        "metadata": {
            **existing_metadata,
            "connectedVia": provider,
            "gmailAddress": gmail_address,
            "googleUserId": google_user_id or existing_metadata.get("googleUserId"),
            "historyCursor": _normalize_text(gmail_profile.get("historyId")) or existing_metadata.get("historyCursor"),
            "initialBackfillCompleted": False,
            "lastFullSyncAt": None,
            "lastIncrementalSyncAt": None,
            "queuedPageToken": None,
            "syncError": None,
            "syncStartedAt": None,
            "syncStatus": "idle",
        },
        "createdAt": existing_account.get("createdAt") if existing_account else timestamp,
        "updatedAt": timestamp,
    }
    # TODO(gmail-sync): support include_granted_scopes-aware incremental permission upgrades.
    # TODO(gmail-sync): store Gmail refresh_token with stronger at-rest encryption or external KMS.
    # TODO(gmail-sync): implement Gmail send API instead of local-only outgoing stubs.
    # TODO(gmail-sync): add refresh token rotation handling and token revocation cleanup.
    account["_id"] = account["id"]
    _collection("app_mail_accounts").replace_one({"_id": account["_id"]}, account, upsert=True)
    next_account = _store_mail_tokens(
        _clean(account) or account,
        access_token=access_token,
        expires_in=int(token_payload.get("expires_in") or 0) or None,
        refresh_token=refresh_token or None,
        scope=_normalize_text(token_payload.get("scope")) or _normalize_text(config["scope"]),
        token_type=_normalize_text(token_payload.get("token_type")) or "Bearer",
    )
    _collection("app_mail_oauth_states").delete_one({"state": normalized_state})
    return _serialize_mail_account(next_account)


def disconnect_mail_account(workspace_id: str, user_id: str, account_id: str) -> None:
    owner_query = _mail_account_owner_query(workspace_id, user_id)
    _collection("app_mail_accounts").update_one(
        {
            "_id": account_id,
            **owner_query,
        },
        {"$set": {"isActive": False, "updatedAt": utcnow()}},
    )


def list_mail_threads(
    workspace_id: str,
    *,
    account_id: str = "",
    box: str = "",
    headquarter_id: str = "",
    limit: int = 100,
    offset: int = 0,
    query: str = "",
    report_key: str = "",
    site_id: str = "",
) -> dict[str, Any]:
    rows = [_clean(item) for item in _collection("app_mail_threads").find({"workspace_id": workspace_id})]
    if account_id:
        rows = [item for item in rows if item.get("accountId") == account_id]
    if headquarter_id:
        rows = [item for item in rows if item.get("headquarterId") == headquarter_id]
    if site_id:
        rows = [item for item in rows if item.get("siteId") == site_id]
    if report_key:
        rows = [item for item in rows if item.get("reportKey") == report_key]
    rows = [item for item in rows if _mail_thread_matches_box(item, box)]
    if query:
        rows = [
            item
            for item in rows
            if _contains_query(
                [
                    item.get("subject"),
                    item.get("snippet"),
                    item.get("reportKey"),
                    " ".join(
                        f"{participant.get('name', '')} {participant.get('email', '')}"
                        for participant in item.get("participants", [])
                    ),
                ],
                query,
            )
        ]
    rows = [_decorate_mail_thread(workspace_id, item) for item in rows]
    rows.sort(key=lambda item: _normalize_text(item.get("lastMessageAt")), reverse=True)
    return {"rows": rows[offset : offset + limit], "total": len(rows)}


def get_mail_thread_detail(workspace_id: str, thread_id: str) -> dict[str, Any] | None:
    thread = _clean(_collection("app_mail_threads").find_one({"_id": thread_id, "workspace_id": workspace_id}))
    if thread is None:
        return None
    messages = [
        _clean(item)
        for item in _collection("app_mail_messages").find({"workspace_id": workspace_id, "threadId": thread_id})
    ]
    messages.sort(key=lambda item: _normalize_text(item.get("sentAt") or item.get("createdAt")))
    return {
        "thread": _decorate_mail_thread(workspace_id, thread),
        "messages": [_decorate_mail_message(message) for message in messages],
    }


def get_mail_message(workspace_id: str, message_id: str) -> dict[str, Any] | None:
    message = _clean(_collection("app_mail_messages").find_one({"_id": message_id, "workspace_id": workspace_id}))
    return _decorate_mail_message(message) if message else None


def _build_body_preview(body: str) -> str:
    normalized = " ".join(body.split())
    return normalized[:120]


def _html_to_plain_text(value: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", value, flags=re.IGNORECASE)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    return " ".join(text.split())


def _format_mail_address(participant: Any) -> str:
    if isinstance(participant, dict):
        email = _normalize_text(participant.get("email")).lower()
        name = _normalize_text(participant.get("name"))
        return formataddr((name, email)) if email and name else email
    name, email = parseaddr(str(participant or ""))
    normalized_email = _normalize_text(email).lower()
    normalized_name = _normalize_text(name)
    return formataddr((normalized_name, normalized_email)) if normalized_email and normalized_name else normalized_email


def _format_mail_addresses(participants: Any) -> list[str]:
    if not isinstance(participants, list):
        return []
    return [address for address in (_format_mail_address(item) for item in participants) if address]


def _build_gmail_raw_message(account: dict[str, Any], input_payload: dict[str, Any]) -> str:
    to_addresses = _format_mail_addresses(input_payload.get("to"))
    if not to_addresses:
        raise ValueError("받는 사람을 입력해 주세요.")

    message = EmailMessage()
    sender_name = _normalize_text(input_payload.get("sender_name")) or _normalize_text(account.get("displayName"))
    sender_email = _normalize_text(account.get("email")).lower()
    message["From"] = formataddr((sender_name, sender_email)) if sender_name else sender_email
    message["To"] = ", ".join(to_addresses)
    cc_addresses = _format_mail_addresses(input_payload.get("cc"))
    if cc_addresses:
        message["Cc"] = ", ".join(cc_addresses)
    message["Subject"] = _normalize_text(input_payload.get("subject"))

    html_body = str(input_payload.get("body") or "")
    plain_body = _html_to_plain_text(html_body) or html_body.strip() or " "
    message.set_content(plain_body)
    if "<" in html_body and ">" in html_body:
        message.add_alternative(html_body, subtype="html")

    for attachment in _normalize_mail_attachments(input_payload.get("attachments")):
        encoded = _normalize_text(attachment.get("dataBase64"))
        if not encoded:
            continue
        try:
            content = base64.b64decode(encoded)
        except ValueError as error:
            raise ValueError(f"{attachment.get('filename') or 'attachment'} 첨부파일을 읽지 못했습니다.") from error
        content_type = _normalize_text(attachment.get("contentType")) or "application/octet-stream"
        maintype, _, subtype = content_type.partition("/")
        message.add_attachment(
            content,
            maintype=maintype or "application",
            subtype=subtype or "octet-stream",
            filename=_normalize_text(attachment.get("filename")) or "attachment.bin",
        )

    return base64.urlsafe_b64encode(message.as_bytes()).decode("ascii").rstrip("=")


def _normalize_mail_attachments(raw_items: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_items, list):
        return []
    rows: list[dict[str, Any]] = []
    for raw_item in raw_items:
        if not isinstance(raw_item, dict):
            continue
        rows.append(
            {
                "filename": str(raw_item.get("filename") or "attachment.bin"),
                "contentType": str(raw_item.get("content_type") or "application/octet-stream"),
                "dataBase64": str(raw_item.get("data_base64") or "") or None,
                "downloadHeaders": raw_item.get("download_headers") if isinstance(raw_item.get("download_headers"), dict) else None,
                "downloadUrl": str(raw_item.get("download_url") or "") or None,
                "reportKey": str(raw_item.get("report_key") or "") or None,
                "sizeBytes": int(raw_item.get("size_bytes") or 0) if str(raw_item.get("size_bytes") or "").strip() else None,
                "source": str(raw_item.get("source") or "") or None,
            }
        )
    return rows


def _summarize_mail_participants(participants: Any) -> str:
    if not isinstance(participants, list):
        return ""
    labels: list[str] = []
    for participant in participants:
        if not isinstance(participant, dict):
            continue
        name = _normalize_text(participant.get("name"))
        email = _normalize_text(participant.get("email"))
        if not email:
            continue
        labels.append(f"{name} <{email}>" if name else email)
    return ", ".join(labels)


def _decorate_mail_message(message: dict[str, Any] | None) -> dict[str, Any] | None:
    if message is None:
        return None
    metadata = message.get("metadata") if isinstance(message.get("metadata"), dict) else {}
    attachments = _normalize_mail_attachments(metadata.get("attachments"))
    return {
        **message,
        "attachments": attachments,
        "metadata": {
            **metadata,
            "attachments": attachments,
        },
    }


def _decorate_mail_thread(workspace_id: str, thread: dict[str, Any]) -> dict[str, Any]:
    messages = [
        _clean(item)
        for item in _collection("app_mail_messages").find({"workspace_id": workspace_id, "threadId": thread.get("id")})
    ]
    has_attachments = any(
        bool(_normalize_mail_attachments((message.get("metadata") if isinstance(message.get("metadata"), dict) else {}).get("attachments")))
        for message in messages
    )
    unread_count = int(thread.get("unreadCount") or 0)
    return {
        **thread,
        "accountLabel": thread.get("accountLabel") or thread.get("accountDisplayName") or thread.get("accountEmail"),
        "archivedAt": thread.get("archivedAt") or None,
        "box": "trash" if _mail_thread_in_trash(thread) else "sent" if thread.get("lastDirection") == "outgoing" else "inbox",
        "hasAttachments": has_attachments,
        "isStarred": bool(thread.get("isStarred")),
        "isUnread": unread_count > 0,
        "lastOpenedAt": thread.get("lastOpenedAt") or None,
        "participantsSummary": _summarize_mail_participants(thread.get("participants")),
        "trashedAt": thread.get("trashedAt") or None,
    }


def _find_or_create_thread(
    workspace_id: str,
    account: dict[str, Any],
    input_payload: dict[str, Any],
) -> dict[str, Any]:
    thread_id = _normalize_text(input_payload.get("thread_id"))
    existing = None
    if thread_id:
        existing = _clean(_collection("app_mail_threads").find_one({"_id": thread_id, "workspace_id": workspace_id}))
    if existing:
        return existing

    timestamp = utcnow()
    thread = {
        "_id": _new_id("thread"),
        "id": _new_id("thread"),
        "workspace_id": workspace_id,
        "accountId": account["id"],
        "accountEmail": account["email"],
        "accountDisplayName": account["displayName"],
        "accountLabel": account.get("mailboxLabel") or account["displayName"],
        "provider": account["provider"],
        "scope": account["scope"],
        "subject": input_payload.get("subject", ""),
        "snippet": _build_body_preview(str(input_payload.get("body", ""))),
        "participants": input_payload.get("to", []),
        "reportKey": input_payload.get("report_key") or (input_payload.get("report_keys") or [None])[0],
        "siteId": input_payload.get("site_id") or "",
        "headquarterId": input_payload.get("headquarter_id") or "",
        "archivedAt": None,
        "isStarred": False,
        "lastMessageAt": timestamp,
        "lastOpenedAt": None,
        "unreadCount": 0,
        "messageCount": 0,
        "status": "draft",
        "lastDirection": "outgoing",
        "trashedAt": None,
        "createdAt": timestamp,
        "updatedAt": timestamp,
    }
    thread["_id"] = thread["id"]
    _collection("app_mail_threads").replace_one({"_id": thread["_id"]}, thread, upsert=True)
    return _clean(thread) or {}


def send_mail_message(workspace_id: str, user_id: str, input_payload: dict[str, Any]) -> dict[str, Any]:
    owner_query = _mail_account_owner_query(workspace_id, user_id)
    account = _clean(
        _collection("app_mail_accounts").find_one(
            {
                "_id": input_payload.get("account_id"),
                **owner_query,
                "isActive": True,
            }
        )
    )
    if account is None:
        raise ValueError("연결된 메일 계정을 찾을 수 없습니다.")

    gmail_response: dict[str, Any] | None = None
    if account.get("provider") == "google":
        existing_thread = None
        local_thread_id = _normalize_text(input_payload.get("thread_id"))
        if local_thread_id:
            existing_thread = _clean(
                _collection("app_mail_threads").find_one({"_id": local_thread_id, "workspace_id": workspace_id})
            )
        provider_thread_id = _normalize_text(existing_thread.get("providerThreadId")) if existing_thread else ""
        try:
            with httpx.Client(timeout=60.0) as client:
                access_token, account = _ensure_google_mail_access_token(client, account)
                gmail_response = send_gmail_message(
                    client,
                    access_token=access_token,
                    raw_message=_build_gmail_raw_message(account, input_payload),
                    thread_id=provider_thread_id or None,
                )
        except GoogleMailServiceError as error:
            raise MailOAuthError(str(error), status_code=error.status_code) from error

    thread = _find_or_create_thread(workspace_id, account, input_payload)
    timestamp = utcnow()
    message_id = _new_id("message")
    provider_message_id = _normalize_text(gmail_response.get("id")) if gmail_response else ""
    provider_thread_id = _normalize_text(gmail_response.get("threadId")) if gmail_response else ""
    message = {
        "_id": message_id,
        "id": message_id,
        "providerMessageId": provider_message_id or None,
        "workspace_id": workspace_id,
        "threadId": thread["id"],
        "accountId": account["id"],
        "direction": "outgoing",
        "subject": input_payload.get("subject", ""),
        "body": input_payload.get("body", ""),
        "bodyPreview": _build_body_preview(str(input_payload.get("body", ""))),
        "fromEmail": account["email"],
        "fromName": input_payload.get("sender_name") or account["displayName"],
        "to": input_payload.get("to", []),
        "cc": input_payload.get("cc", []),
        "sentAt": timestamp,
        "deliveredAt": timestamp,
        "readAt": None,
        "reportKey": input_payload.get("report_key"),
        "reportKeys": input_payload.get("report_keys", []),
        "siteId": input_payload.get("site_id") or "",
        "headquarterId": input_payload.get("headquarter_id") or "",
        "metadata": {
            "attachments": input_payload.get("attachments", []),
            "gmailMessageId": provider_message_id or None,
            "gmailThreadId": provider_thread_id or None,
            "mode": "report" if input_payload.get("reports") else "mail",
            "replyToMessageId": input_payload.get("reply_to_message_id") or None,
            "forwardedFromMessageId": input_payload.get("forwarded_from_message_id") or None,
            "source": "gmail" if gmail_response else "local",
        },
        "createdAt": timestamp,
        "updatedAt": timestamp,
    }
    _collection("app_mail_messages").replace_one({"_id": message["_id"]}, message, upsert=True)
    thread_updates: dict[str, Any] = {
        "accountLabel": account.get("mailboxLabel") or account["displayName"],
        "subject": message["subject"],
        "snippet": message["bodyPreview"],
        "participants": message["to"],
        "lastMessageAt": timestamp,
        "lastDirection": "outgoing",
        "status": "sent",
        "updatedAt": timestamp,
        "reportKey": message["reportKey"] or thread.get("reportKey"),
        "siteId": message["siteId"] or thread.get("siteId"),
        "headquarterId": message["headquarterId"] or thread.get("headquarterId"),
    }
    if provider_thread_id:
        thread_updates["providerThreadId"] = provider_thread_id
    _collection("app_mail_threads").update_one(
        {"_id": thread["id"]},
        {
            "$set": thread_updates,
            "$inc": {"messageCount": 1},
        },
    )
    return _decorate_mail_message(_clean(message)) or {}


def update_mail_thread_state(
    workspace_id: str,
    thread_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    thread = _clean(_collection("app_mail_threads").find_one({"_id": thread_id, "workspace_id": workspace_id}))
    if thread is None:
        return None

    timestamp = utcnow()
    updates: dict[str, Any] = {}

    if "is_starred" in payload:
        updates["isStarred"] = bool(payload.get("is_starred"))

    if "is_archived" in payload:
        updates["archivedAt"] = timestamp if bool(payload.get("is_archived")) else None

    if payload.get("restore"):
        updates["trashedAt"] = None

    if "is_trashed" in payload:
        updates["trashedAt"] = timestamp if bool(payload.get("is_trashed")) else None

    if payload.get("mark_read"):
        updates["unreadCount"] = 0
        updates["lastOpenedAt"] = timestamp
        _collection("app_mail_messages").update_many(
            {
                "workspace_id": workspace_id,
                "threadId": thread_id,
                "readAt": None,
            },
            {"$set": {"readAt": timestamp, "updatedAt": timestamp}},
        )

    google_account = None
    access_token = ""
    if thread.get("provider") == "google" and _normalize_text(thread.get("providerThreadId")):
        google_account = _clean(
            _collection("app_mail_accounts").find_one(
                {
                    "_id": thread.get("accountId"),
                    "workspace_id": workspace_id,
                    "isActive": True,
                }
            )
        )
        if google_account is None:
            raise ValueError("연결된 구글 메일 계정을 찾을 수 없습니다.")
        try:
            with httpx.Client(timeout=30.0) as client:
                access_token, refreshed_account = _ensure_google_mail_access_token(client, google_account)
                google_account = refreshed_account
                provider_thread_id = _normalize_text(thread.get("providerThreadId"))
                if payload.get("restore") or payload.get("is_trashed") is False:
                    untrash_gmail_thread(client, access_token=access_token, thread_id=provider_thread_id)
                if bool(payload.get("is_trashed")):
                    trash_gmail_thread(client, access_token=access_token, thread_id=provider_thread_id)
                if "is_archived" in payload:
                    if bool(payload.get("is_archived")):
                        modify_gmail_thread_labels(
                            client,
                            access_token=access_token,
                            thread_id=provider_thread_id,
                            remove_label_ids=("INBOX",),
                        )
                    else:
                        modify_gmail_thread_labels(
                            client,
                            access_token=access_token,
                            thread_id=provider_thread_id,
                            add_label_ids=("INBOX",),
                        )
                if "is_starred" in payload:
                    if bool(payload.get("is_starred")):
                        modify_gmail_thread_labels(
                            client,
                            access_token=access_token,
                            thread_id=provider_thread_id,
                            add_label_ids=("STARRED",),
                        )
                    else:
                        modify_gmail_thread_labels(
                            client,
                            access_token=access_token,
                            thread_id=provider_thread_id,
                            remove_label_ids=("STARRED",),
                        )
                if payload.get("mark_read"):
                    modify_gmail_thread_labels(
                        client,
                        access_token=access_token,
                        thread_id=provider_thread_id,
                        remove_label_ids=("UNREAD",),
                    )
        except GoogleMailServiceError as error:
            raise ValueError(str(error)) from error
        except MailOAuthError as error:
            raise ValueError(str(error)) from error

    if not updates:
        return _decorate_mail_thread(workspace_id, thread)

    updates["updatedAt"] = timestamp
    _collection("app_mail_threads").update_one(
        {"_id": thread_id, "workspace_id": workspace_id},
        {"$set": updates},
    )
    next_thread = _clean(_collection("app_mail_threads").find_one({"_id": thread_id, "workspace_id": workspace_id}))
    return _decorate_mail_thread(workspace_id, next_thread) if next_thread else None


def build_recipient_suggestions(
    workspace_id: str, *, account_id: str = "", limit: int = 8, query: str = ""
) -> list[dict[str, Any]]:
    messages = [
        _clean(item)
        for item in _collection("app_mail_messages").find({"workspace_id": workspace_id})
    ]
    bucket: dict[str, dict[str, Any]] = {}
    for message in messages:
        if account_id and message.get("accountId") != account_id:
            continue
        for recipient in message.get("to", []):
            email = _normalize_text(recipient.get("email"))
            if not email:
                continue
            entry = bucket.setdefault(
                email,
                {
                    "email": email,
                    "last_used_at": message.get("sentAt") or message.get("createdAt"),
                    "name": recipient.get("name"),
                    "usage_count": 0,
                },
            )
            entry["usage_count"] += 1
            latest = _normalize_text(entry["last_used_at"])
            current = _normalize_text(message.get("sentAt") or message.get("createdAt"))
            if current > latest:
                entry["last_used_at"] = current
            if not entry.get("name") and recipient.get("name"):
                entry["name"] = recipient.get("name")
    rows = list(bucket.values())
    if query:
        rows = [
            item
            for item in rows
            if _contains_query([item["email"], item.get("name")], query)
        ]
    rows.sort(key=lambda item: (_normalize_text(item.get("last_used_at")), item["usage_count"]), reverse=True)
    return rows[:limit]


def sync_mail_accounts(workspace_id: str, user_id: str) -> dict[str, Any]:
    accounts = _list_mail_accounts_internal(workspace_id, user_id)
    backfill_account_count = 0
    incremental_account_count = 0
    synced_account_count = 0
    processed_thread_count = 0
    processed_message_count = 0
    sync_errors: list[str] = []

    with httpx.Client(timeout=120.0) as client:
        for account in accounts:
            if account.get("provider") != "google":
                continue
            try:
                next_account, result = _sync_google_mail_account(
                    client,
                    workspace_id=workspace_id,
                    account=account,
                )
                _update_mail_account_document(
                    next_account["id"],
                    {
                        "lastSyncedAt": utcnow(),
                    },
                )
                backfill_account_count += int(result.get("backfill_accounts") or 0)
                incremental_account_count += int(result.get("incremental_accounts") or 0)
                processed_thread_count += int(result.get("thread_count") or 0)
                processed_message_count += int(result.get("message_count") or 0)
                synced_account_count += 1
            except (GoogleMailServiceError, MailOAuthError) as error:
                message = str(error)
                sync_errors.append(message)
                _update_mail_account_metadata(
                    account,
                    {
                        "syncError": message,
                        "syncStartedAt": None,
                        "syncStatus": "error",
                    },
                )

    return {
        "backfill_account_count": backfill_account_count,
        "incremental_account_count": incremental_account_count,
        "message_count": processed_message_count,
        "queued_message_count": 0,
        "synced_account_count": synced_account_count,
        "sync_errors": sync_errors,
        "thread_count": processed_thread_count,
    }
