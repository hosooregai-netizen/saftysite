import Link from "next/link";

type WebhardRailView = "home" | "project" | "recent" | "shared" | "trash" | "search";

export function WebhardLeftRail({ projectId, activeView }: { projectId?: string; activeView?: WebhardRailView }) {
  const links = [
    { href: "/webhard", label: "내 자료함 홈", view: "home" },
    { href: projectId ? `/webhard/projects/${projectId}` : "/webhard/recent", label: "프로젝트 폴더", view: "project" },
    { href: "/webhard/recent", label: "최근 파일", view: "recent" },
    { href: "/webhard/shared", label: "공유됨", view: "shared" },
    { href: "/webhard/trash", label: "휴지통", view: "trash" },
    { href: "/webhard/search", label: "검색", view: "search" },
  ] as const;

  return (
    <aside className="panel webhard-rail-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">WebhardLeftRail</p>
          <h3 className="panel-title">자료함 탐색</h3>
          <p className="inline-link-meta">프로젝트 파일, 최종본, 메일 첨부, 공유본을 같은 계층에서 관리합니다.</p>
        </div>
        <span className="pill outline">Full-screen</span>
      </div>
      <div className="webhard-rail-section">
        <p className="webhard-rail-label">주요 보기</p>
        <div className="link-list">
          {links.map((link) => (
            <Link className={`inline-link rail-link ${activeView === link.view ? "active" : ""}`} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="webhard-rail-section">
        <p className="webhard-rail-label">상태 배지</p>
        <div className="badge-row">
          <span className="status success">active</span>
          <span className="status review">locked</span>
          <span className="status submitted">shared</span>
          <span className="status warning">mail</span>
          <span className="status danger">trash</span>
        </div>
      </div>
      <div className="missing-panel webhard-attention-panel">
        <strong>운영 체크</strong>
        <div className="missing-list">
          <div className="missing-item">
            <strong>최종본/제출본</strong>
            <span>삭제보다 잠금과 버전 관리가 우선입니다.</span>
          </div>
          <div className="missing-item">
            <strong>문서 연결</strong>
            <span>문서, 메일, 제출과 연결되지 않은 파일은 후속 추적이 약해집니다.</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
