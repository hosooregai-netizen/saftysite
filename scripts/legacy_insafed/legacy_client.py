from __future__ import annotations

from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from .common import normalize_text


class LegacyInsafedError(RuntimeError):
    pass


class LegacyInsafedClient:
    def __init__(self, base_url: str, username: str, password: str, timeout: int = 30):
        self.base_url = base_url.rstrip("/") + "/"
        self.username = username
        self.password = password
        self.timeout = timeout
        self.session = requests.Session()
        self.worker_context: dict[str, str] | None = None

    def build_url(self, path: str) -> str:
        return urljoin(self.base_url, path.lstrip("/"))

    def login(self) -> None:
        response = self.session.get(self.build_url("login"), timeout=self.timeout)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        token = soup.select_one('input[name="_token"]')
        if token is None or not token.get("value"):
            raise LegacyInsafedError("Missing CSRF token on legacy login page.")
        login_response = self.session.post(
            self.build_url("login"),
            data={"_token": token["value"], "email": self.username, "password": self.password},
            timeout=self.timeout,
            allow_redirects=True,
        )
        login_response.raise_for_status()
        if "/support" not in login_response.url and "/manager" not in login_response.url:
            raise LegacyInsafedError(f"Legacy login did not reach support page: {login_response.url}")

    def get_text(self, path: str, params: dict[str, Any] | None = None) -> str:
        response = self.session.get(self.build_url(path), params=params or {}, timeout=self.timeout)
        response.raise_for_status()
        return response.text

    def get_json(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        response = self.session.get(self.build_url(path), params=params or {}, timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    def post_form(self, path: str, data: dict[str, Any]) -> requests.Response:
        response = self.session.post(self.build_url(path), data=data, timeout=max(self.timeout, 300))
        response.raise_for_status()
        return response

    def fetch_support_list_html(self) -> str:
        return self.get_text("support/list")

    def get_worker_context(self) -> dict[str, str]:
        if self.worker_context is not None:
            return self.worker_context
        soup = BeautifulSoup(self.fetch_support_list_html(), "html.parser")
        export_form = soup.select_one('form[action$="/support/export"]')
        if export_form is None:
            raise LegacyInsafedError("Could not find support export form.")
        context = {
            "_token": normalize_text(export_form.select_one('input[name="_token"]') and export_form.select_one('input[name="_token"]').get("value")),
            "su_ag_id": normalize_text(export_form.select_one('input[name="su_ag_id"]') and export_form.select_one('input[name="su_ag_id"]').get("value")),
            "su_us_id": normalize_text(export_form.select_one('input[name="su_us_id"]') and export_form.select_one('input[name="su_us_id"]').get("value")),
        }
        if not context["_token"]:
            raise LegacyInsafedError("Legacy worker context is incomplete.")
        self.worker_context = context
        return context

    def download_schedule_workbook(self, destination: Path) -> None:
        context = self.get_worker_context()
        response = self.post_form(
            "support/export",
            {
                "_token": context["_token"],
                "fileName": "legacy_support_schedule.xlsx",
                "su_ag_id": context["su_ag_id"],
                "su_us_id": context["su_us_id"],
                "cc_name": "",
                "cs_name": "",
                "s_date": "2000-01-01",
                "e_date": "2100-12-31",
                "su_status": "",
            },
        )
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(response.content)

    def fetch_company_page(self, page: int) -> str:
        return self.get_text("conscompany", params={"page": page})

    def fetch_company_detail(self, company_id: str) -> str:
        return self.get_text(f"conscompany/{company_id}")

    def fetch_company_sites(self, company_id: str) -> str:
        return self.get_text(f"conscompany/showContract/{company_id}")

    def fetch_site_detail(self, legacy_site_id: str) -> str:
        return self.get_text("cons", params={"id": legacy_site_id})

    def fetch_report_page(self, page: int) -> dict[str, Any]:
        context = self.get_worker_context()
        return self.get_json(
            "report/downloadAll",
            params={
                "_token": context["_token"],
                "ag_id": context["su_ag_id"] or "208",
                "su_us_id": context["su_us_id"],
                "name": "",
                "cs_name": "",
                "s_date": "",
                "e_date": "",
                "su_status": "",
                "page": page,
            },
        )

    def fetch_report_popup(self, report_id: str | int) -> str:
        return self.get_text(f"report/popup/{report_id}")

    def download_report_pdf(self, report_id: str | int, destination: Path) -> str | None:
        context = self.get_worker_context()
        response = self.get_json(
            "report/pdfDownload",
            params={"id": report_id, "_token": context["_token"]},
        )
        file_name = normalize_text(response.get("fileName"))
        success = bool(response.get("success")) and bool(file_name)
        if not success:
            return None
        file_response = self.session.get(
            self.build_url("report/imageDown"),
            params={"name": file_name},
            timeout=max(self.timeout, 60),
        )
        file_response.raise_for_status()
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(file_response.content)
        return file_name
