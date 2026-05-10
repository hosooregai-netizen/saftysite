import Link from "next/link";
import type { ReactNode } from "react";

type WebhardSection = "home" | "project" | "recent" | "shared" | "trash" | "search";

type WebhardShellProps = {
  title: string;
  subtitle: string;
  leftRail: ReactNode;
  folderTree?: ReactNode;
  detailPanel?: ReactNode;
  children: ReactNode;
  activeSection: WebhardSection;
  projectId?: string;
};

export function WebhardShell({
  title,
  subtitle,
  leftRail,
  folderTree,
  detailPanel,
  children,
  activeSection,
  projectId,
}: WebhardShellProps) {
  const primaryLinks = [
    { href: "/webhard", key: "home", label: "홈" },
    ...(projectId ? [{ href: `/webhard/projects/${projectId}`, key: "project", label: "프로젝트 공간" }] : []),
    { href: "/webhard/recent", key: "recent", label: "최근 파일" },
    { href: "/webhard/shared", key: "shared", label: "공유 링크" },
    { href: "/webhard/trash", key: "trash", label: "휴지통" },
    { href: "/webhard/search", key: "search", label: "검색" },
  ] as const;

  return (
    <div className="host-shell webhard-host-shell">
      <aside className="host-side-column">{leftRail}</aside>
      <main className="host-main-column">
        <section className="host-hero webhard-host-hero">
          <div className="host-hero-copy">
            <p className="host-kicker">A&C ERP Webhard</p>
            <h1 className="host-title">{title}</h1>
            <p className="host-subtitle">{subtitle}</p>
          </div>
          <div className="host-badge-cluster">
            <span className="status info">full-screen host</span>
            <span className="status submitted">project-linked</span>
            <span className="status review">version aware</span>
          </div>
        </section>

        <nav className="host-tabbar" aria-label="Webhard navigation">
          {primaryLinks.map((item) => (
            <Link
              className={`host-tab-link ${activeSection === item.key ? "active" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="host-context-strip">
          <article className="host-context-card">
            <span>scope</span>
            <strong>{projectId ? `projectId ${projectId}` : "global workspace"}</strong>
          </article>
          <article className="host-context-card">
            <span>containment</span>
            <strong>Project linked file layer</strong>
          </article>
          <article className="host-context-card">
            <span>workflow</span>
            <strong>tree → list → detail</strong>
          </article>
        </section>

        <div className="host-workspace webhard-host-workspace">
          {folderTree ? <aside className="host-secondary-column">{folderTree}</aside> : null}
          <div className="host-content-column">
            <div className="content-grid">{children}</div>
          </div>
          {detailPanel ? <aside className="host-detail-column">{detailPanel}</aside> : null}
        </div>
      </main>
    </div>
  );
}
