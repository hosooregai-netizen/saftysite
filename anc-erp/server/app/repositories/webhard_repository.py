from copy import deepcopy

from server.app.domain.models import (
    FileActivity,
    FileAsset,
    FileClassificationSuggestion,
    FileEntityLink,
    FileVersion,
    Folder,
    ShareLink,
    ShareLinkAccessLog,
    StorageObject,
    UploadSession,
)
from server.app.repositories.project_repository import ProjectRepository


DEFAULT_FOLDER_ROWS = [
    ("00_계약_견적", "contract"),
    ("01_발주처_제공자료", "owner_material"),
    ("02_시공사_제출자료", "contractor_material"),
    ("03_공사개요_공정표", "schedule"),
    ("04_현장점검", "inspection"),
    ("05_현장사진", "site_photo"),
    ("06_보고서_초안", "draft_report"),
    ("07_검토본", "review_report"),
    ("08_최종본", "final_report"),
    ("09_메일첨부", "mail_attachment"),
    ("99_기타", "custom"),
]


class WebhardRepository:
    def __init__(self, project_repository: ProjectRepository) -> None:
        self.project_repository = project_repository
        self.folders: dict[str, Folder] = {}
        self.files: dict[str, FileAsset] = {}
        self.versions: dict[str, list[FileVersion]] = {}
        self.links: dict[str, list[FileEntityLink]] = {}
        self.share_links: dict[str, ShareLink] = {}
        self.share_logs: dict[str, list[ShareLinkAccessLog]] = {}
        self.activities: dict[str, list[FileActivity]] = {}
        self.project_activities: dict[str, list[FileActivity]] = {}
        self.classification_suggestions: dict[str, FileClassificationSuggestion] = {}
        self.storage_objects: dict[str, StorageObject] = {}
        self.upload_sessions: dict[str, UploadSession] = {}
        self._seed()

    def _seed(self) -> None:
        project = self.project_repository.get_project("project-sample-001")
        if not project:
            return
        self.bootstrap_project_folders(project.id, round_count=project.totalInspectionRounds or 10, project_name=project.projectName)
        final_folder = self.find_folder_by_path(project.id, f"/{project.projectName}/08_최종본")
        photo_folder = self.find_folder_by_path(project.id, f"/{project.projectName}/05_현장사진/원본")
        mail_folder = self.find_folder_by_path(project.id, f"/{project.projectName}/09_메일첨부")

        if final_folder:
            file_asset = FileAsset(
                id="file-asset-webhard-sample-001",
                projectId=project.id,
                folderId=final_folder.id,
                fileName="제1회_이행확인보고서_최종본.pdf",
                originalFileName="제1회_이행확인보고서_최종본.pdf",
                fileType="application/pdf",
                mimeType="application/pdf",
                extension="pdf",
                sizeBytes=2480000,
                storagePath=f"{final_folder.path}/제1회_이행확인보고서_최종본.pdf",
                storageKey=f"{project.id}/08_final/report-final.pdf",
                linkedEntityType="document_instance",
                linkedEntityId="doc-sample-001",
                source="generated_document",
                status="locked",
                tags=["final_report", "submitted"],
                currentVersionId="file-version-webhard-sample-001",
                previewStatus="ready",
                createdAt="2026-05-10T09:00:00+09:00",
                updatedAt="2026-05-10T09:30:00+09:00",
                isLocked=True,
            )
            self.save_file(file_asset)
            self.save_version(
                FileVersion(
                    id="file-version-webhard-sample-001",
                    fileId=file_asset.id,
                    versionNo=1,
                    versionKind="final",
                    fileName=file_asset.fileName,
                    storageKey=file_asset.storageKey or "",
                    sizeBytes=file_asset.sizeBytes,
                    createdBy="user-engineer-001",
                    createdAt=file_asset.createdAt,
                    changeSummary="최초 최종본 저장",
                )
            )
            self.save_link(
                FileEntityLink(
                    id="file-link-webhard-sample-001",
                    fileId=file_asset.id,
                    projectId=project.id,
                    entityType="document_instance",
                    entityId="doc-sample-001",
                    relationType="final_output",
                    createdAt=file_asset.createdAt,
                )
            )
            self.add_activity(
                FileActivity(
                    id="file-activity-webhard-sample-001",
                    fileId=file_asset.id,
                    folderId=final_folder.id,
                    projectId=project.id,
                    activityType="uploaded",
                    actorId="system",
                    message="보고서 최종본이 웹하드에 저장되었습니다.",
                    createdAt=file_asset.createdAt,
                )
            )
            share_link = self.save_share_link(
                ShareLink(
                    id="share-link-sample-001",
                    fileId=file_asset.id,
                    projectId=project.id,
                    tokenHash="share-token-sample-001",
                    title="발주처 공유 링크",
                    permission="view_and_download",
                    expiresAt="2026-06-30T18:00:00+09:00",
                    isRevoked=False,
                    createdBy="user-engineer-001",
                    createdAt="2026-05-10T10:00:00+09:00",
                )
            )
            self.add_share_log(
                ShareLinkAccessLog(
                    id="share-link-log-sample-001",
                    shareLinkId=share_link.id,
                    accessedAt="2026-05-10T10:10:00+09:00",
                    action="view",
                    ipHash="hash-sample",
                    userAgent="seed",
                )
            )

        if photo_folder:
            photo = FileAsset(
                id="file-asset-webhard-sample-002",
                projectId=project.id,
                folderId=photo_folder.id,
                fileName="현장전경_001.jpg",
                originalFileName="현장전경_001.jpg",
                fileType="image/jpeg",
                mimeType="image/jpeg",
                extension="jpg",
                sizeBytes=580000,
                storagePath=f"{photo_folder.path}/현장전경_001.jpg",
                storageKey=f"{project.id}/05_photo/site-photo-001.jpg",
                linkedEntityType="inspection_round",
                linkedEntityId="round-sample-001",
                source="photo_capture",
                status="active",
                tags=["site_photo"],
                currentVersionId="file-version-webhard-sample-002",
                previewStatus="ready",
                createdAt="2026-05-09T15:00:00+09:00",
                updatedAt="2026-05-09T15:00:00+09:00",
            )
            self.save_file(photo)
            self.save_version(
                FileVersion(
                    id="file-version-webhard-sample-002",
                    fileId=photo.id,
                    versionNo=1,
                    versionKind="original",
                    fileName=photo.fileName,
                    storageKey=photo.storageKey or "",
                    sizeBytes=photo.sizeBytes,
                    createdBy="user-inspector-001",
                    createdAt=photo.createdAt,
                )
            )

        if mail_folder:
            attachment = FileAsset(
                id="file-asset-webhard-sample-003",
                projectId=project.id,
                folderId=mail_folder.id,
                fileName="시공사_제출_사용내역서.pdf",
                originalFileName="시공사_제출_사용내역서.pdf",
                fileType="application/pdf",
                mimeType="application/pdf",
                extension="pdf",
                sizeBytes=990000,
                storagePath=f"{mail_folder.path}/시공사_제출_사용내역서.pdf",
                storageKey=f"{project.id}/09_mail/mail-attachment-001.pdf",
                linkedEntityType="mail_message",
                linkedEntityId="mail-message-sample-001",
                source="mail_attachment",
                status="active",
                tags=["mail_attachment", "safety_cost"],
                currentVersionId="file-version-webhard-sample-003",
                previewStatus="ready",
                createdAt="2026-05-08T11:00:00+09:00",
                updatedAt="2026-05-08T11:00:00+09:00",
            )
            self.save_file(attachment)
            self.save_version(
                FileVersion(
                    id="file-version-webhard-sample-003",
                    fileId=attachment.id,
                    versionNo=1,
                    versionKind="original",
                    fileName=attachment.fileName,
                    storageKey=attachment.storageKey or "",
                    sizeBytes=attachment.sizeBytes,
                    createdBy="user-admin-001",
                    createdAt=attachment.createdAt,
                )
            )

        if mail_folder:
            deleted_file = FileAsset(
                id="file-asset-webhard-sample-004",
                projectId=project.id,
                folderId=mail_folder.id,
                fileName="삭제예정_임시자료.txt",
                originalFileName="삭제예정_임시자료.txt",
                fileType="text/plain",
                mimeType="text/plain",
                extension="txt",
                sizeBytes=1200,
                storagePath=f"{mail_folder.path}/삭제예정_임시자료.txt",
                storageKey=f"{project.id}/trash/temp-file.txt",
                linkedEntityType="project",
                linkedEntityId=project.id,
                source="upload",
                status="deleted",
                tags=["other"],
                currentVersionId="file-version-webhard-sample-004",
                previewStatus="none",
                createdAt="2026-05-07T10:00:00+09:00",
                updatedAt="2026-05-07T10:30:00+09:00",
            )
            self.save_file(deleted_file)
            self.save_version(
                FileVersion(
                    id="file-version-webhard-sample-004",
                    fileId=deleted_file.id,
                    versionNo=1,
                    versionKind="working",
                    fileName=deleted_file.fileName,
                    storageKey=deleted_file.storageKey or "",
                    sizeBytes=deleted_file.sizeBytes,
                    createdBy="user-engineer-001",
                    createdAt=deleted_file.createdAt,
                )
            )

    def bootstrap_project_folders(self, project_id: str, round_count: int, project_name: str) -> list[Folder]:
        existing = self.list_project_folders(project_id)
        if existing:
            return existing
        created_at = "2026-05-10T09:00:00+09:00"
        root = self.save_folder(
            Folder(
                id=f"folder-root-{project_id}",
                projectId=project_id,
                parentFolderId=None,
                name=project_name,
                type="project_root",
                path=f"/{project_name}",
                displayOrder=0,
                isSystem=True,
                isArchived=False,
                createdBy="system",
                createdAt=created_at,
                updatedAt=created_at,
            )
        )
        for index, (name, folder_type) in enumerate(DEFAULT_FOLDER_ROWS, start=1):
            folder = self.save_folder(
                Folder(
                    id=f"folder-{project_id}-{index:02d}",
                    projectId=project_id,
                    parentFolderId=root.id,
                    name=name,
                    type=folder_type,
                    path=f"{root.path}/{name}",
                    displayOrder=index,
                    isSystem=True,
                    isArchived=False,
                    createdBy="system",
                    createdAt=created_at,
                    updatedAt=created_at,
                )
            )
            if folder_type == "inspection":
                for round_no in range(1, round_count + 1):
                    round_name = f"제{round_no}회"
                    self.save_folder(
                        Folder(
                            id=f"folder-{project_id}-inspection-{round_no:02d}",
                            projectId=project_id,
                            parentFolderId=folder.id,
                            name=round_name,
                            type="inspection",
                            path=f"{folder.path}/{round_name}",
                            displayOrder=round_no,
                            isSystem=True,
                            isArchived=False,
                            createdBy="system",
                            createdAt=created_at,
                            updatedAt=created_at,
                        )
                    )
            if folder_type == "site_photo":
                for sub_index, sub_name in enumerate(["원본", "지적사항", "조치현황"], start=1):
                    self.save_folder(
                        Folder(
                            id=f"folder-{project_id}-photo-{sub_index:02d}",
                            projectId=project_id,
                            parentFolderId=folder.id,
                            name=sub_name,
                            type="site_photo",
                            path=f"{folder.path}/{sub_name}",
                            displayOrder=sub_index,
                            isSystem=True,
                            isArchived=False,
                            createdBy="system",
                            createdAt=created_at,
                            updatedAt=created_at,
                        )
                    )
        return self.list_project_folders(project_id)

    def list_project_folders(self, project_id: str) -> list[Folder]:
        return [deepcopy(item) for item in self.folders.values() if item.projectId == project_id]

    def list_folders(self, project_id: str | None = None, parent_folder_id: str | None = None) -> list[Folder]:
        folders = list(self.folders.values())
        if project_id is not None:
            folders = [item for item in folders if item.projectId == project_id]
        if parent_folder_id is not None:
            folders = [item for item in folders if item.parentFolderId == parent_folder_id]
        return [deepcopy(item) for item in sorted(folders, key=lambda item: (item.path, item.displayOrder))]

    def save_folder(self, folder: Folder) -> Folder:
        self.folders[folder.id] = deepcopy(folder)
        return deepcopy(folder)

    def get_folder(self, folder_id: str) -> Folder | None:
        folder = self.folders.get(folder_id)
        return deepcopy(folder) if folder else None

    def delete_folder(self, folder_id: str) -> None:
        self.folders.pop(folder_id, None)

    def find_folder_by_path(self, project_id: str, path: str) -> Folder | None:
        for folder in self.folders.values():
            if folder.projectId == project_id and folder.path == path:
                return deepcopy(folder)
        return None

    def find_folder_by_type(self, project_id: str, folder_type: str) -> Folder | None:
        candidates = [item for item in self.folders.values() if item.projectId == project_id and item.type == folder_type]
        if not candidates:
            return None
        return deepcopy(sorted(candidates, key=lambda item: item.displayOrder)[0])

    def list_files(
        self,
        project_id: str | None = None,
        folder_id: str | None = None,
        status: str | None = None,
        tag: str | None = None,
        linked_entity_type: str | None = None,
        query: str | None = None,
    ) -> list[FileAsset]:
        items = list(self.files.values())
        if project_id is not None:
            items = [item for item in items if item.projectId == project_id]
        if folder_id is not None:
            items = [item for item in items if item.folderId == folder_id]
        if status is not None:
            items = [item for item in items if item.status == status]
        if tag is not None:
            items = [item for item in items if tag in item.tags]
        if linked_entity_type is not None:
            items = [item for item in items if item.linkedEntityType == linked_entity_type]
        if query:
            lowered = query.lower()
            items = [
                item
                for item in items
                if lowered in item.fileName.lower() or any(lowered in tag_item.lower() for tag_item in item.tags)
            ]
        items.sort(key=lambda item: item.updatedAt or item.createdAt, reverse=True)
        return [deepcopy(item) for item in items]

    def save_file(self, file_asset: FileAsset) -> FileAsset:
        self.files[file_asset.id] = deepcopy(file_asset)
        return deepcopy(file_asset)

    def get_file(self, file_id: str) -> FileAsset | None:
        file_asset = self.files.get(file_id)
        return deepcopy(file_asset) if file_asset else None

    def save_version(self, version: FileVersion) -> FileVersion:
        versions = self.versions.setdefault(version.fileId, [])
        versions = [item for item in versions if item.id != version.id]
        versions.append(deepcopy(version))
        versions.sort(key=lambda item: item.versionNo)
        self.versions[version.fileId] = versions
        return deepcopy(version)

    def list_versions(self, file_id: str) -> list[FileVersion]:
        return [deepcopy(item) for item in sorted(self.versions.get(file_id, []), key=lambda item: item.versionNo)]

    def get_version(self, version_id: str) -> FileVersion | None:
        for versions in self.versions.values():
            for version in versions:
                if version.id == version_id:
                    return deepcopy(version)
        return None

    def save_link(self, link: FileEntityLink) -> FileEntityLink:
        items = [item for item in self.links.get(link.fileId, []) if item.id != link.id]
        items.append(deepcopy(link))
        self.links[link.fileId] = items
        return deepcopy(link)

    def list_links(self, file_id: str) -> list[FileEntityLink]:
        return [deepcopy(item) for item in self.links.get(file_id, [])]

    def delete_link(self, file_id: str, link_id: str) -> None:
        self.links[file_id] = [item for item in self.links.get(file_id, []) if item.id != link_id]

    def save_share_link(self, share_link: ShareLink) -> ShareLink:
        self.share_links[share_link.id] = deepcopy(share_link)
        return deepcopy(share_link)

    def get_share_link(self, share_link_id: str) -> ShareLink | None:
        share_link = self.share_links.get(share_link_id)
        return deepcopy(share_link) if share_link else None

    def get_share_link_by_token(self, token: str) -> ShareLink | None:
        for share_link in self.share_links.values():
            if share_link.tokenHash == token:
                return deepcopy(share_link)
        return None

    def list_share_links(self, project_id: str | None = None) -> list[ShareLink]:
        items = list(self.share_links.values())
        if project_id is not None:
            items = [item for item in items if item.projectId == project_id]
        items.sort(key=lambda item: item.createdAt, reverse=True)
        return [deepcopy(item) for item in items]

    def add_share_log(self, log: ShareLinkAccessLog) -> ShareLinkAccessLog:
        self.share_logs.setdefault(log.shareLinkId, []).append(deepcopy(log))
        return deepcopy(log)

    def list_share_logs(self, share_link_id: str) -> list[ShareLinkAccessLog]:
        return [deepcopy(item) for item in self.share_logs.get(share_link_id, [])]

    def add_activity(self, activity: FileActivity) -> FileActivity:
        if activity.fileId:
            self.activities.setdefault(activity.fileId, []).append(deepcopy(activity))
        if activity.projectId:
            self.project_activities.setdefault(activity.projectId, []).append(deepcopy(activity))
        return deepcopy(activity)

    def list_file_activities(self, file_id: str) -> list[FileActivity]:
        return [deepcopy(item) for item in self.activities.get(file_id, [])]

    def list_project_activities(self, project_id: str) -> list[FileActivity]:
        return [deepcopy(item) for item in self.project_activities.get(project_id, [])]

    def save_suggestion(self, suggestion: FileClassificationSuggestion) -> FileClassificationSuggestion:
        self.classification_suggestions[suggestion.fileId] = deepcopy(suggestion)
        return deepcopy(suggestion)

    def get_suggestion(self, file_id: str) -> FileClassificationSuggestion | None:
        suggestion = self.classification_suggestions.get(file_id)
        return deepcopy(suggestion) if suggestion else None

    def save_storage_object(self, storage_object: StorageObject) -> StorageObject:
        self.storage_objects[storage_object.id] = deepcopy(storage_object)
        return deepcopy(storage_object)

    def get_storage_object(self, storage_object_id: str) -> StorageObject | None:
        storage_object = self.storage_objects.get(storage_object_id)
        return deepcopy(storage_object) if storage_object else None

    def save_upload_session(self, session: UploadSession) -> UploadSession:
        self.upload_sessions[session.id] = deepcopy(session)
        return deepcopy(session)

