from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from typing import Any, Iterable

import httpx

GOOGLE_GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


class GoogleMailServiceError(RuntimeError):
    def __init__(self, message: str, *, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


class GoogleMailHistoryExpiredError(GoogleMailServiceError):
    pass


def _parse_error_message(response: httpx.Response, default_message: str) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = None
    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict):
            message = str(error.get("message") or "").strip()
            if message:
                return message
        message = str(payload.get("error_description") or "").strip()
        if message:
            return message
    text = response.text.strip()
    return text or default_message


def _google_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def exchange_google_mail_code(
    client: httpx.Client,
    *,
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
) -> dict[str, Any]:
    response = client.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        },
    )
    if not response.is_success:
        raise GoogleMailServiceError(
            f"구글 메일 토큰 교환 실패: {_parse_error_message(response, '구글 토큰 교환에 실패했습니다.')}"
        )
    payload = response.json()
    if not isinstance(payload, dict) or not str(payload.get("access_token") or "").strip():
        raise GoogleMailServiceError("구글 메일 access token을 받지 못했습니다.")
    return payload


def refresh_google_mail_token(
    client: httpx.Client,
    *,
    client_id: str,
    client_secret: str,
    refresh_token: str,
) -> dict[str, Any]:
    response = client.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
    )
    if not response.is_success:
        raise GoogleMailServiceError(
            f"구글 메일 토큰 갱신 실패: {_parse_error_message(response, '구글 토큰 갱신에 실패했습니다.')}"
        )
    payload = response.json()
    if not isinstance(payload, dict) or not str(payload.get("access_token") or "").strip():
        raise GoogleMailServiceError("구글 메일 access token을 갱신하지 못했습니다.")
    return payload


def fetch_google_userinfo(client: httpx.Client, *, access_token: str) -> dict[str, Any]:
    response = client.get(GOOGLE_USERINFO_URL, headers=_google_headers(access_token))
    if not response.is_success:
        raise GoogleMailServiceError(
            f"구글 사용자 정보 조회 실패: {_parse_error_message(response, '구글 사용자 정보를 불러오지 못했습니다.')}"
        )
    payload = response.json()
    if not isinstance(payload, dict):
        raise GoogleMailServiceError("구글 사용자 정보 응답이 올바르지 않습니다.")
    return payload


def fetch_gmail_profile(client: httpx.Client, *, access_token: str) -> dict[str, Any]:
    response = client.get(
        f"{GOOGLE_GMAIL_API_BASE_URL}/profile",
        headers=_google_headers(access_token),
    )
    if not response.is_success:
        raise GoogleMailServiceError(
            f"Gmail 프로필 조회 실패: {_parse_error_message(response, 'Gmail 프로필을 불러오지 못했습니다.')}"
        )
    payload = response.json()
    if not isinstance(payload, dict):
        raise GoogleMailServiceError("Gmail 프로필 응답이 올바르지 않습니다.")
    return payload


def list_gmail_thread_ids(
    client: httpx.Client,
    *,
    access_token: str,
    query: str,
    max_pages: int = 50,
) -> list[str]:
    thread_ids: list[str] = []
    next_page_token = ""
    page_count = 0
    while page_count < max_pages:
        params = {"maxResults": "100", "q": query}
        if next_page_token:
            params["pageToken"] = next_page_token
        response = client.get(
            f"{GOOGLE_GMAIL_API_BASE_URL}/threads",
            headers=_google_headers(access_token),
            params=params,
        )
        if not response.is_success:
            raise GoogleMailServiceError(
                f"Gmail 스레드 목록 조회 실패: {_parse_error_message(response, 'Gmail 스레드 목록을 불러오지 못했습니다.')}"
            )
        payload = response.json()
        if not isinstance(payload, dict):
            raise GoogleMailServiceError("Gmail 스레드 목록 응답이 올바르지 않습니다.")
        for row in payload.get("threads", []) or []:
            if isinstance(row, dict):
                thread_id = str(row.get("id") or "").strip()
                if thread_id:
                    thread_ids.append(thread_id)
        next_page_token = str(payload.get("nextPageToken") or "").strip()
        if not next_page_token:
            break
        page_count += 1
    return thread_ids


def fetch_gmail_thread(
    client: httpx.Client,
    *,
    access_token: str,
    thread_id: str,
) -> dict[str, Any]:
    response = client.get(
        f"{GOOGLE_GMAIL_API_BASE_URL}/threads/{thread_id}",
        headers=_google_headers(access_token),
        params={"format": "full"},
    )
    if response.status_code == 404:
        raise GoogleMailServiceError("Gmail 스레드를 찾을 수 없습니다.", status_code=404)
    if not response.is_success:
        raise GoogleMailServiceError(
            f"Gmail 스레드 조회 실패: {_parse_error_message(response, 'Gmail 스레드를 불러오지 못했습니다.')}"
        )
    payload = response.json()
    if not isinstance(payload, dict):
        raise GoogleMailServiceError("Gmail 스레드 응답이 올바르지 않습니다.")
    return payload


def fetch_gmail_attachment(
    client: httpx.Client,
    *,
    access_token: str,
    attachment_id: str,
    message_id: str,
) -> dict[str, Any]:
    response = client.get(
        f"{GOOGLE_GMAIL_API_BASE_URL}/messages/{message_id}/attachments/{attachment_id}",
        headers=_google_headers(access_token),
    )
    if not response.is_success:
        raise GoogleMailServiceError(
            f"Gmail 첨부파일 조회 실패: {_parse_error_message(response, '첨부파일을 불러오지 못했습니다.')}"
        )
    payload = response.json()
    if not isinstance(payload, dict):
        raise GoogleMailServiceError("Gmail 첨부파일 응답이 올바르지 않습니다.")
    return payload


def list_gmail_history_thread_ids(
    client: httpx.Client,
    *,
    access_token: str,
    start_history_id: str,
    max_pages: int = 50,
) -> tuple[list[str], str | None]:
    thread_ids: set[str] = set()
    next_page_token = ""
    latest_history_id: str | None = None
    page_count = 0
    while page_count < max_pages:
        params = {
            "startHistoryId": start_history_id,
            "historyTypes": [
                "labelAdded",
                "labelRemoved",
                "messageAdded",
                "messageDeleted",
            ],
            "maxResults": "100",
        }
        if next_page_token:
            params["pageToken"] = next_page_token
        response = client.get(
            f"{GOOGLE_GMAIL_API_BASE_URL}/history",
            headers=_google_headers(access_token),
            params=params,
        )
        if response.status_code == 404:
            raise GoogleMailHistoryExpiredError("Gmail 변경 이력 커서가 만료되었습니다.", status_code=409)
        if not response.is_success:
            raise GoogleMailServiceError(
                f"Gmail 변경 이력 조회 실패: {_parse_error_message(response, 'Gmail 변경 이력을 불러오지 못했습니다.')}"
            )
        payload = response.json()
        if not isinstance(payload, dict):
            raise GoogleMailServiceError("Gmail 변경 이력 응답이 올바르지 않습니다.")
        latest_history_id = str(payload.get("historyId") or latest_history_id or "").strip() or latest_history_id
        history_rows = payload.get("history", []) or []
        if isinstance(history_rows, list):
            for row in history_rows:
                if not isinstance(row, dict):
                    continue
                for collection_name in ("messagesAdded", "messagesDeleted", "labelsAdded", "labelsRemoved"):
                    entries = row.get(collection_name, []) or []
                    if not isinstance(entries, list):
                        continue
                    for entry in entries:
                        if not isinstance(entry, dict):
                            continue
                        message = entry.get("message") if isinstance(entry.get("message"), dict) else entry
                        if not isinstance(message, dict):
                            continue
                        thread_id = str(message.get("threadId") or "").strip()
                        if thread_id:
                            thread_ids.add(thread_id)
        next_page_token = str(payload.get("nextPageToken") or "").strip()
        if not next_page_token:
            break
        page_count += 1
    return sorted(thread_ids), latest_history_id


def modify_gmail_thread_labels(
    client: httpx.Client,
    *,
    access_token: str,
    thread_id: str,
    add_label_ids: Iterable[str] = (),
    remove_label_ids: Iterable[str] = (),
) -> dict[str, Any]:
    response = client.post(
        f"{GOOGLE_GMAIL_API_BASE_URL}/threads/{thread_id}/modify",
        headers=_google_headers(access_token),
        json={
            "addLabelIds": [item for item in add_label_ids if item],
            "removeLabelIds": [item for item in remove_label_ids if item],
        },
    )
    if not response.is_success:
        raise GoogleMailServiceError(
            f"Gmail 스레드 상태 갱신 실패: {_parse_error_message(response, 'Gmail 스레드 상태를 바꾸지 못했습니다.')}"
        )
    payload = response.json()
    if not isinstance(payload, dict):
        raise GoogleMailServiceError("Gmail 스레드 상태 응답이 올바르지 않습니다.")
    return payload


def trash_gmail_thread(client: httpx.Client, *, access_token: str, thread_id: str) -> dict[str, Any]:
    response = client.post(
        f"{GOOGLE_GMAIL_API_BASE_URL}/threads/{thread_id}/trash",
        headers=_google_headers(access_token),
    )
    if not response.is_success:
        raise GoogleMailServiceError(
            f"Gmail 휴지통 이동 실패: {_parse_error_message(response, 'Gmail 스레드를 휴지통으로 옮기지 못했습니다.')}"
        )
    payload = response.json()
    if not isinstance(payload, dict):
        raise GoogleMailServiceError("Gmail 휴지통 응답이 올바르지 않습니다.")
    return payload


def untrash_gmail_thread(client: httpx.Client, *, access_token: str, thread_id: str) -> dict[str, Any]:
    response = client.post(
        f"{GOOGLE_GMAIL_API_BASE_URL}/threads/{thread_id}/untrash",
        headers=_google_headers(access_token),
    )
    if not response.is_success:
        raise GoogleMailServiceError(
            f"Gmail 휴지통 복원 실패: {_parse_error_message(response, 'Gmail 스레드를 복원하지 못했습니다.')}"
        )
    payload = response.json()
    if not isinstance(payload, dict):
        raise GoogleMailServiceError("Gmail 휴지통 복원 응답이 올바르지 않습니다.")
    return payload


def send_gmail_message(
    client: httpx.Client,
    *,
    access_token: str,
    raw_message: str,
    thread_id: str | None = None,
) -> dict[str, Any]:
    request_payload: dict[str, Any] = {"raw": raw_message}
    if thread_id:
        request_payload["threadId"] = thread_id
    response = client.post(
        f"{GOOGLE_GMAIL_API_BASE_URL}/messages/send",
        headers=_google_headers(access_token),
        json=request_payload,
    )
    if not response.is_success:
        raise GoogleMailServiceError(
            f"Gmail 메일 발송 실패: {_parse_error_message(response, 'Gmail 메일을 발송하지 못했습니다.')}",
            status_code=response.status_code,
        )
    payload = response.json()
    if not isinstance(payload, dict) or not str(payload.get("id") or "").strip():
        raise GoogleMailServiceError("Gmail 발송 응답이 올바르지 않습니다.")
    return payload


def _derive_key_material(secret: str) -> bytes:
    return hashlib.sha256(secret.encode("utf-8")).digest()


def _build_keystream(key: bytes, salt: bytes, nonce: bytes, length: int) -> bytes:
    blocks: list[bytes] = []
    counter = 0
    while sum(len(block) for block in blocks) < length:
        counter_bytes = counter.to_bytes(4, "big")
        blocks.append(hmac.new(key, salt + nonce + counter_bytes, hashlib.sha256).digest())
        counter += 1
    return b"".join(blocks)[:length]


def encrypt_mail_secret(secret_value: str, *, secret_key: str) -> str:
    if not secret_value:
        return ""
    key = _derive_key_material(secret_key)
    salt = secrets.token_bytes(16)
    nonce = secrets.token_bytes(16)
    plaintext = secret_value.encode("utf-8")
    keystream = _build_keystream(key, salt, nonce, len(plaintext))
    ciphertext = bytes(left ^ right for left, right in zip(plaintext, keystream))
    mac = hmac.new(key, salt + nonce + ciphertext, hashlib.sha256).digest()
    payload = base64.urlsafe_b64encode(salt + nonce + mac + ciphertext).decode("ascii")
    return f"v1:{payload}"


def decrypt_mail_secret(encrypted_value: str, *, secret_key: str) -> str:
    if not encrypted_value:
        return ""
    if ":" not in encrypted_value:
        raise GoogleMailServiceError("암호화된 메일 토큰 형식이 올바르지 않습니다.", status_code=500)
    version, payload = encrypted_value.split(":", 1)
    if version != "v1":
        raise GoogleMailServiceError("지원하지 않는 메일 토큰 버전입니다.", status_code=500)
    raw = base64.urlsafe_b64decode(payload.encode("ascii"))
    salt = raw[:16]
    nonce = raw[16:32]
    mac = raw[32:64]
    ciphertext = raw[64:]
    key = _derive_key_material(secret_key)
    expected_mac = hmac.new(key, salt + nonce + ciphertext, hashlib.sha256).digest()
    if not hmac.compare_digest(mac, expected_mac):
        raise GoogleMailServiceError("메일 토큰 무결성 검증에 실패했습니다.", status_code=500)
    keystream = _build_keystream(key, salt, nonce, len(ciphertext))
    plaintext = bytes(left ^ right for left, right in zip(ciphertext, keystream))
    return plaintext.decode("utf-8")
