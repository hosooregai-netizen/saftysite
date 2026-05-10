from pathlib import Path
from uuid import uuid4

from server.app.domain.models import StorageObject


class LocalWebhardStorageAdapter:
    def __init__(self, root_path: str | None = None) -> None:
        base = Path(root_path) if root_path else Path(__file__).resolve().parents[3] / ".tmp" / "webhard"
        self.root_path = base
        self.root_path.mkdir(parents=True, exist_ok=True)

    def store_file(
        self,
        project_id: str,
        folder_path: str,
        file_name: str,
        mime_type: str,
        size_bytes: int,
        content_text: str | None = None,
    ) -> StorageObject:
        storage_key = self._build_storage_key(project_id, folder_path, file_name)
        absolute_path = self.root_path / storage_key
        absolute_path.parent.mkdir(parents=True, exist_ok=True)
        absolute_path.write_text(content_text or f"draft placeholder for {file_name}\n", encoding="utf-8")
        return StorageObject(
            id=f"storage-object-{uuid4().hex[:8]}",
            storageKey=storage_key,
            absolutePath=str(absolute_path),
            mimeType=mime_type,
            sizeBytes=max(size_bytes, 1),
            createdAt="2026-05-10T09:00:00+09:00",
        )

    def _build_storage_key(self, project_id: str, folder_path: str, file_name: str) -> str:
        safe_folder = folder_path.strip("/").replace(" ", "_")
        safe_name = file_name.replace("/", "_")
        return f"{project_id}/{safe_folder}/{uuid4().hex[:8]}-{safe_name}"

