"use client";

import { useState } from "react";

import type { MissingField, ReviewWarning, SafetyHealthLedgerSection, SourceLink } from "../../packages/contracts/src";
import { LedgerA4Preview } from "./ledger-a4-preview";
import { LedgerMissingFieldPanel } from "./ledger-missing-field-panel";
import { LedgerReviewWarningPanel } from "./ledger-review-warning-panel";
import { LedgerStatusBadge } from "./ledger-status-badge";
import { LedgerSectionEditor } from "./ledger-section-editor";
import { LedgerSectionNavigator } from "./ledger-section-navigator";
import { LedgerSourceLinkPanel } from "./ledger-source-link-panel";
import { LedgerSyncPreviewModal } from "./ledger-sync-preview-modal";
import { regenerateSafetyHealthLedgerSectionDraft, saveSafetyHealthLedgerSectionDraft } from "../lib/safety-health-ledger-actions";

export function SafetyHealthLedgerEditWorkspace({
  ledgerId,
  detail,
}: {
  ledgerId: string;
  detail: {
    sections: SafetyHealthLedgerSection[];
    sourceLinks: SourceLink[];
    previewDetail: any;
    missingFields: MissingField[];
    warnings: ReviewWarning[];
    meta: {
      projectName?: string | null;
      sourcePlanId?: string | null;
    };
  };
}) {
  const [activeKey, setActiveKey] = useState(detail.sections[0]?.key ?? "basic_info");
  const [draftSections, setDraftSections] = useState(detail.sections);
  const [message, setMessage] = useState<string | null>(null);
  const activeSection = draftSections.find((item) => item.key === activeKey) ?? draftSections[0];

  if (!activeSection) {
    return null;
  }

  function updateActiveSectionContent(content: SafetyHealthLedgerSection["content"]) {
    setDraftSections((current) =>
      current.map((item) => (item.key === activeKey ? { ...item, content } : item)),
    );
  }

  async function handleSave() {
    await saveSafetyHealthLedgerSectionDraft(ledgerId, activeSection.key, {
      sectionKey: activeSection.key,
      content: activeSection.content,
      status: "edited",
    });
    setMessage("POST /sections/{sectionKey}/save");
  }

  async function handleRegenerate() {
    await regenerateSafetyHealthLedgerSectionDraft(ledgerId, activeSection.key);
    setMessage("POST /sections/{sectionKey}/regenerate");
  }

  return (
    <div className="report-workspace-layout">
      <div className="report-side-stack">
        <LedgerSectionNavigator sections={draftSections} activeKey={activeKey} onChange={(key) => setActiveKey(key as SafetyHealthLedgerSection["key"])} />
        <LedgerSourceLinkPanel links={detail.sourceLinks.filter((item) => item.sectionKey === activeKey)} />
      </div>
      <div className="report-center-stack">
        <section className="panel ledger-edit-header">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Ledger Edit Workspace</p>
              <h3 className="panel-title">{detail.meta.projectName ?? "프로젝트 누적 대장"}</h3>
              <p className="card-copy">
                회차별 문서가 아니라 프로젝트 장기 누적 원장을 보정하는 화면입니다. 계획 데이터와 실행 데이터를 함께 검토하세요.
              </p>
            </div>
            <div className="status-stack">
              <LedgerStatusBadge label={activeSection.status} />
              <span className="pill outline">{detail.meta.sourcePlanId ? "계획 연결됨" : "계획 연결 대기"}</span>
            </div>
          </div>
          <div className="hero-summary-grid ledger-edit-summary">
            <article className="hero-summary-card"><span>현재 섹션</span><strong>{activeSection.title}</strong></article>
            <article className="hero-summary-card"><span>누락정보</span><strong>{detail.missingFields.length}건</strong></article>
            <article className="hero-summary-card"><span>검토 경고</span><strong>{detail.warnings.length}건</strong></article>
            <article className="hero-summary-card"><span>원본 링크</span><strong>{detail.sourceLinks.filter((item) => item.sectionKey === activeKey).length}건</strong></article>
          </div>
        </section>
        <LedgerSectionEditor onChange={updateActiveSectionContent} section={activeSection} />
        <section className="panel report-actions-panel">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Ledger Actions</p>
              <h3 className="panel-title">편집 액션</h3>
            </div>
          </div>
          <div className="inline-actions">
            <button className="primary-button" onClick={handleSave} type="button">저장</button>
            <button className="secondary-button" onClick={handleRegenerate} type="button">재생성</button>
          </div>
          {message ? <p className="form-helper">{message}</p> : null}
        </section>
      </div>
      <div className="report-side-stack">
        <LedgerReviewWarningPanel warnings={detail.warnings} />
        <LedgerMissingFieldPanel items={detail.missingFields} />
        <LedgerSyncPreviewModal ledgerId={ledgerId} target="inspection" />
        <LedgerA4Preview detail={detail.previewDetail} />
      </div>
    </div>
  );
}
