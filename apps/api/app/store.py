from __future__ import annotations

from collections import defaultdict
from uuid import uuid4

from .models import AiRun, CreditLedgerEntry, Membership, PhotoAsset, ReportExport, ReportRecord, User, Workspace


class InMemoryStore:
    def __init__(self) -> None:
        self.users: dict[str, User] = {}
        self.tokens: dict[str, str] = {}
        self.workspaces: dict[str, Workspace] = {}
        self.memberships: dict[str, Membership] = {}
        self.credit_ledger: dict[str, list[CreditLedgerEntry]] = defaultdict(list)
        self.reports: dict[str, ReportRecord] = {}
        self.photos: dict[str, PhotoAsset] = {}
        self.ai_runs: dict[str, AiRun] = {}
        self.exports: dict[str, list[ReportExport]] = defaultdict(list)

    @staticmethod
    def new_id(prefix: str) -> str:
        return f"{prefix}_{uuid4().hex[:12]}"


store = InMemoryStore()
