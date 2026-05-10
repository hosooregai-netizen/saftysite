import type { Organization, ProjectParty } from "../../packages/contracts/src";
import { ProjectStatusBadge } from "./project-status-badge";

export function ProjectPartyTable({
  parties,
  organizations,
}: {
  parties: ProjectParty[];
  organizations: Organization[];
}) {
  const organizationMap = new Map(organizations.map((item) => [item.id, item]));

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectPartyTable</p>
          <h3>관계자 원장</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>조직명</th>
            <th>역할</th>
            <th>분담금액</th>
            <th>분담비율</th>
            <th>별도 보고서</th>
            <th>정렬</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((party) => (
            <tr key={party.id}>
              <td>{organizationMap.get(party.organizationId)?.name ?? "미지정"}</td>
              <td>{party.role}</td>
              <td>{party.shareAmount?.toLocaleString("ko-KR") ?? "-"}원</td>
              <td>{party.shareRatio ?? "-"}%</td>
              <td>{party.requiresSeparateReport ? "예" : "아니오"}</td>
              <td>
                <ProjectStatusBadge status="planning" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
