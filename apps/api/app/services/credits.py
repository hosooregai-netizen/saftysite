from __future__ import annotations

from ..apps_stack import _clean, _collection, _new_id
from ..config import FREE_TRIAL_CREDITS
from ..models import CreditLedgerEntry


def _ledger_collection():
    return _collection("app_credit_ledger")


def _to_entry(document: dict | None) -> CreditLedgerEntry | None:
    cleaned = _clean(document)
    if cleaned is None:
        return None
    return CreditLedgerEntry(**cleaned)


def ledger_balance(workspace_id: str) -> int:
    total = 0
    for document in _ledger_collection().find({"workspace_id": workspace_id}):
        total += int(document.get("amount") or 0)
    return total


def list_ledger_entries(workspace_id: str) -> list[CreditLedgerEntry]:
    rows = [
        _to_entry(document)
        for document in _ledger_collection().find({"workspace_id": workspace_id}).sort("created_at", -1)
    ]
    return [row for row in rows if row is not None]


def add_ledger_entry(
    workspace_id: str,
    entry_type: str,
    amount: int,
    description: str,
    report_id: str | None = None,
    *,
    source_order_id: str | None = None,
    source_payment_key: str | None = None,
) -> CreditLedgerEntry:
    entry = CreditLedgerEntry(
        id=_new_id("ledger"),
        workspace_id=workspace_id,
        type=entry_type,
        amount=amount,
        description=description,
        report_id=report_id,
        source_order_id=source_order_id,
        source_payment_key=source_payment_key,
    )
    document = entry.model_dump()
    document["_id"] = entry.id
    _ledger_collection().replace_one({"_id": entry.id}, document, upsert=True)
    return entry


def grant_workspace_trial(workspace_id: str) -> CreditLedgerEntry:
    existing = _to_entry(
        _ledger_collection().find_one(
            {"workspace_id": workspace_id, "type": "grant_free_trial"}
        )
    )
    if existing is not None:
        return existing

    return add_ledger_entry(
        workspace_id=workspace_id,
        entry_type="grant_free_trial",
        amount=FREE_TRIAL_CREDITS,
        description="신규 워크스페이스 무료 체험 2건 지급",
    )
