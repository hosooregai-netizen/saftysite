import Link from "next/link";

import {
  containmentSummary,
  documentDetailLinks,
  inspectionRoundLinks,
  projectDetailLinks,
  type ModuleNavigationItem,
} from "../lib/module-registry";
import { DocumentPreview } from "./document-preview";
import { MissingFieldPanel } from "./missing-field-panel";
import { StatusBadge } from "./status-badge";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  module?: ModuleNavigationItem;
  showContainment?: boolean;
  showProjectLinks?: boolean;
  showInspectionLinks?: boolean;
  showDocumentLinks?: boolean;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  module,
  showContainment = false,
  showProjectLinks = false,
  showInspectionLinks = false,
  showDocumentLinks = false,
}: PlaceholderPageProps) {
  return (
    <>
      <section className="card">
        <div className="card-head">
          <div>
            <span className="pill">{eyebrow}</span>
            <h2 style={{ marginTop: 14 }}>{title}</h2>
            <p>{description}</p>
          </div>
          <StatusBadge tone="review" label="Bootstrap Draft" />
        </div>
        {module ? (
          <table className="table" style={{ marginTop: 14 }}>
            <tbody>
              <tr>
                <th>Actual Parent</th>
                <td>{module.actualParent}</td>
              </tr>
              <tr>
                <th>Primary Container</th>
                <td>{module.primaryContainer}</td>
              </tr>
              <tr>
                <th>Placeholder Route</th>
                <td>{module.route}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>
                  <StatusBadge tone="info" label="Placeholder Active" />
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Root Aggregate</p>
          <p className="stat-value">Project</p>
          <p className="stat-caption">모든 데이터와 문서 흐름의 루트 엔티티</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Contained Levels</p>
          <p className="stat-value">3</p>
          <p className="stat-caption">Project / InspectionRound / DocumentInstance</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Global Apps</p>
          <p className="stat-value">5</p>
          <p className="stat-caption">Dashboard, Projects, Webhard, Mail, Admin</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Review Warnings</p>
          <p className="stat-value">2</p>
          <p className="stat-caption">발주처 분기와 문서 내부 결재 route 확인 필요</p>
        </article>
      </section>

      {showProjectLinks ? (
        <section className="card">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Project Detail</p>
              <h3>Project Containment Quick Links</h3>
            </div>
            <StatusBadge tone="success" label="projectId 기준" />
          </div>
          <div className="link-list">
            {projectDetailLinks.map((item) => (
              <Link className="inline-link" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {showInspectionLinks ? (
        <section className="card">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">InspectionRound Detail</p>
              <h3>InspectionRound Quick Links</h3>
            </div>
            <StatusBadge tone="info" label="inspectionRoundId 기준" />
          </div>
          <div className="link-list">
            {inspectionRoundLinks.map((item) => (
              <Link className="inline-link" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {showDocumentLinks ? (
        <section className="card">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">DocumentInstance Detail</p>
              <h3>DocumentInstance Quick Links</h3>
            </div>
            <StatusBadge tone="warning" label="결재/제출은 문서 내부" />
          </div>
          <div className="link-list">
            {documentDetailLinks.map((item) => (
              <Link className="inline-link" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="dense-grid">
        <MissingFieldPanel
          items={[
            {
              label: "ProjectParty seed",
              reason: "다중 발주처 분기용 ownerPartyId 연결 규칙이 아직 bootstrap stub 수준입니다.",
              severity: "required",
            },
            {
              label: "Document snapshot flow",
              reason: "최신 저장본 기반 export 규칙은 route만 준비되어 있고 실제 snapshot 저장은 후속 기능입니다.",
              severity: "recommended",
            },
          ]}
        />
        <DocumentPreview
          title="보고서 A4 미리보기 스켈레톤"
          statusLabel="AI 초안 / 검토 전"
          statusTone="review"
        />
      </section>

      {showContainment ? (
        <section className="card-grid">
          {containmentSummary.map((section) => (
            <article className="card" key={section.title}>
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Containment Layer</p>
                  <h3>{section.title}</h3>
                </div>
                <StatusBadge
                  tone={
                    section.title === "Project"
                      ? "success"
                      : section.title === "InspectionRound"
                        ? "info"
                        : "warning"
                  }
                  label={section.title === "Project" ? "Root" : "Contained"}
                />
              </div>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}
    </>
  );
}
