from __future__ import annotations

from collections import defaultdict
from uuid import uuid4

from .models import (
    AiRun,
    CreditLedgerEntry,
    DrivePermission,
    DriveItem,
    DriveShare,
    ExportDisclaimerAcceptance,
    Membership,
    PhotoAsset,
    ReportExport,
    ReportRecord,
    User,
    WorkspaceMailboxDraft,
    WorkspacePhotoAlbumItem,
    WorkspaceGroup,
    WorkspaceGroupMember,
    Workspace,
)


class InMemoryStore:
    def __init__(self) -> None:
        self.users: dict[str, User] = {}
        self.tokens: dict[str, str] = {}
        self.auth_oauth_states: dict[str, dict[str, str]] = {}
        self.workspaces: dict[str, Workspace] = {}
        self.memberships: dict[str, Membership] = {}
        self.credit_ledger: dict[str, list[CreditLedgerEntry]] = defaultdict(list)
        self.reports: dict[str, ReportRecord] = {}
        self.photos: dict[str, PhotoAsset] = {}
        self.workspace_mailbox_drafts: dict[str, WorkspaceMailboxDraft] = {}
        self.workspace_photo_album_items: dict[str, WorkspacePhotoAlbumItem] = {}
        self.drive_items: dict[str, DriveItem] = {}
        self.drive_shares: dict[str, DriveShare] = {}
        self.drive_permissions: dict[str, DrivePermission] = {}
        self.workspace_groups: dict[str, WorkspaceGroup] = {}
        self.workspace_group_members: dict[str, WorkspaceGroupMember] = {}
        self.ai_runs: dict[str, AiRun] = {}
        self.exports: dict[str, list[ReportExport]] = defaultdict(list)
        self.export_disclaimer_acceptances: dict[str, ExportDisclaimerAcceptance] = {}

    @staticmethod
    def new_id(prefix: str) -> str:
        return f"{prefix}_{uuid4().hex[:12]}"


store = InMemoryStore()
