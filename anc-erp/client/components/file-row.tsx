import Link from "next/link";

import type { FileAsset } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

function formatFileSize(sizeBytes?: number) {
  if (!sizeBytes) {
    return "0 B";
  }
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }
  return `${sizeBytes} B`;
}

function getStatusTone(file: FileAsset) {
  if (file.status === "deleted") {
    return "danger" as const;
  }
  if (file.status === "locked" || file.isLocked) {
    return "review" as const;
  }
  if (file.source === "mail_attachment") {
    return "warning" as const;
  }
  if (file.source === "generated_document") {
    return "submitted" as const;
  }
  return "info" as const;
}

export function FileRow({ file }: { file: FileAsset }) {
  return (
    <tr className="webhard-file-row">
      <td>
        <div className="webhard-file-name-cell">
          <Link className="inline-link" href={`/files/${file.id}`}>
            {file.fileName}
          </Link>
          <div className="badge-row">
            {file.source ? (
              <span className={`micro-pill ${file.source === "mail_attachment" ? "owner" : ""}`}>{file.source}</span>
            ) : null}
            {file.previewStatus ? <span className="micro-pill">{file.previewStatus}</span> : null}
          </div>
        </div>
      </td>
      <td>
        <div className="badge-row">
          {(file.tags ?? []).length > 0 ? (
            file.tags?.map((tag) => (
              <span className="pill outline" key={tag}>
                {tag}
              </span>
            ))
          ) : (
            <span className="inline-link-meta">태그 없음</span>
          )}
        </div>
      </td>
      <td>
        <div className="webhard-link-cell">
          <strong>{file.linkedEntityType}</strong>
          <span className="inline-link-meta">{file.linkedEntityId}</span>
        </div>
      </td>
      <td>{formatFileSize(file.sizeBytes)}</td>
      <td>{file.updatedAt?.slice(0, 10) || file.createdAt?.slice(0, 10) || "-"}</td>
      <td>
        <div className="status-stack">
          <StatusBadge tone={getStatusTone(file)} label={file.status ?? "active"} />
          {file.ownerPartyId ? <span className="micro-pill owner">owner</span> : null}
        </div>
      </td>
    </tr>
  );
}
