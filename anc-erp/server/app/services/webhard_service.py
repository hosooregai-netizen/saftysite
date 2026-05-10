from dataclasses import asdict
from uuid import uuid4

from server.app.domain.models import (
    FileActivity,
    FileAsset,
    FileClassificationSuggestion,
    FileEntityLink,
    FileVersion,
    Folder,
    ShareLink,
    ShareLinkAccessLog,
    UploadSession,
)
from server.app.repositories.project_repository import ProjectRepository
from server.app.repositories.webhard_repository import WebhardRepository
from server.app.services.webhard_storage_adapter import LocalWebhardStorageAdapter


class WebhardNotFoundError(Exception):
    pass


class WebhardValidationError(Exception):
    pass


class WebhardService:
    def __init__(
        self,
        repository: WebhardRepository,
        project_repository: ProjectRepository,
        storage_adapter: LocalWebhardStorageAdapter,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.storage_adapter = storage_adapter

    def list_folders(self, project_id: str | None = None, parent_folder_id: str | None = None) -> list[dict]:
        if project_id:
            self._require_project(project_id)
        return [asdict(item) for item in self.repository.list_folders(project_id, parent_folder_id)]

    def create_folder(self, payload: dict) -> dict:
        parent = self.repository.get_folder(payload.get("parentFolderId")) if payload.get("parentFolderId") else None
        project_id = payload.get("projectId") or (parent.projectId if parent else None)
        if not project_id:
            raise WebhardValidationError("projectId is required")
        project = self._require_project(project_id)
        base_path = parent.path if parent else f"/{project.projectName}"
        folder = self.repository.save_folder(
            Folder(
                id=f"folder-{uuid4().hex[:8]}",
                projectId=project_id,
                parentFolderId=parent.id if parent else None,
                name=payload["name"],
                type=payload.get("type") or "custom",
                path=f"{base_path}/{payload['name']}",
                displayOrder=payload.get("displayOrder", 0),
                isSystem=False,
                isArchived=False,
                createdBy=payload.get("createdBy"),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        return {"folder": asdict(folder), "tree": self.get_folder_tree(project_id)}

    def get_folder(self, folder_id: str) -> dict:
        return asdict(self._require_folder(folder_id))

    def update_folder(self, folder_id: str, payload: dict) -> dict:
        folder = self._require_folder(folder_id)
        if payload.get("name"):
            folder.name = payload["name"]
            parent_path = self.repository.get_folder(folder.parentFolderId).path if folder.parentFolderId else f"/{self._require_project(folder.projectId or '').projectName}"
            folder.path = f"{parent_path}/{folder.name}"
        if payload.get("isArchived") is not None:
            folder.isArchived = payload["isArchived"]
        folder.updatedAt = self._now()
        stored = self.repository.save_folder(folder)
        return {"folder": asdict(stored), "tree": self.get_folder_tree(stored.projectId or "")}

    def delete_folder(self, folder_id: str, admin_override: bool = False) -> dict:
        folder = self._require_folder(folder_id)
        if folder.isSystem and not admin_override:
            raise WebhardValidationError("system folders cannot be deleted")
        self.repository.delete_folder(folder_id)
        return {"deleted": True, "folderId": folder_id}

    def bootstrap_project_folders(self, project_id: str) -> dict:
        project = self._require_project(project_id)
        folders = self.repository.bootstrap_project_folders(
            project.id,
            round_count=project.totalInspectionRounds or 10,
            project_name=project.projectName,
        )
        return {"projectId": project_id, "folders": [asdict(item) for item in folders], "tree": self.get_folder_tree(project_id)}

    def move_folder(self, folder_id: str, parent_folder_id: str | None) -> dict:
        folder = self._require_folder(folder_id)
        parent = self.repository.get_folder(parent_folder_id) if parent_folder_id else None
        if parent and parent.projectId != folder.projectId:
            raise WebhardValidationError("destination folder must belong to same project")
        folder.parentFolderId = parent.id if parent else None
        root_path = f"/{self._require_project(folder.projectId or '').projectName}"
        folder.path = f"{parent.path if parent else root_path}/{folder.name}"
        folder.updatedAt = self._now()
        stored = self.repository.save_folder(folder)
        return {"folder": asdict(stored), "tree": self.get_folder_tree(stored.projectId or "")}

    def get_folder_tree(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        folders = self.repository.list_project_folders(project_id)
        by_parent: dict[str | None, list[Folder]] = {}
        for folder in folders:
            by_parent.setdefault(folder.parentFolderId, []).append(folder)
        for items in by_parent.values():
            items.sort(key=lambda item: (item.displayOrder, item.name))

        def build(parent_id: str | None) -> list[dict]:
            return [
                {"folder": asdict(folder), "children": build(folder.id)}
                for folder in by_parent.get(parent_id, [])
            ]

        return build(None)

    def list_files(
        self,
        project_id: str | None = None,
        folder_id: str | None = None,
        status: str | None = None,
        tag: str | None = None,
        linked_entity_type: str | None = None,
        query: str | None = None,
    ) -> list[dict]:
        if project_id:
            self._require_project(project_id)
        if folder_id:
            self._require_folder(folder_id)
        return [
            asdict(item)
            for item in self.repository.list_files(project_id, folder_id, status, tag, linked_entity_type, query)
        ]

    def upload_file(self, payload: dict) -> dict:
        if not payload.get("folderId"):
            raise WebhardValidationError("folderId is required")
        if payload.get("sizeBytes", 0) <= 0:
            raise WebhardValidationError("file size must be greater than 0")
        project = self._require_project(payload["projectId"])
        folder = self._require_folder(payload["folderId"])
        if folder.projectId != project.id:
            raise WebhardValidationError("folderId must belong to projectId")
        if payload.get("source") == "generated_document" and not (
            payload.get("linkedEntityType") == "document_instance" and payload.get("linkedEntityId")
        ):
            raise WebhardValidationError("generated_document should link to DocumentInstance")
        if payload.get("source") == "mail_attachment" and not (
            payload.get("linkedEntityType") == "mail_message" and payload.get("linkedEntityId")
        ):
            raise WebhardValidationError("mail_attachment should link to MailMessage")

        session = self.repository.save_upload_session(
            UploadSession(
                id=f"upload-session-{uuid4().hex[:8]}",
                projectId=project.id,
                folderId=folder.id,
                status="completed",
                fileNames=[payload["fileName"]],
                createdAt=self._now(),
                completedAt=self._now(),
            )
        )
        storage_object = self.repository.save_storage_object(
            self.storage_adapter.store_file(
                project_id=project.id,
                folder_path=folder.path,
                file_name=payload["fileName"],
                mime_type=payload.get("mimeType", "application/octet-stream"),
                size_bytes=payload["sizeBytes"],
                content_text=payload.get("contentText"),
            )
        )
        extension = payload["fileName"].split(".")[-1].lower() if "." in payload["fileName"] else ""
        file_asset = self.repository.save_file(
            FileAsset(
                id=f"file-asset-{uuid4().hex[:8]}",
                projectId=project.id,
                folderId=folder.id,
                ownerPartyId=payload.get("ownerPartyId"),
                inspectionRoundId=payload.get("inspectionRoundId"),
                fileName=payload["fileName"],
                originalFileName=payload.get("originalFileName") or payload["fileName"],
                extension=extension or None,
                mimeType=payload.get("mimeType", "application/octet-stream"),
                fileType=payload.get("mimeType", "application/octet-stream"),
                sizeBytes=payload["sizeBytes"],
                storagePath=f"{folder.path}/{payload['fileName']}",
                storageKey=storage_object.storageKey,
                linkedEntityType=payload.get("linkedEntityType") or "project",
                linkedEntityId=payload.get("linkedEntityId") or project.id,
                source=payload.get("source", "upload"),
                status="locked" if self._should_lock(payload.get("tags", []), payload.get("source")) else "active",
                tags=payload.get("tags", []),
                previewStatus="ready" if payload.get("mimeType", "").startswith(("image/", "application/pdf")) else "none",
                uploadedBy=payload.get("uploadedBy"),
                createdAt=self._now(),
                updatedAt=self._now(),
                isLocked=self._should_lock(payload.get("tags", []), payload.get("source")),
            )
        )
        version_kind = self._default_version_kind(file_asset)
        version = self.repository.save_version(
            FileVersion(
                id=f"file-version-{uuid4().hex[:8]}",
                fileId=file_asset.id,
                versionNo=1,
                versionKind=version_kind,
                fileName=file_asset.fileName,
                storageKey=file_asset.storageKey or "",
                sizeBytes=file_asset.sizeBytes,
                changeSummary="초기 업로드",
                createdBy=file_asset.uploadedBy,
                createdAt=self._now(),
            )
        )
        file_asset.currentVersionId = version.id
        stored = self.repository.save_file(file_asset)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=stored.id,
                folderId=stored.folderId,
                projectId=stored.projectId,
                activityType="uploaded",
                actorId=stored.uploadedBy,
                message=f"{stored.fileName} 파일이 업로드되었습니다.",
                metadata={"uploadSessionId": session.id},
                createdAt=self._now(),
            )
        )
        if payload.get("linkedEntityType") and payload.get("linkedEntityId"):
            self.repository.save_link(
                FileEntityLink(
                    id=f"file-link-{uuid4().hex[:8]}",
                    fileId=stored.id,
                    projectId=stored.projectId,
                    entityType=payload["linkedEntityType"],
                    entityId=payload["linkedEntityId"],
                    relationType="attachment",
                    createdAt=self._now(),
                )
            )
        suggestion = self.classify_file(stored.id)["suggestion"]
        return {"file": asdict(stored), "currentVersion": asdict(version), "activity": asdict(activity), "suggestion": suggestion}

    def get_file_detail(self, file_id: str) -> dict:
        file_asset = self._require_file(file_id)
        folder = self.repository.get_folder(file_asset.folderId) if file_asset.folderId else None
        suggestion = self.repository.get_suggestion(file_id)
        return {
            "file": asdict(file_asset),
            "folder": asdict(folder) if folder else None,
            "versions": [asdict(item) for item in self.repository.list_versions(file_id)],
            "links": [asdict(item) for item in self.repository.list_links(file_id)],
            "shareLinks": [asdict(item) for item in self._share_links_for_file(file_id)],
            "activities": [asdict(item) for item in self.repository.list_file_activities(file_id)],
            "suggestion": asdict(suggestion) if suggestion else None,
        }

    def update_file(self, file_id: str, payload: dict) -> dict:
        file_asset = self._require_file(file_id)
        if file_asset.isLocked and payload.get("fileName") and payload["fileName"] != file_asset.fileName:
            raise WebhardValidationError("locked files cannot be renamed")
        old_tags = list(file_asset.tags)
        for key, value in payload.items():
            if value is not None and hasattr(file_asset, key):
                setattr(file_asset, key, value)
        file_asset.updatedAt = self._now()
        if file_asset.status == "locked":
            file_asset.isLocked = True
        stored = self.repository.save_file(file_asset)
        activity = None
        if payload.get("tags") is not None and payload.get("tags") != old_tags:
            activity = self.repository.add_activity(
                FileActivity(
                    id=f"file-activity-{uuid4().hex[:8]}",
                    fileId=stored.id,
                    folderId=stored.folderId,
                    projectId=stored.projectId,
                    activityType="tagged",
                    actorId="user-engineer-001",
                    message="파일 태그가 업데이트되었습니다.",
                    createdAt=self._now(),
                )
            )
        return {"file": asdict(stored), "currentVersion": asdict(self._current_version(stored.id)) if self._current_version(stored.id) else None, "activity": asdict(activity) if activity else None, "suggestion": asdict(self.repository.get_suggestion(stored.id)) if self.repository.get_suggestion(stored.id) else None}

    def delete_file(self, file_id: str, admin_override: bool = False) -> dict:
        file_asset = self._require_file(file_id)
        if (file_asset.isLocked or self._has_restricted_tag(file_asset.tags)) and not admin_override:
            raise WebhardValidationError("locked files cannot be deleted")
        file_asset.status = "deleted"
        file_asset.updatedAt = self._now()
        stored = self.repository.save_file(file_asset)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=stored.id,
                folderId=stored.folderId,
                projectId=stored.projectId,
                activityType="deleted",
                actorId="user-engineer-001",
                message="파일이 휴지통으로 이동되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(stored), "currentVersion": asdict(self._current_version(stored.id)) if self._current_version(stored.id) else None, "activity": asdict(activity)}

    def restore_file(self, file_id: str) -> dict:
        file_asset = self._require_file(file_id)
        file_asset.status = "active"
        file_asset.updatedAt = self._now()
        stored = self.repository.save_file(file_asset)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=stored.id,
                folderId=stored.folderId,
                projectId=stored.projectId,
                activityType="restored",
                actorId="user-engineer-001",
                message="파일이 복구되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(stored), "currentVersion": asdict(self._current_version(stored.id)) if self._current_version(stored.id) else None, "activity": asdict(activity)}

    def archive_file(self, file_id: str) -> dict:
        file_asset = self._require_file(file_id)
        file_asset.status = "archived"
        file_asset.updatedAt = self._now()
        stored = self.repository.save_file(file_asset)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=stored.id,
                folderId=stored.folderId,
                projectId=stored.projectId,
                activityType="archived",
                actorId="user-engineer-001",
                message="파일이 보관 상태로 변경되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(stored), "currentVersion": asdict(self._current_version(stored.id)) if self._current_version(stored.id) else None, "activity": asdict(activity)}

    def lock_file(self, file_id: str) -> dict:
        file_asset = self._require_file(file_id)
        file_asset.status = "locked"
        file_asset.isLocked = True
        file_asset.updatedAt = self._now()
        stored = self.repository.save_file(file_asset)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=stored.id,
                folderId=stored.folderId,
                projectId=stored.projectId,
                activityType="locked",
                actorId="user-engineer-001",
                message="파일 잠금이 설정되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(stored), "currentVersion": asdict(self._current_version(stored.id)) if self._current_version(stored.id) else None, "activity": asdict(activity)}

    def unlock_file(self, file_id: str) -> dict:
        file_asset = self._require_file(file_id)
        file_asset.status = "active"
        file_asset.isLocked = False
        file_asset.updatedAt = self._now()
        stored = self.repository.save_file(file_asset)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=stored.id,
                folderId=stored.folderId,
                projectId=stored.projectId,
                activityType="restored",
                actorId="user-engineer-001",
                message="파일 잠금이 해제되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(stored), "currentVersion": asdict(self._current_version(stored.id)) if self._current_version(stored.id) else None, "activity": asdict(activity)}

    def move_file(self, file_id: str, folder_id: str) -> dict:
        file_asset = self._require_file(file_id)
        if file_asset.isLocked:
            raise WebhardValidationError("locked files cannot be moved")
        folder = self._require_folder(folder_id)
        file_asset.folderId = folder.id
        file_asset.storagePath = f"{folder.path}/{file_asset.fileName}"
        file_asset.updatedAt = self._now()
        stored = self.repository.save_file(file_asset)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=stored.id,
                folderId=stored.folderId,
                projectId=stored.projectId,
                activityType="moved",
                actorId="user-engineer-001",
                message=f"파일이 {folder.name} 폴더로 이동되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(stored), "currentVersion": asdict(self._current_version(stored.id)) if self._current_version(stored.id) else None, "activity": asdict(activity)}

    def copy_file(self, file_id: str, payload: dict) -> dict:
        original = self._require_file(file_id)
        folder = self._require_folder(payload["folderId"])
        copied = self.repository.save_file(
            FileAsset(
                **{
                    **asdict(original),
                    "id": f"file-asset-{uuid4().hex[:8]}",
                    "folderId": folder.id,
                    "fileName": payload.get("fileName") or f"사본_{original.fileName}",
                    "storagePath": f"{folder.path}/{payload.get('fileName') or f'사본_{original.fileName}'}",
                    "currentVersionId": None,
                    "status": "active",
                    "isLocked": False,
                    "createdAt": self._now(),
                    "updatedAt": self._now(),
                }
            )
        )
        current = self._current_version(original.id)
        version = None
        if current:
            version = self.repository.save_version(
                FileVersion(
                    id=f"file-version-{uuid4().hex[:8]}",
                    fileId=copied.id,
                    versionNo=1,
                    versionKind=current.versionKind,
                    fileName=copied.fileName,
                    storageKey=current.storageKey,
                    sizeBytes=current.sizeBytes,
                    checksum=current.checksum,
                    changeSummary="파일 복사본 생성",
                    createdBy="user-engineer-001",
                    createdAt=self._now(),
                )
            )
            copied.currentVersionId = version.id
            copied = self.repository.save_file(copied)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=copied.id,
                folderId=copied.folderId,
                projectId=copied.projectId,
                activityType="copied",
                actorId="user-engineer-001",
                message="파일 복사본이 생성되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(copied), "currentVersion": asdict(version) if version else None, "activity": asdict(activity)}

    def get_download(self, file_id: str) -> dict:
        file_asset = self._require_file(file_id)
        self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=file_asset.id,
                folderId=file_asset.folderId,
                projectId=file_asset.projectId,
                activityType="downloaded",
                actorId="user-engineer-001",
                message="파일 다운로드가 요청되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(file_asset), "downloadPath": file_asset.storagePath}

    def get_preview(self, file_id: str) -> dict:
        file_asset = self._require_file(file_id)
        self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=file_asset.id,
                folderId=file_asset.folderId,
                projectId=file_asset.projectId,
                activityType="previewed",
                actorId="user-engineer-001",
                message="파일 미리보기가 열렸습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(file_asset), "previewPath": file_asset.storagePath, "previewStatus": file_asset.previewStatus}

    def bulk_action(self, payload: dict) -> dict:
        action = payload["action"]
        results: list[dict] = []
        for file_id in payload["fileIds"]:
            if action == "archive":
                results.append(self.archive_file(file_id)["file"])
            elif action == "restore":
                results.append(self.restore_file(file_id)["file"])
            elif action == "delete":
                results.append(self.delete_file(file_id)["file"])
            elif action == "lock":
                results.append(self.lock_file(file_id)["file"])
            elif action == "unlock":
                results.append(self.unlock_file(file_id)["file"])
            elif action == "move" and payload.get("destinationFolderId"):
                results.append(self.move_file(file_id, payload["destinationFolderId"])["file"])
            else:
                raise WebhardValidationError("unsupported bulk action")
        return {"action": action, "files": results}

    def list_versions(self, file_id: str) -> list[dict]:
        self._require_file(file_id)
        return [asdict(item) for item in self.repository.list_versions(file_id)]

    def add_version(self, file_id: str, payload: dict) -> dict:
        file_asset = self._require_file(file_id)
        next_version_no = len(self.repository.list_versions(file_id)) + 1
        version = self.repository.save_version(
            FileVersion(
                id=f"file-version-{uuid4().hex[:8]}",
                fileId=file_id,
                versionNo=next_version_no,
                versionKind=payload.get("versionKind", "working"),
                fileName=payload.get("fileName") or file_asset.fileName,
                storageKey=file_asset.storageKey or "",
                sizeBytes=payload.get("sizeBytes", file_asset.sizeBytes or 1),
                changeSummary=payload.get("changeSummary"),
                createdBy=payload.get("createdBy"),
                createdAt=self._now(),
            )
        )
        file_asset.currentVersionId = version.id
        if payload.get("fileName"):
            file_asset.fileName = payload["fileName"]
        if version.versionKind in {"final", "signed", "submitted"}:
            file_asset.status = "locked"
            file_asset.isLocked = True
        file_asset.updatedAt = self._now()
        stored = self.repository.save_file(file_asset)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=file_id,
                folderId=file_asset.folderId,
                projectId=file_asset.projectId,
                activityType="version_added",
                actorId=payload.get("createdBy"),
                message="새 파일 버전이 추가되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(stored), "version": asdict(version), "versions": [asdict(item) for item in self.repository.list_versions(file_id)], "activity": asdict(activity)}

    def download_version(self, version_id: str) -> dict:
        version = self._require_version(version_id)
        return {"version": asdict(version), "downloadPath": version.storageKey}

    def restore_version_as_current(self, version_id: str) -> dict:
        version = self._require_version(version_id)
        file_asset = self._require_file(version.fileId)
        file_asset.currentVersionId = version.id
        file_asset.fileName = version.fileName
        file_asset.updatedAt = self._now()
        stored = self.repository.save_file(file_asset)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=file_asset.id,
                folderId=file_asset.folderId,
                projectId=file_asset.projectId,
                activityType="restored",
                actorId="user-engineer-001",
                message="버전을 현재 버전으로 복원했습니다.",
                createdAt=self._now(),
            )
        )
        return {"file": asdict(stored), "version": asdict(version), "versions": [asdict(item) for item in self.repository.list_versions(file_asset.id)], "activity": asdict(activity)}

    def list_share_links(self, project_id: str | None = None) -> list[dict]:
        if project_id:
            self._require_project(project_id)
        return [asdict(item) for item in self.repository.list_share_links(project_id)]

    def create_share_link(self, payload: dict) -> dict:
        if not payload.get("fileId") and not payload.get("folderId"):
            raise WebhardValidationError("ShareLink must target either fileId or folderId")
        token = f"share-{uuid4().hex[:10]}"
        share_link = self.repository.save_share_link(
            ShareLink(
                id=f"share-link-{uuid4().hex[:8]}",
                fileId=payload.get("fileId"),
                folderId=payload.get("folderId"),
                projectId=payload.get("projectId"),
                tokenHash=token,
                title=payload.get("title"),
                permission=payload.get("permission", "view_and_download"),
                expiresAt=payload.get("expiresAt"),
                passwordHash=payload.get("password"),
                isRevoked=False,
                createdBy=payload.get("createdBy"),
                createdAt=self._now(),
            )
        )
        activity = None
        target_file_id = payload.get("fileId")
        if target_file_id:
            file_asset = self._require_file(target_file_id)
            activity = self.repository.add_activity(
                FileActivity(
                    id=f"file-activity-{uuid4().hex[:8]}",
                    fileId=file_asset.id,
                    folderId=file_asset.folderId,
                    projectId=file_asset.projectId,
                    activityType="shared",
                    actorId=payload.get("createdBy"),
                    message="공유 링크가 생성되었습니다.",
                    createdAt=self._now(),
                )
            )
        return {"shareLink": asdict(share_link), "publicUrl": f"/share/{token}", "activity": asdict(activity) if activity else None}

    def get_share_link(self, share_link_id: str) -> dict:
        return asdict(self._require_share_link(share_link_id))

    def update_share_link(self, share_link_id: str, payload: dict) -> dict:
        share_link = self._require_share_link(share_link_id)
        for key, value in payload.items():
            if value is not None and hasattr(share_link, key if key != "password" else "passwordHash"):
                setattr(share_link, key if key != "password" else "passwordHash", value)
        stored = self.repository.save_share_link(share_link)
        return {"shareLink": asdict(stored), "publicUrl": f"/share/{stored.tokenHash}", "activity": None}

    def delete_share_link(self, share_link_id: str) -> dict:
        share_link = self._require_share_link(share_link_id)
        share_link.isRevoked = True
        share_link.revokedAt = self._now()
        stored = self.repository.save_share_link(share_link)
        return {"deleted": True, "shareLinkId": stored.id}

    def revoke_share_link(self, share_link_id: str) -> dict:
        share_link = self._require_share_link(share_link_id)
        share_link.isRevoked = True
        share_link.revokedAt = self._now()
        stored = self.repository.save_share_link(share_link)
        activity = None
        if stored.fileId:
            file_asset = self._require_file(stored.fileId)
            activity = self.repository.add_activity(
                FileActivity(
                    id=f"file-activity-{uuid4().hex[:8]}",
                    fileId=file_asset.id,
                    folderId=file_asset.folderId,
                    projectId=file_asset.projectId,
                    activityType="share_revoked",
                    actorId="user-engineer-001",
                    message="공유 링크가 폐기되었습니다.",
                    createdAt=self._now(),
                )
            )
        return {"shareLink": asdict(stored), "publicUrl": f"/share/{stored.tokenHash}", "activity": asdict(activity) if activity else None}

    def get_public_share(self, token: str) -> dict:
        share_link = self._require_share_token(token)
        if share_link.isRevoked:
            log = self.repository.add_share_log(
                ShareLinkAccessLog(
                    id=f"share-link-log-{uuid4().hex[:8]}",
                    shareLinkId=share_link.id,
                    accessedAt=self._now(),
                    action="denied",
                )
            )
            raise WebhardValidationError(f"revoked share link: {log.id}")
        if share_link.expiresAt and share_link.expiresAt < self._now():
            self.repository.add_share_log(
                ShareLinkAccessLog(
                    id=f"share-link-log-{uuid4().hex[:8]}",
                    shareLinkId=share_link.id,
                    accessedAt=self._now(),
                    action="expired",
                )
            )
            raise WebhardValidationError("share link expired")
        access_log = self.repository.add_share_log(
            ShareLinkAccessLog(
                id=f"share-link-log-{uuid4().hex[:8]}",
                shareLinkId=share_link.id,
                accessedAt=self._now(),
                action="view",
            )
        )
        file_asset = self.repository.get_file(share_link.fileId) if share_link.fileId else None
        folder = self.repository.get_folder(share_link.folderId) if share_link.folderId else None
        files = self.repository.list_files(project_id=share_link.projectId, folder_id=share_link.folderId) if share_link.folderId else []
        return {
            "shareLink": asdict(share_link),
            "file": asdict(file_asset) if file_asset else None,
            "folder": asdict(folder) if folder else None,
            "files": [asdict(item) for item in files],
            "accessLog": asdict(access_log),
            "downloadAllowed": share_link.permission in {"download", "view_and_download"},
        }

    def download_public_share(self, token: str) -> dict:
        payload = self.get_public_share(token)
        share_link = self._require_share_token(token)
        if not payload["downloadAllowed"]:
            self.repository.add_share_log(
                ShareLinkAccessLog(
                    id=f"share-link-log-{uuid4().hex[:8]}",
                    shareLinkId=share_link.id,
                    accessedAt=self._now(),
                    action="denied",
                )
            )
            raise WebhardValidationError("download is not allowed")
        self.repository.add_share_log(
            ShareLinkAccessLog(
                id=f"share-link-log-{uuid4().hex[:8]}",
                shareLinkId=share_link.id,
                accessedAt=self._now(),
                action="download",
            )
        )
        return payload

    def list_links(self, file_id: str) -> list[dict]:
        self._require_file(file_id)
        return [asdict(item) for item in self.repository.list_links(file_id)]

    def create_link(self, file_id: str, payload: dict) -> dict:
        file_asset = self._require_file(file_id)
        link = self.repository.save_link(
            FileEntityLink(
                id=f"file-link-{uuid4().hex[:8]}",
                fileId=file_id,
                projectId=payload.get("projectId") or file_asset.projectId,
                entityType=payload["entityType"],
                entityId=payload["entityId"],
                relationType=payload.get("relationType", "attachment"),
                createdAt=self._now(),
            )
        )
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=file_id,
                folderId=file_asset.folderId,
                projectId=file_asset.projectId,
                activityType="linked",
                actorId="user-engineer-001",
                message="파일 연결 대상이 추가되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"link": asdict(link), "links": [asdict(item) for item in self.repository.list_links(file_id)], "activity": asdict(activity)}

    def delete_link(self, file_id: str, link_id: str) -> dict:
        file_asset = self._require_file(file_id)
        self.repository.delete_link(file_id, link_id)
        activity = self.repository.add_activity(
            FileActivity(
                id=f"file-activity-{uuid4().hex[:8]}",
                fileId=file_id,
                folderId=file_asset.folderId,
                projectId=file_asset.projectId,
                activityType="unlinked",
                actorId="user-engineer-001",
                message="파일 연결 대상이 제거되었습니다.",
                createdAt=self._now(),
            )
        )
        return {"deleted": True, "fileId": file_id, "linkId": link_id, "activity": asdict(activity)}

    def classify_file(self, file_id: str) -> dict:
        file_asset = self._require_file(file_id)
        file_name = file_asset.fileName.lower()
        recommended_folder = None
        tags: list[str] = []
        confidence = 0.6
        rationale = "파일명/출처 기반 초기 추천입니다."
        if "계약" in file_name or "견적" in file_name:
            recommended_folder = self.repository.find_folder_by_type(file_asset.projectId, "contract")
            tags = ["contract"]
            confidence = 0.92
            rationale = "계약/견적 키워드가 확인되었습니다."
        elif file_asset.source == "generated_document":
            recommended_folder = self.repository.find_folder_by_type(file_asset.projectId, "final_report")
            tags = ["final_report"]
            confidence = 0.96
            rationale = "문서 export 파일은 최종본 폴더를 우선 추천합니다."
        elif file_asset.source == "mail_attachment":
            recommended_folder = self.repository.find_folder_by_type(file_asset.projectId, "mail_attachment")
            tags = ["mail_attachment"]
            confidence = 0.88
            rationale = "메일 첨부 저장 출처를 확인했습니다."
        elif file_asset.fileType.startswith("image/") or file_asset.source == "photo_capture":
            recommended_folder = self.repository.find_folder_by_path(
                file_asset.projectId,
                f"/{self._require_project(file_asset.projectId).projectName}/05_현장사진/원본",
            )
            tags = ["site_photo"]
            confidence = 0.84
            rationale = "이미지 파일과 현장 사진 업로드 패턴을 확인했습니다."
        else:
            recommended_folder = self.repository.find_folder_by_type(file_asset.projectId, "custom")
            tags = file_asset.tags or ["other"]
        suggestion = self.repository.save_suggestion(
            FileClassificationSuggestion(
                id=f"file-classification-{uuid4().hex[:8]}",
                fileId=file_id,
                recommendedFolderId=recommended_folder.id if recommended_folder else None,
                recommendedFolderPath=recommended_folder.path if recommended_folder else None,
                recommendedTags=tags,
                recommendedEntityType=file_asset.linkedEntityType,
                recommendedEntityId=file_asset.linkedEntityId,
                confidence=confidence,
                needsConfirmation=confidence < 0.85,
                rationale=rationale,
                createdAt=self._now(),
            )
        )
        return {"fileId": file_id, "suggestion": asdict(suggestion)}

    def apply_classification(self, file_id: str, payload: dict) -> dict:
        file_asset = self._require_file(file_id)
        if payload.get("folderId"):
            folder = self._require_folder(payload["folderId"])
            file_asset.folderId = folder.id
            file_asset.storagePath = f"{folder.path}/{file_asset.fileName}"
        if payload.get("tags"):
            file_asset.tags = payload["tags"]
        file_asset.updatedAt = self._now()
        stored = self.repository.save_file(file_asset)
        if payload.get("entityType") and payload.get("entityId"):
            self.repository.save_link(
                FileEntityLink(
                    id=f"file-link-{uuid4().hex[:8]}",
                    fileId=file_id,
                    projectId=file_asset.projectId,
                    entityType=payload["entityType"],
                    entityId=payload["entityId"],
                    relationType=payload.get("relationType", "attachment"),
                    createdAt=self._now(),
                )
            )
        return {"file": asdict(stored), "currentVersion": asdict(self._current_version(file_id)) if self._current_version(file_id) else None, "activity": None, "suggestion": asdict(self.repository.get_suggestion(file_id)) if self.repository.get_suggestion(file_id) else None}

    def get_mail_attachment_save_suggestions(self, message_id: str, project_id: str | None) -> dict:
        if not project_id:
            raise WebhardValidationError("projectId query is required")
        project = self._require_project(project_id)
        folder = self.repository.find_folder_by_type(project.id, "mail_attachment")
        if not folder:
            raise WebhardValidationError("mail attachment folder is missing")
        return {
            "projectId": project.id,
            "folder": asdict(folder),
            "suggestedTags": ["mail_attachment"],
            "linkedEntityType": "mail_message",
            "linkedEntityId": message_id,
        }

    def save_mail_attachment(self, message_id: str, payload: dict) -> dict:
        suggestion = self.get_mail_attachment_save_suggestions(message_id, payload.get("projectId"))
        upload_payload = {
            "projectId": payload["projectId"],
            "folderId": payload.get("folderId") or suggestion["folder"]["id"],
            "fileName": payload["fileName"],
            "mimeType": payload.get("mimeType", "application/octet-stream"),
            "sizeBytes": payload.get("sizeBytes", 1),
            "source": "mail_attachment",
            "tags": payload.get("tags") or suggestion["suggestedTags"],
            "linkedEntityType": "mail_message",
            "linkedEntityId": message_id,
            "contentText": payload.get("contentText"),
            "uploadedBy": "user-admin-001",
        }
        result = self.upload_file(upload_payload)
        links = self.repository.list_links(result["file"]["id"])
        link = next((item for item in links if item.entityType == "mail_message"), None)
        return {"file": result["file"], "link": asdict(link) if link else None, "activity": result["activity"]}

    def list_file_activities(self, file_id: str) -> list[dict]:
        self._require_file(file_id)
        return [asdict(item) for item in self.repository.list_file_activities(file_id)]

    def list_webhard_activities(self, project_id: str | None = None) -> list[dict]:
        if project_id:
            self._require_project(project_id)
            return [asdict(item) for item in self.repository.list_project_activities(project_id)]
        items: list[FileActivity] = []
        for project in self.project_repository.list_projects():
            items.extend(self.repository.list_project_activities(project.id))
        items.sort(key=lambda item: item.createdAt, reverse=True)
        return [asdict(item) for item in items]

    def search_files(
        self,
        project_id: str | None = None,
        folder_id: str | None = None,
        tag: str | None = None,
        linked_entity_type: str | None = None,
        query: str | None = None,
    ) -> dict:
        items = self.repository.list_files(project_id, folder_id, None, tag, linked_entity_type, query)
        return {"items": [asdict(item) for item in items], "totalCount": len(items)}

    def get_storage_usage(self, project_id: str | None = None) -> dict:
        items = self.repository.list_files(project_id=project_id)
        return {
            "projectId": project_id,
            "totalFiles": len(items),
            "activeFiles": sum(1 for item in items if item.status == "active"),
            "deletedFiles": sum(1 for item in items if item.status == "deleted"),
            "lockedFiles": sum(1 for item in items if item.status == "locked" or item.isLocked),
            "totalSizeBytes": sum(item.sizeBytes for item in items),
        }

    def _require_project(self, project_id: str):
        project = self.project_repository.get_project(project_id)
        if not project:
            raise WebhardNotFoundError(f"project not found: {project_id}")
        return project

    def _require_folder(self, folder_id: str) -> Folder:
        folder = self.repository.get_folder(folder_id)
        if not folder:
            raise WebhardNotFoundError(f"folder not found: {folder_id}")
        return folder

    def _require_file(self, file_id: str) -> FileAsset:
        file_asset = self.repository.get_file(file_id)
        if not file_asset:
            raise WebhardNotFoundError(f"file not found: {file_id}")
        return file_asset

    def _require_version(self, version_id: str) -> FileVersion:
        version = self.repository.get_version(version_id)
        if not version:
            raise WebhardNotFoundError(f"version not found: {version_id}")
        return version

    def _require_share_link(self, share_link_id: str) -> ShareLink:
        share_link = self.repository.get_share_link(share_link_id)
        if not share_link:
            raise WebhardNotFoundError(f"share link not found: {share_link_id}")
        return share_link

    def _require_share_token(self, token: str) -> ShareLink:
        share_link = self.repository.get_share_link_by_token(token)
        if not share_link:
            raise WebhardNotFoundError(f"share link token not found: {token}")
        return share_link

    def _default_version_kind(self, file_asset: FileAsset) -> str:
        if "submitted" in file_asset.tags:
            return "submitted"
        if "signed" in file_asset.tags:
            return "signed"
        if "final_report" in file_asset.tags or file_asset.source == "generated_document":
            return "final"
        return "original"

    def _should_lock(self, tags: list[str], source: str | None) -> bool:
        return source == "generated_document" or any(tag in {"final_report", "submitted", "signed"} for tag in tags)

    def _has_restricted_tag(self, tags: list[str]) -> bool:
        return any(tag in {"final_report", "submitted", "signed"} for tag in tags)

    def _current_version(self, file_id: str) -> FileVersion | None:
        file_asset = self.repository.get_file(file_id)
        if not file_asset or not file_asset.currentVersionId:
            return None
        return self.repository.get_version(file_asset.currentVersionId)

    def _share_links_for_file(self, file_id: str) -> list[ShareLink]:
        return [item for item in self.repository.list_share_links() if item.fileId == file_id]

    def _now(self) -> str:
        return "2026-05-10T10:00:00+09:00"

