"use client";

import { useState } from "react";

import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type { PaymentTerm } from "../../packages/contracts/src";

export function PaymentTermForm({ items, contractId }: { items: PaymentTerm[]; contractId?: string }) {
  const [actionState, setActionState] = useState("Draft Only");

  async function handleCreateFirstTerm() {
    if (!contractId || items.length === 0) {
      return;
    }

    const api = createAncErpApiClient({ baseUrl: getDefaultAncErpApiBaseUrl() });
    const first = items[0];
    setActionState("전송 중");
    try {
      await api.createPaymentTerm(contractId, {
        label: first.label,
        triggerText: first.triggerText,
        amount: first.amount,
        ratio: first.ratio,
        status: first.status,
        splitItems: first.splitItems,
      });
      setActionState("지급조건 API 연결됨");
    } catch {
      setActionState("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PaymentTermForm</p>
          <h3>지급조건 입력 초안</h3>
        </div>
        <span className="status review">{actionState}</span>
      </div>
      {items.length > 0 ? (
        <>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                {item.label}: {item.triggerText} / {item.amount.toLocaleString("ko-KR")}원
              </li>
            ))}
          </ul>
          {contractId ? (
            <div className="link-list" style={{ marginTop: 16 }}>
              <button className="inline-link button-reset" onClick={handleCreateFirstTerm} type="button">
                첫 지급조건 API 호출
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <p>신규 계약 초안 단계에서는 지급조건을 비워 두고, 계약 생성 후 Contract 하위에서 등록합니다.</p>
      )}
    </section>
  );
}
