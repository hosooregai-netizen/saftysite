import Link from "next/link";
import type { ReactNode } from "react";

import { globalNavigation } from "../lib/module-registry";
import { ActivityLogPanel } from "./activity-log-panel";
import { GlobalSearch } from "./global-search";
import { ProjectSwitcher } from "./project-switcher";
import { StatusBadge } from "./status-badge";

type ErpShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function ErpShell({ title, subtitle, children }: ErpShellProps) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="brand">A&C ERP</p>
        <p className="brand-subtitle">
          문서 중심 건설안전기술사 ERP
          <br />
          Bootstrap Skeleton
        </p>
        <section className="sidebar-summary">
          <p className="sidebar-summary-label">Containment</p>
          <strong>Project → InspectionRound → DocumentInstance</strong>
          <span>기능 폴더는 구현 단위이며, 실제 데이터 소유권은 부모 aggregate에 귀속됩니다.</span>
        </section>
        <p className="nav-group-title">Global Modules</p>
        <nav className="nav-list" aria-label="ERP navigation">
          {globalNavigation.map((item) => (
            <Link className="nav-link" href={item.route} key={item.featureId}>
              <span className="nav-link-title">{item.name}</span>
              <span className="nav-link-meta">{item.primaryContainer}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="workspace">
        <div className="topbar">
          <section className="topbar-card topbar-primary">
            <h1 className="workspace-title">{title}</h1>
            <p className="workspace-subtitle">{subtitle}</p>
          </section>
          <section className="topbar-utility">
            <div className="utility-row">
              <ProjectSwitcher />
              <StatusBadge tone="review" label="AI Draft Safe" />
              <StatusBadge tone="success" label="Containment Locked" />
            </div>
            <div className="topbar-card">
              <div className="utility-row" style={{ justifyContent: "space-between" }}>
                <GlobalSearch />
                <span className="pill outline">Root Entity: Project</span>
              </div>
            </div>
          </section>
        </div>
        <div className="workspace-shell">
          <div className="workspace-main">
            <div className="content-grid">{children}</div>
          </div>
          <aside className="workspace-rail">
            <ActivityLogPanel />
            <section className="panel">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Linkage Map</p>
                  <h3 className="panel-title">핵심 연결 키</h3>
                </div>
                <StatusBadge tone="neutral" label="Docs Source of Truth" />
              </div>
              <div className="key-value-grid">
                <div className="kv-card">
                  <strong>projectId</strong>
                  <span>모든 루트 업무와 웹하드/메일 기준 키</span>
                </div>
                <div className="kv-card">
                  <strong>inspectionRoundId</strong>
                  <span>체크리스트, 지적, 사진대지, 산안비 기준 키</span>
                </div>
                <div className="kv-card">
                  <strong>ownerPartyId</strong>
                  <span>발주처별 보고서/제출 분기</span>
                </div>
                <div className="kv-card">
                  <strong>documentId</strong>
                  <span>결재, 서명, 제출, export 연결</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
