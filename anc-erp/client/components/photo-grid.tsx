import type { EvidencePhoto } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type PhotoGridProps = {
  photos: EvidencePhoto[];
};

export function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Photo Grid</p>
          <h3>사진 목록</h3>
        </div>
      </div>
      <div className="card-grid">
        {photos.map((photo) => (
          <article className="card muted-card" key={photo.id}>
            <div className="card-head">
              <strong>{photo.fileName}</strong>
              <StatusBadge
                tone={photo.photoType === "action_photo" ? "success" : "review"}
                label={photo.photoType === "action_photo" ? "조치사진" : "지적사진"}
              />
            </div>
            <p>{photo.caption ?? "캡션 없음"}</p>
            <p className="table-subtext">{photo.storagePath}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
