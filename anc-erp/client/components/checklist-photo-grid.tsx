import type { ChecklistPhoto } from "../../packages/contracts/src";

export function ChecklistPhotoGrid({ photos }: { photos: ChecklistPhoto[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistPhotoGrid</p>
          <h3>사진 목록</h3>
        </div>
      </div>
      <div className="task-list">
        {photos.map((photo) => (
          <div className="task-item" key={photo.id}>
            <strong>{photo.fileName}</strong>
            <span>{photo.storagePath}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
