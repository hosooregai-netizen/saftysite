"use client";

import { useState, useTransition } from "react";

import type { CompanyProfile } from "../../packages/contracts/src";
import { updateAdminCompanyProfileAction, uploadAdminLogoAction, uploadAdminSealAction } from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

export function CompanyProfileForm({ companyProfile }: { companyProfile: CompanyProfile }) {
  const [companyName, setCompanyName] = useState(companyProfile.companyName);
  const [defaultMailFooter, setDefaultMailFooter] = useState(companyProfile.defaultMailFooter ?? "");
  const [message, setMessage] = useState("회사 기본값");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">CompanyProfileForm</p>
          <h3 className="panel-title">회사 프로필</h3>
          <p className="card-copy">문서 하단문구, 메일 footer, 로고/직인 자산을 공통 기본값으로 관리합니다.</p>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <div className="admin-metric-grid">
        <article className="hero-summary-card">
          <span>default signature</span>
          <strong>{companyProfile.defaultSignatureText ?? "미설정"}</strong>
        </article>
        <article className="hero-summary-card">
          <span>document footer</span>
          <strong>{companyProfile.defaultDocumentFooter ?? "미설정"}</strong>
        </article>
      </div>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">회사명</span>
          <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">메일 하단문구</span>
          <textarea rows={4} value={defaultMailFooter} onChange={(event) => setDefaultMailFooter(event.target.value)} />
        </label>
      </div>
      <div className="utility-row" style={{ justifyContent: "flex-start" }}>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await updateAdminCompanyProfileAction({ companyName, defaultMailFooter });
                setMessage("PATCH /admin/company-profile");
              } catch {
                setMessage("회사 정보 저장 대기");
              }
            })
          }
          type="button"
        >
          회사 정보 저장
        </button>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await uploadAdminLogoAction({ fileName: `${companyProfile.id}-logo.png`, fileType: "image/png" });
                setMessage("POST /admin/company-profile/logo");
              } catch {
                setMessage("로고 업로드 대기");
              }
            })
          }
          type="button"
        >
          로고 업로드
        </button>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await uploadAdminSealAction({ fileName: `${companyProfile.id}-seal.png`, fileType: "image/png" });
                setMessage("POST /admin/company-profile/seal");
              } catch {
                setMessage("직인 업로드 대기");
              }
            })
          }
          type="button"
        >
          직인 업로드
        </button>
      </div>
    </section>
  );
}
