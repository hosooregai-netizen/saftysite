import Link from "next/link";

import type { WebhardFolderNode } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

function TreeNode({ node, projectId }: { node: WebhardFolderNode; projectId: string }) {
  return (
    <li className="webhard-tree-node">
      <div className="webhard-tree-link-row">
        <Link className="inline-link" href={`/webhard/projects/${projectId}/folders/${node.folder.id}`}>
          {node.folder.name}
        </Link>
        <StatusBadge tone={node.folder.isSystem ? "review" : "neutral"} label={node.folder.type} />
      </div>
      {node.children.length > 0 ? (
        <ul className="webhard-tree-children">
          {node.children.map((child) => (
            <TreeNode key={child.folder.id} node={child} projectId={projectId} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ProjectFolderTree({ projectId, tree }: { projectId: string; tree: WebhardFolderNode[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectFolderTree</p>
          <h3 className="panel-title">프로젝트 폴더</h3>
          <p className="inline-link-meta">시스템 폴더와 사용자 폴더를 함께 보여 주되, 최종본과 메일 첨부 위치를 분명히 구분합니다.</p>
        </div>
        <span className="pill outline">{tree.length} root</span>
      </div>
      <ul className="webhard-tree-list">
        {tree.map((node) => (
          <TreeNode key={node.folder.id} node={node} projectId={projectId} />
        ))}
      </ul>
    </section>
  );
}
