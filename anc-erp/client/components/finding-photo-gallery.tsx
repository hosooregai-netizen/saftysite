import Link from "next/link";

import type { EvidencePhoto } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type FindingPhotoGalleryProps = {
  findingId: string;
  photos: EvidencePhoto[];
};

export function FindingPhotoGallery({ findingId, photos }: FindingPhotoGalleryProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Finding Photo Gallery</p>
          <h3>지적 / 조치 사진</h3>
        </div>
        <Link className="inline-link" href={`/findings/${findingId}/photos`}>
          사진 관리
        </Link>
      </div>
      <div className="card-grid">
        {photos.map((photo) => (
          <article className="card" key={photo.id}>
            <div className="card-head">
              <div>
                <h4>{photo.fileName}</h4>
                <p className="table-subtext">{photo.caption ?? "캡션 미입력"}</p>
              </div>
              <StatusBadge
                tone={photo.photoType === "action_photo" ? "success" : "review"}
                label={photo.photoType === "action_photo" ? "조치사진" : "지적사진"}
              />
            </div>
            <p className="table-subtext">{photo.storagePath}</p>
            {photo.markupInfo?.shapes.length ? (
              <StatusBadge tone="warning" label={`마크업 ${photo.markupInfo.shapes.length}개`} />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
