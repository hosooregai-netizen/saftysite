from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests


class TargetErpError(RuntimeError):
    pass


class TargetErpClient:
    def __init__(self, base_url: str, token: str, timeout: int = 30):
        self.base_url = base_url.rstrip("/") + "/"
        self.timeout = timeout
        self.max_retries = 5
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.uses_direct_upstream = self.base_url.rstrip("/").endswith("/api/v1")
        self.progress_logging = os.environ.get("LEGACY_IMPORT_PROGRESS") == "1"

    def _resolve_path(self, path: str) -> str:
        normalized = "/" + path.lstrip("/")
        if not self.uses_direct_upstream:
            return normalized
        if normalized.startswith("/api/safety/"):
            return normalized.removeprefix("/api/safety")
        if normalized.startswith("/api/admin/"):
            return "/admin/" + normalized.removeprefix("/api/admin/").lstrip("/")
        return normalized

    def _request(self, method: str, path: str, **kwargs: Any) -> requests.Response:
        url = urljoin(self.base_url, self._resolve_path(path).lstrip("/"))
        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self.session.request(
                    method,
                    url,
                    timeout=self.timeout,
                    **kwargs,
                )
                if response.ok:
                    return response
                if response.status_code >= 500 and attempt < self.max_retries:
                    time.sleep(min(2 * attempt, 10))
                    continue
                try:
                    payload = response.json()
                except Exception:
                    payload = {}
                message = payload.get("error") or payload.get("detail") or response.text or response.reason
                raise TargetErpError(f"{method} {path} failed: {response.status_code} {message}")
            except (requests.ConnectionError, requests.Timeout) as error:
                last_error = error
                if attempt >= self.max_retries:
                    break
                time.sleep(min(2 * attempt, 10))
        raise TargetErpError(f"{method} {path} failed after retries: {last_error}")

    def fetch_all(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        *,
        limit: int = 500,
    ) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        offset = 0
        while True:
            payload = dict(params or {})
            payload.setdefault("active_only", "true")
            payload["limit"] = limit
            payload["offset"] = offset
            page = self._request("GET", path, params=payload).json()
            if not isinstance(page, list):
                raise TargetErpError(f"Expected list response for {path}")
            rows.extend(page)
            if self.progress_logging:
                print(
                    {
                        "path": path,
                        "fetched": len(rows),
                        "page_size": len(page),
                        "offset": offset,
                    },
                    flush=True,
                )
            if len(page) < limit:
                return rows
            offset += len(page)

    def fetch_headquarters(self) -> list[dict[str, Any]]:
        return self.fetch_all("/api/safety/headquarters")

    def fetch_sites(self) -> list[dict[str, Any]]:
        return self.fetch_all(
            "/api/safety/sites",
            {"include_headquarter_detail": "true", "include_assigned_user": "true"},
            limit=500,
        )

    def fetch_users(self) -> list[dict[str, Any]]:
        return self.fetch_all("/api/safety/users")

    def fetch_assignments(self) -> list[dict[str, Any]]:
        return self.fetch_all("/api/safety/assignments")

    def fetch_content_items(self) -> list[dict[str, Any]]:
        return self.fetch_all("/api/safety/content-items")

    def create_headquarter(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/api/safety/headquarters", json=payload).json()

    def update_headquarter(self, headquarter_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("PATCH", f"/api/safety/headquarters/{headquarter_id}", json=payload).json()

    def create_site(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/api/safety/sites", json=payload).json()

    def update_site(self, site_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("PATCH", f"/api/safety/sites/{site_id}", json=payload).json()

    def create_user(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/api/safety/users", json=payload).json()

    def update_user(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("PATCH", f"/api/safety/users/{user_id}", json=payload).json()

    def create_assignment(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/api/safety/assignments", json=payload).json()

    def update_assignment(self, assignment_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("PATCH", f"/api/safety/assignments/{assignment_id}", json=payload).json()

    def create_content_item(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/api/safety/content-items", json=payload).json()

    def update_content_item(self, content_item_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("PATCH", f"/api/safety/content-items/{content_item_id}", json=payload).json()

    def upload_content_asset(
        self,
        file_path: str | Path,
        *,
        upload_filename: str | None = None,
        content_type: str = "application/pdf",
    ) -> dict[str, Any]:
        path = Path(file_path)
        with path.open("rb") as handle:
            files = {
                "file": (
                    upload_filename or path.name,
                    handle,
                    content_type,
                )
            }
            return self._request("POST", "/content-items/assets/upload", files=files).json()

    def generate_site_schedules(self, site_id: str) -> dict[str, Any]:
        return self._request("POST", f"/api/admin/sites/{site_id}/schedules/generate").json()

    def fetch_site_schedules(self, site_id: str) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        offset = 0
        while True:
            payload = self._request(
                "GET",
                "/api/admin/schedules",
                params={"site_id": site_id, "limit": 300, "offset": offset},
            ).json()
            page = payload.get("rows", [])
            rows.extend(page)
            if len(page) < 300:
                return rows
            offset += len(page)

    def update_schedule(self, schedule_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("PATCH", f"/api/admin/schedules/{schedule_id}", json=payload).json()
