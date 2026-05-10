import Link from "next/link";

import type { FileAsset } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

function getStatusTone(file: FileAsset) {
  if (file.status === "deleted") {
    return "danger" as const;
  }
  if (file.status === "locked" || file.isLocked) {
    return "review" as const;
  }
  if (file.source === "generated_document") {
    return "submitted" as const;
  }
  if (file.source === "mail_attachment") {
    return "warning" as const;
  }
  return "info" as const;
}

export function FileCard({ file }: { file: FileAsset }) {
  return (
    <article className="card webhard-file-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">{file.fileType}</p>
          <h3 style={{ fontSize: 16 }}>
            <Link className="inline-link" href={`/files/${file.id}`}>
              {file.fileName}
            </Link>
          </h3>
          <p className="inline-link-meta">{file.linkedEntityType} · {file.linkedEntityId}</p>
        </div>
        <StatusBadge tone={getStatusTone(file)} label={file.status ?? "active"} />
      </div>
      <p>{file.storagePath}</p>
      <div className="badge-row">
        {file.source ? <span className="micro-pill">{file.source}</span> : null}
        {(file.tags ?? []).map((tag) => (
          <span className="pill outline" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
