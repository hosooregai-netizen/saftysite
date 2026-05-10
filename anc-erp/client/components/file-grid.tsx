import type { FileAsset } from "../../packages/contracts/src";
import { FileCard } from "./file-card";

export function FileGrid({ files }: { files: FileAsset[] }) {
  return (
    <section className="card-grid">
      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </section>
  );
}

