"use client";

import { useState, useTransition } from "react";

import type { DocumentTemplateDetailResponse } from "../../packages/contracts/src";
import {
  createAdminTemplateVersionAction,
  extractAdminTemplateVariablesAction,
  previewAdminTemplateVersionAction,
  publishAdminTemplateVersionAction,
  reviewAdminTemplateVersionAction,
  rollbackAdminTemplateVersionAction,
  validateAdminTemplateVersionAction,
} from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

export function TemplateGovernanceWorkspace({ detail }: { detail: DocumentTemplateDetailResponse }) {
  const [message, setMessage] = useState("템플릿 거버넌스");
  const [previewText, setPreviewText] = useState(
    detail.sections
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((section) => `${section.title}\n${section.body}`)
      .join("\n\n"),
  );
  const [isPending, startTransition] = useTransition();
  const currentVersion = detail.currentVersion ?? detail.versions[0];
  const missingRequiredVariables = currentVersion?.missingRequiredVariables ?? [];
  const readonlyPublished = currentVersion?.status === "published";

  return (
    <section className="admin-governance-layout">
      <article className="panel admin-sticky-panel">
        <div className="admin-sticky-head">
          <div>
            <p className="card-eyebrow">Template Governance</p>
            <h3 className="panel-title">{detail.template.name}</h3>
            <p className="card-copy">
              published는 직접 수정하지 않고, review/publish/rollback으로 버전 수명주기를 관리합니다.
            </p>
          </div>
          <div className="status-stack">
            <StatusBadge tone={readonlyPublished ? "success" : "review"} label={currentVersion?.status ?? "draft"} />
            <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
          </div>
        </div>
        <div className="admin-filter-row">
          <span className="switcher">{detail.template.documentType}</span>
          <span className="switcher">v{currentVersion?.versionNo ?? "-"}</span>
          <span className="switcher">publishedBy {currentVersion?.publishedBy ?? "draft"}</span>
        </div>
        <div className={`admin-warning-strip ${readonlyPublished ? "published" : "draft"}`}>
          {readonlyPublished
            ? "현재 버전은 published 상태입니다. 직접 본문을 바꾸지 말고 새 버전을 생성한 뒤 review/publish로 이동합니다."
            : "현재 버전은 작업용 draft/review 영역입니다. 변수 추출, preview, validate를 먼저 확인한 뒤 publish합니다."}
        </div>
        <div className="key-value-grid">
          <div className="kv-card">
            <strong>templateKey</strong>
            <span>{detail.template.templateKey}</span>
          </div>
          <div className="kv-card">
            <strong>currentVersion</strong>
            <span>v{currentVersion?.versionNo ?? "-"}</span>
          </div>
          <div className="kv-card">
            <strong>sections</strong>
            <span>{detail.sections.length}개</span>
          </div>
          <div className="kv-card">
            <strong>variables</strong>
            <span>{detail.variables.length}개</span>
          </div>
        </div>
        <div className="utility-row" style={{ justifyContent: "flex-start", marginTop: 16 }}>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  await createAdminTemplateVersionAction(detail.template.id, {
                    bodyTemplate: currentVersion.bodyTemplate,
                    changeSummary: "관리자 초안 복제",
                  });
                  setMessage("POST /document-templates/:id/versions");
                } catch {
                  setMessage("버전 생성 대기");
                }
              })
            }
            type="button"
          >
            새 버전 생성
          </button>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  await extractAdminTemplateVariablesAction(currentVersion.id);
                  setMessage("POST /variables/extract");
                } catch {
                  setMessage("변수 추출 대기");
                }
              })
            }
            type="button"
          >
            변수 재추출
          </button>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  const response = await previewAdminTemplateVersionAction(currentVersion.id, { sampleName: "admin_preview" });
                  setPreviewText(response.previewText);
                  setMessage("POST /preview");
                } catch {
                  setMessage("미리보기 대기");
                }
              })
            }
            type="button"
          >
            미리보기 실행
          </button>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  await validateAdminTemplateVersionAction(currentVersion.id);
                  setMessage("POST /validate");
                } catch {
                  setMessage("검증 대기");
                }
              })
            }
            type="button"
          >
            검증 실행
          </button>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  await reviewAdminTemplateVersionAction(currentVersion.id, { reviewNote: "관리자 검토" });
                  setMessage("POST /review");
                } catch {
                  setMessage("검토 전환 대기");
                }
              })
            }
            type="button"
          >
            검토로 전환
          </button>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  await publishAdminTemplateVersionAction(currentVersion.id, { reason: "운영 반영" });
                  setMessage("POST /publish");
                } catch {
                  setMessage("발행 대기");
                }
              })
            }
            type="button"
          >
            발행
          </button>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  await rollbackAdminTemplateVersionAction(currentVersion.id, { reason: "이전 발행본으로 롤백" });
                  setMessage("POST /rollback");
                } catch {
                  setMessage("롤백 대기");
                }
              })
            }
            type="button"
          >
            롤백
          </button>
        </div>
      </article>
      <article className="panel admin-tree-panel">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">Template Sections</p>
            <h3 className="panel-title">섹션 트리 / 변수 맵</h3>
            <p className="card-copy">본문 구조와 owner-specific 변수 사용 범위를 한 화면에서 함께 확인합니다.</p>
          </div>
        </div>
        <div className="admin-tree-list">
          {detail.sections.map((section) => (
            <article className="admin-tree-item" key={section.id}>
              <div>
                <strong>{section.title}</strong>
                <span>{section.body.slice(0, 120)}</span>
              </div>
              <div className="badge-row">
                <StatusBadge tone="info" label={section.key} />
                <small className="table-subtext">{section.displayOrder}번째 섹션</small>
              </div>
            </article>
          ))}
        </div>
        <div className="stack-list" style={{ marginTop: 12 }}>
          {detail.variables.map((variable) => (
            <article className="admin-variable-item" key={variable.id}>
              <div>
                <strong>{variable.label}</strong>
                <span>
                  {variable.dataPath} / {variable.sourceModel}
                </span>
              </div>
              <div className="status-stack">
                <StatusBadge tone={variable.required ? "warning" : "neutral"} label={variable.required ? "required" : "optional"} />
                {variable.ownerSpecific ? <StatusBadge tone="review" label="owner-specific" /> : null}
              </div>
            </article>
          ))}
        </div>
      </article>
      <article className="panel admin-preview-panel">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">Template Preview</p>
            <h3 className="panel-title">A4 초안 미리보기</h3>
            <p className="card-copy">미리보기와 missing variable 패널을 함께 보고 발행 가능 상태를 판단합니다.</p>
          </div>
        </div>
        <div className="admin-missing-panel">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Missing Fields</p>
              <h4 className="panel-title">누락 변수 점검</h4>
            </div>
            <StatusBadge tone={missingRequiredVariables.length > 0 ? "warning" : "success"} label={missingRequiredVariables.length > 0 ? `${missingRequiredVariables.length}건 누락` : "누락 없음"} />
          </div>
          <div className="stack-list">
            {missingRequiredVariables.length > 0 ? (
              missingRequiredVariables.map((item) => (
                <article className="admin-caution-item" key={item}>
                  <div>
                    <strong>{item}</strong>
                    <span>required 변수 매핑을 보완해야 publish 검토를 통과할 수 있습니다.</span>
                  </div>
                </article>
              ))
            ) : (
              <article className="admin-caution-item">
                <div>
                  <strong>required 변수 충족</strong>
                  <span>현재 샘플 기준 누락된 필수 변수는 없습니다.</span>
                </div>
              </article>
            )}
          </div>
        </div>
        <div className="admin-impact-grid">
          <div className="kv-card">
            <strong>validation</strong>
            <span>{currentVersion?.validationPassed ? "통과" : "대기"}</span>
          </div>
          <div className="kv-card">
            <strong>preview</strong>
            <span>{currentVersion?.previewPassed ? "통과" : "대기"}</span>
          </div>
        </div>
        <div className="document-preview-sheet admin-document-preview">
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{previewText}</pre>
        </div>
      </article>
    </section>
  );
}
