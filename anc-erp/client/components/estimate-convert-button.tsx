"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import { StatusBadge } from "./status-badge";

export function EstimateConvertButton({ estimateId }: { estimateId: string }) {
  const [message, setMessage] = useState("전환 대기");
  const api = useMemo(
    () => createAncErpApiClient({ baseUrl: getDefaultAncErpApiBaseUrl() }),
    [],
  );

  async function handleConvert() {
    setMessage("전환 중");
    try {
      await api.convertEstimateToContract(estimateId);
      setMessage("전환 API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">EstimateConvertButton</p>
          <h3>계약 전환</h3>
          <p>견적 상세에서 바로 계약 전환 API를 호출할 수 있습니다.</p>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleConvert} type="button">
          계약 전환 API 호출
        </button>
        <Link className="inline-link" href={`/estimates/${estimateId}/preview`}>
          견적 미리보기
        </Link>
      </div>
    </section>
  );
}
