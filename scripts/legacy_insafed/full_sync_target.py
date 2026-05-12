from __future__ import annotations

from pathlib import Path


def resolve_target_base_url(base_url: str, repo_root: Path) -> str:
    normalized = base_url.strip().rstrip("/")
    if normalized.endswith("/api/v1") or normalized.endswith("/api/safety"):
        return normalized
    env_path = repo_root / ".env.local"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() == "SAFETY_API_UPSTREAM_BASE_URL" and value.strip():
                return value.strip().strip('"').strip("'").rstrip("/")
    return normalized
