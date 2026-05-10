import { ErpShell } from "../../../../components/erp-shell";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import { ProjectPartyForm } from "../../../../components/project-forms";
import { ProjectPartyTable } from "../../../../components/project-party-table";
import {
  ContractorPartyCard,
  EngineerPartyCard,
  OwnerPartyCard,
} from "../../../../components/project-summary-cards";
import { loadProjectDetailData } from "../../../../lib/project-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPartiesPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectDetailData(projectId);
  const { aggregate } = pageData;
  const orgMap = new Map(aggregate.organizations.map((item) => [item.id, item]));

  return (
    <ErpShell title="관계자 탭" subtitle="발주처, 시공사, 엔지니어링사 역할과 보고서 제출 분기를 확인합니다.">
      <ProjectDetailLayout activeLabel="관계자" projectId={projectId}>
        <ProjectPartyTable organizations={aggregate.organizations} parties={aggregate.projectParties} />
        <ProjectPartyForm parties={aggregate.projectParties} />
        <div className="card-grid">
          {aggregate.projectParties
            .filter((party) => party.role === "owner")
            .map((party) => (
              <OwnerPartyCard key={party.id} organization={orgMap.get(party.organizationId)!} party={party} />
            ))}
          {aggregate.projectParties
            .filter((party) => party.role === "contractor")
            .map((party) => (
              <ContractorPartyCard
                key={party.id}
                organization={orgMap.get(party.organizationId)!}
                party={party}
              />
            ))}
          {aggregate.projectParties
            .filter((party) => party.role === "engineer")
            .map((party) => (
              <EngineerPartyCard
                key={party.id}
                organization={orgMap.get(party.organizationId)!}
                party={party}
              />
            ))}
        </div>
      </ProjectDetailLayout>
    </ErpShell>
  );
}
