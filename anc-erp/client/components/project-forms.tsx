import type { ReactNode } from "react";

import type { Contact, Project, ProjectParty } from "../../packages/contracts/src";
import { formatCurrency, getOrganizationName } from "../lib/project-demo-data";
import { StatusBadge } from "./status-badge";

function FormSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

export function ProjectForm({ project }: { project: Project }) {
  return (
    <div className="section-stack">
      <FormSection eyebrow="기본정보" title="프로젝트 기본정보">
        <div className="form-grid">
          <div className="form-field">
            <label>프로젝트명</label>
            <div className="fake-input">{project.projectName}</div>
          </div>
          <div className="form-field">
            <label>현장명</label>
            <div className="fake-input">{project.siteName}</div>
          </div>
          <div className="form-field span-2">
            <label>현장주소</label>
            <div className="fake-input">{project.siteAddress}</div>
          </div>
        </div>
      </FormSection>

      <FormSection eyebrow="공사정보" title="공사개요 / 금액 / 기간">
        <div className="form-grid">
          <div className="form-field">
            <label>공사종류</label>
            <div className="fake-input">{project.constructionType}</div>
          </div>
          <div className="form-field">
            <label>총 공사금액</label>
            <div className="fake-input">{formatCurrency(project.totalAmount)}</div>
          </div>
          <div className="form-field">
            <label>공사기간</label>
            <div className="fake-input">
              {project.startDate} ~ {project.endDate}
            </div>
          </div>
          <div className="form-field">
            <label>실착공일</label>
            <div className="fake-input">{project.actualStartDate}</div>
          </div>
        </div>
      </FormSection>

      <FormSection eyebrow="점검조건" title="점검주기 / 회차 / 진행상태">
        <div className="form-grid">
          <div className="form-field">
            <label>점검조건</label>
            <div className="fake-input">
              {project.inspectionCycleText} / {project.totalInspectionRounds}회
            </div>
          </div>
          <div className="form-field">
            <label>공정율</label>
            <div className="fake-input">{project.progressRate}%</div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}

export function ProjectPartyForm({ parties }: { parties: ProjectParty[] }) {
  return (
    <FormSection eyebrow="보고서 제출조건" title="발주처 / 시공사 / 엔지니어링사 설정">
      <div className="stack-list">
        {parties.map((party) => (
          <div className="outline-row layered" key={party.id}>
            <div>
              <strong>{getOrganizationName(party.organizationId)}</strong>
              <div className="table-subtext">
                {party.role} / 분담 {party.shareRatio ?? "-"}% / {formatCurrency(party.shareAmount)}
              </div>
            </div>
            <div className="badge-row">
              {party.requiresSeparateReport ? (
                <StatusBadge tone="review" label="별도 보고서" />
              ) : (
                <StatusBadge tone="neutral" label="공통 보고서" />
              )}
              {party.reportRecipient ? (
                <StatusBadge tone="info" label="보고서 수신" />
              ) : null}
              {party.invoiceRecipient ? (
                <StatusBadge tone="success" label="청구 수신" />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

export function ContactForm({ contacts }: { contacts: Contact[] }) {
  return (
    <FormSection eyebrow="담당자" title="연락처 / 수신 설정">
      <div className="stack-list">
        {contacts.map((contact) => (
          <div className="outline-row layered" key={contact.id}>
            <div>
              <strong>{contact.name}</strong>
              <div className="table-subtext">
                {getOrganizationName(contact.organizationId)} / {contact.email ?? "이메일 미입력"}
              </div>
            </div>
            <div className="badge-row">
              {contact.isPrimary ? <StatusBadge tone="success" label="Primary" /> : null}
              {contact.receivesReport ? <StatusBadge tone="review" label="보고서 수신" /> : null}
              {contact.receivesActionRequest ? (
                <StatusBadge tone="warning" label="조치요청 수신" />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}
