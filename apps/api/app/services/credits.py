from __future__ import annotations

from ..config import FREE_TRIAL_CREDITS
from ..models import CreditLedgerEntry
from ..store import store


def ledger_balance(workspace_id: str) -> int:
    return sum(entry.amount for entry in store.credit_ledger[workspace_id])


def add_ledger_entry(
    workspace_id: str,
    entry_type: str,
    amount: int,
    description: str,
    report_id: str | None = None,
) -> CreditLedgerEntry:
    entry = CreditLedgerEntry(
        id=store.new_id("ledger"),
        workspace_id=workspace_id,
        type=entry_type,
        amount=amount,
        description=description,
        report_id=report_id,
    )
    store.credit_ledger[workspace_id].append(entry)
    return entry


def grant_workspace_trial(workspace_id: str) -> CreditLedgerEntry:
    return add_ledger_entry(
        workspace_id=workspace_id,
        entry_type="grant_free_trial",
        amount=FREE_TRIAL_CREDITS,
        description="신규 워크스페이스 무료 체험 2건 지급",
    )
