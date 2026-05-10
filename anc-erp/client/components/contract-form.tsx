"use client";

import { useState } from "react";

import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type { Contract, ProjectPartyWithOrganization } from "../../packages/contracts/src";
import { formatCurrency } from "../lib/project-demo-data";
import { StatusBadge } from "./status-badge";

export function ContractForm({
  contract,
  projectParties,
  projectId,
  contractId,
}: {
  contract: Partial<Contract>;
  projectParties: ProjectPartyWithOrganization[];
  projectId?: string;
  contractId?: string;
}) {
  const [actionState, setActionState] = useState("Draft Only");

  async function handleSubmitDraft() {
    if (!projectId && !contractId) {
      return;
    }

    const api = createAncErpApiClient({ baseUrl: getDefaultAncErpApiBaseUrl() });
    setActionState("전송 중");
    try {
      const payload = {
        contractTitle: contract.contractTitle || "새 기술용역계약서 초안",
        contractType: contract.contractType || "technical_service",
        serviceName: contract.serviceName || "",
        serviceScope: contract.serviceScope || "",
        contractAmount: contract.contractAmount || 0,
        vatIncluded: contract.vatIncluded ?? true,
        contractStartDate: contract.contractStartDate || null,
        contractEndDate: contract.contractEndDate || null,
        deliverables: contract.deliverables || [],
        inspectionCount: contract.inspectionCount ?? null,
      };
      if (contractId) {
        await api.updateContract(contractId, payload);
        setActionState("수정 API 연결됨");
      } else if (projectId) {
        await api.createContract(projectId, payload);
        setActionState("생성 API 연결됨");
      }
    } catch {
      setActionState("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractForm</p>
          <h3>{contract.id ? "계약 수정 초안" : "신규 계약 초안"}</h3>
          <p>실저장은 API로 연결되고, 현재 화면은 draft 구조 검토용입니다.</p>
        </div>
        <StatusBadge tone="review" label={actionState} />
      </div>
      <table className="table">
        <tbody>
          <tr>
            <th>계약명</th>
            <td>{contract.contractTitle ?? "신규 기술용역계약서"}</td>
          </tr>
          <tr>
            <th>용역명</th>
            <td>{contract.serviceName ?? "-"}</td>
          </tr>
          <tr>
            <th>계약금액</th>
            <td>{formatCurrency(contract.contractAmount)}</td>
          </tr>
          <tr>
            <th>산출물</th>
            <td>{contract.deliverables?.join(", ") || "-"}</td>
          </tr>
          <tr>
            <th>ProjectParty 적용 후보</th>
            <td>{projectParties.map((item) => item.organization?.name ?? item.organizationId).join(", ")}</td>
          </tr>
        </tbody>
      </table>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handleSubmitDraft} type="button">
          {contractId ? "수정 API 호출" : "생성 API 호출"}
        </button>
      </div>
    </section>
  );
}
