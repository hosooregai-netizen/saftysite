import type {
  Contact,
  Organization,
  Project,
  ProjectActivityLog,
  ProjectParty,
  ProjectRelatedCounts,
} from "../../packages/contracts/src";
import { formatCurrency, getOrganizationName } from "../lib/project-demo-data";
import { DocumentPreview } from "./document-preview";
import { ProjectStatusBadge } from "./project-status-badge";
import { StatusBadge } from "./status-badge";

type ProjectSummaryCardProps = {
  project: Project;
  relatedCounts: ProjectRelatedCounts;
};

export function ProjectHeroPanel({
  project,
  parties,
  relatedCounts,
}: {
  project: Project;
  parties: ProjectParty[];
  relatedCounts: ProjectRelatedCounts;
}) {
  const owners = parties.filter((party) => party.role === "owner");
  const reportTargets = owners.filter((party) => party.requiresSeparateReport);

  return (
    <section className="hero-card">
      <div className="hero-head">
        <div>
          <p className="card-eyebrow">Project Root</p>
          <h2 className="hero-title">{project.projectName}</h2>
          <p className="hero-subtitle">
            {project.siteName} · {project.siteAddress}
          </p>
        </div>
        <div className="hero-badges">
          <ProjectStatusBadge status={project.status} />
          <StatusBadge tone="review" label={`발주처 ${owners.length}곳`} />
          <StatusBadge tone="info" label={`보고서 분기 ${reportTargets.length}건`} />
        </div>
      </div>

      <div className="hero-progress-row">
        <div>
          <span className="hero-progress-label">공정율</span>
          <strong className="hero-progress-value">{project.progressRate ?? 0}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${project.progressRate ?? 0}%` }} />
        </div>
      </div>

      <div className="hero-summary-grid">
        <div className="hero-summary-card">
          <span>공사기간</span>
          <strong>
            {project.startDate} ~ {project.endDate}
          </strong>
        </div>
        <div className="hero-summary-card">
          <span>총 공사금액</span>
          <strong>{formatCurrency(project.totalAmount)}</strong>
        </div>
        <div className="hero-summary-card">
          <span>점검 / 문서</span>
          <strong>
            {relatedCounts.inspectionRounds}회 / {relatedCounts.documents}건
          </strong>
        </div>
        <div className="hero-summary-card">
          <span>미조치 / 메일</span>
          <strong>
            {relatedCounts.openFindings}건 / {relatedCounts.mailThreads}건
          </strong>
        </div>
      </div>
    </section>
  );
}

export function ProjectSummaryCard({ project, relatedCounts }: ProjectSummaryCardProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectSummaryCard</p>
          <h3>{project.projectName}</h3>
          <p>{project.siteAddress}</p>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>
      <div className="info-grid">
        <div className="info-item">
          <span>공사기간</span>
          <strong>
            {project.startDate} ~ {project.endDate}
          </strong>
        </div>
        <div className="info-item">
          <span>실착공일</span>
          <strong>{project.actualStartDate}</strong>
        </div>
        <div className="info-item">
          <span>총 공사금액</span>
          <strong>{formatCurrency(project.totalAmount)}</strong>
        </div>
        <div className="info-item">
          <span>공정율</span>
          <strong>{project.progressRate}%</strong>
        </div>
        <div className="info-item">
          <span>점검주기 / 총 회차</span>
          <strong>
            {project.inspectionCycleText} / {project.totalInspectionRounds}회
          </strong>
        </div>
        <div className="info-item">
          <span>연결 문서 / 점검</span>
          <strong>
            문서 {relatedCounts.documents} / 점검 {relatedCounts.inspectionRounds}
          </strong>
        </div>
      </div>
    </section>
  );
}

export function ProjectWorkPanel({
  relatedCounts,
  ownerNames,
}: {
  relatedCounts: ProjectRelatedCounts;
  ownerNames: string[];
}) {
  const tasks = [
    `발주처 ${ownerNames.length}곳의 보고서 분기 여부 확인`,
    `다음 점검 전 미조치 ${relatedCounts.openFindings}건 검토`,
    `제출 예정 문서 ${relatedCounts.documents}건 검토 흐름 점검`,
  ];

  return (
    <section className="card spotlight-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">오늘 필요한 작업</p>
          <h3>프로젝트 운영 체크</h3>
        </div>
        <StatusBadge tone="warning" label="실무 우선" />
      </div>
      <div className="task-list">
        {tasks.map((task, index) => (
          <div className="task-item" key={task}>
            <span className="task-index">0{index + 1}</span>
            <strong>{task}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProjectReportPreview({
  project,
  parties,
}: {
  project: Project;
  parties: ProjectParty[];
}) {
  const owners = parties.filter((party) => party.role === "owner");
  return (
    <DocumentPreview
      title="발주처별 보고서 생성 준비"
      previewTitle={`${project.projectName} 공사개요 초안`}
      rows={owners.map((party) => ({
        label: getOrganizationName(party.organizationId),
        status: party.requiresSeparateReport ? "별도 제출" : "공통 제출",
        note: `${formatCurrency(party.shareAmount)} / ${party.shareRatio ?? 0}%`,
      }))}
      statusLabel="AI 초안 / 원장 기준"
      statusTone="review"
      noteBadges={["AI 초안", "발주처별 분기 확인", "최종 export 전"]}
    />
  );
}

export function ConstructionAmountCard({
  project,
  parties,
}: {
  project: Project;
  parties: ProjectParty[];
}) {
  const owners = parties.filter((party) => party.role === "owner");
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ConstructionAmountCard</p>
          <h3>공사금액 / 발주처 분담</h3>
        </div>
        <StatusBadge tone="info" label="총액 / 분담 구분" />
      </div>
      <div className="metric-stack">
        <div className="metric-row emphasized">
          <span>총 공사금액</span>
          <strong>{formatCurrency(project.totalAmount)}</strong>
        </div>
        {owners.map((party) => (
          <div className="metric-row" key={party.id}>
            <span>{getOrganizationName(party.organizationId)}</span>
            <strong>
              {formatCurrency(party.shareAmount)} / {party.shareRatio ?? 0}%
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InspectionSummaryCard({
  project,
  relatedCounts,
}: {
  project: Project;
  relatedCounts: ProjectRelatedCounts;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionSummaryCard</p>
          <h3>점검 요약</h3>
        </div>
        <StatusBadge tone="success" label="회차 준비 가능" />
      </div>
      <div className="metric-stack">
        <div className="metric-row">
          <span>점검주기</span>
          <strong>{project.inspectionCycleText}</strong>
        </div>
        <div className="metric-row">
          <span>총 점검회차</span>
          <strong>{project.totalInspectionRounds}회</strong>
        </div>
        <div className="metric-row">
          <span>현재 연결 점검</span>
          <strong>{relatedCounts.inspectionRounds}건</strong>
        </div>
      </div>
    </section>
  );
}

function PartyCard({
  title,
  organization,
  party,
}: {
  title: string;
  organization: Organization;
  party: ProjectParty;
}) {
  return (
    <article className="card party-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">{title}</p>
          <h3>{organization.name}</h3>
        </div>
        {party.requiresSeparateReport ? (
          <StatusBadge tone="review" label="별도 보고서" />
        ) : (
          <StatusBadge tone="neutral" label={party.role} />
        )}
      </div>
      <div className="metric-stack">
        <div className="metric-row">
          <span>분담금액</span>
          <strong>{formatCurrency(party.shareAmount)}</strong>
        </div>
        <div className="metric-row">
          <span>분담비율</span>
          <strong>{party.shareRatio ?? "-"}%</strong>
        </div>
        <div className="metric-row">
          <span>보고서 / 청구</span>
          <strong>
            {party.reportRecipient ? "보고서 수신" : "보고서 미수신"} /{" "}
            {party.invoiceRecipient ? "청구 수신" : "청구 미수신"}
          </strong>
        </div>
      </div>
    </article>
  );
}

export function OwnerPartyCard(props: { organization: Organization; party: ProjectParty }) {
  return <PartyCard title="OwnerPartyCard" {...props} />;
}

export function ContractorPartyCard(props: { organization: Organization; party: ProjectParty }) {
  return <PartyCard title="ContractorPartyCard" {...props} />;
}

export function EngineerPartyCard(props: { organization: Organization; party: ProjectParty }) {
  return <PartyCard title="EngineerPartyCard" {...props} />;
}

export function ContactCard({
  contact,
  organization,
}: {
  contact: Contact;
  organization: Organization | undefined;
}) {
  return (
    <article className="card contact-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContactCard</p>
          <h3>{contact.name}</h3>
        </div>
        {contact.isPrimary ? (
          <StatusBadge tone="success" label="Primary" />
        ) : (
          <StatusBadge tone="neutral" label="Contact" />
        )}
      </div>
      <div className="metric-stack">
        <div className="metric-row">
          <span>소속 / 직책</span>
          <strong>
            {organization?.name ?? "미지정"} / {contact.position ?? "-"}
          </strong>
        </div>
        <div className="metric-row">
          <span>연락처</span>
          <strong>
            {contact.phone ?? "-"} / {contact.email ?? "-"}
          </strong>
        </div>
        <div className="metric-row">
          <span>역할</span>
          <strong>{contact.roleDescription ?? "-"}</strong>
        </div>
      </div>
      <div className="contact-flags">
        <StatusBadge tone={contact.receivesReport ? "review" : "neutral"} label={contact.receivesReport ? "보고서 수신" : "보고서 미수신"} />
        <StatusBadge
          tone={contact.receivesActionRequest ? "warning" : "neutral"}
          label={contact.receivesActionRequest ? "조치요청 수신" : "조치요청 미수신"}
        />
      </div>
    </article>
  );
}

export function RelatedCountCards({ counts }: { counts: ProjectRelatedCounts }) {
  return (
    <div className="stats-grid">
      <article className="stat-card">
        <p className="stat-label">계약</p>
        <p className="stat-value">{counts.contracts}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">점검회차</p>
        <p className="stat-value">{counts.inspectionRounds}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">문서</p>
        <p className="stat-value">{counts.documents}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">파일 / 메일</p>
        <p className="stat-value">
          {counts.files} / {counts.mailThreads}
        </p>
      </article>
    </div>
  );
}

export function ProjectActivityTimeline({ items }: { items: ProjectActivityLog[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectActivityTimeline</p>
          <h3>프로젝트 이력</h3>
        </div>
        <StatusBadge tone="info" label={`${items.length}건`} />
      </div>
      <div className="timeline">
        {items.map((item) => (
          <div className="timeline-item enhanced" key={item.id}>
            <strong>{item.summary}</strong>
            <span>{item.createdAt}</span>
            <p>{item.fieldNames.join(", ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
