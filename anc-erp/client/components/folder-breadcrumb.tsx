import type { Folder } from "../../packages/contracts/src";

export function FolderBreadcrumb({ folder }: { folder?: Folder | null }) {
  return (
    <div className="badge-row">
      {(folder?.path ?? "/").split("/").filter(Boolean).map((item) => (
        <span className="pill outline" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

