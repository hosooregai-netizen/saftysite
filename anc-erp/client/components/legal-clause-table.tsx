"use client";

import { useState, useTransition } from "react";

import type { LegalClause } from "../../packages/contracts/src";
import {
  createAdminLegalClauseAction,
  publishAdminLegalClauseAction,
  updateAdminLegalClauseAction,
} from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

export function LegalClauseTable({ clauses }: { clauses: LegalClause[] }) {
  const [message, setMessage] = useState("법령 문구");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LegalClauseTable</p>
          <h3 className="panel-title">법령 문구 승인 관리</h3>
          <p className="card-copy">법령 문구는 임의 발행 대신 change reason, 승인자, 발행 시점을 함께 확인하며 운영합니다.</p>
        </div>
        <StatusBadge tone={isPending ? "warning" : "danger"} label={message} />
      </div>
      <div className="admin-warning-strip caution">
        승인 없이 published로 바꾸지 않습니다. 법령 문구 변경은 review/approval 이력을 남긴 뒤 반영합니다.
      </div>
      <div className="utility-row" style={{ justifyContent: "flex-start", marginBottom: 16 }}>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await createAdminLegalClauseAction({
                  clauseCode: "LEGAL-DRAFT-001",
                  title: "초안 법령 문구",
                  body: "검토 중인 문구 초안",
                });
                setMessage("POST /admin/legal-clauses");
              } catch {
                setMessage("법령 등록 대기");
              }
            })
          }
          type="button"
        >
          법령 문구 등록
        </button>
      </div>
      <div className="stack-list">
        {clauses.map((clause) => (
          <article className="ops-item" key={clause.id}>
            <div>
              <strong>{clause.title}</strong>
              <span>{clause.body}</span>
              <span className="table-subtext">
                {clause.clauseCode} / 변경사유 {clause.changeReason ?? "미입력"} / 승인자 {clause.approvedBy ?? "대기"}
              </span>
            </div>
            <div className="badge-row">
              <StatusBadge tone={clause.status === "approved" ? "success" : "warning"} label={clause.status} />
              <button
                className="inline-link button-reset"
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await updateAdminLegalClauseAction(clause.id, {
                        changeReason: "운영 검토 반영",
                        body: clause.body,
                      });
                      setMessage(`PATCH /legal-clauses/${clause.id}`);
                    } catch {
                      setMessage("법령 수정 대기");
                    }
                  })
                }
                type="button"
              >
                수정
              </button>
              <button
                className="inline-link button-reset"
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await publishAdminLegalClauseAction(clause.id, { reason: "승인 완료" });
                      setMessage(`POST /legal-clauses/${clause.id}/publish`);
                    } catch {
                      setMessage("법령 발행 대기");
                    }
                  })
                }
                type="button"
              >
                발행
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
