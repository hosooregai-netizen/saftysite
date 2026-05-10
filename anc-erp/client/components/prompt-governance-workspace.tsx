"use client";

import { useState, useTransition } from "react";

import type { PromptDetailResponse } from "../../packages/contracts/src";
import {
  createAdminPromptTestCaseAction,
  createAdminPromptVersionAction,
  publishAdminPromptVersionAction,
  rollbackAdminPromptVersionAction,
  runAdminPromptTestCasesAction,
  runAdminPromptVersionAction,
} from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

export function PromptGovernanceWorkspace({ detail }: { detail: PromptDetailResponse }) {
  const [message, setMessage] = useState("프롬프트 거버넌스");
  const [runOutput, setRunOutput] = useState(detail.runLogs[0]?.outputText ?? "");
  const [isPending, startTransition] = useTransition();
  const currentVersion = detail.currentVersion ?? detail.versions[0];
  const latestRun = detail.runLogs[0];
  const publishBlocked = !currentVersion?.lastTestRunAt || detail.testCases.length === 0;

  return (
    <section className="admin-governance-layout">
      <article className="panel admin-sticky-panel">
        <div className="admin-sticky-head">
          <div>
            <p className="card-eyebrow">Prompt Governance</p>
            <h3 className="panel-title">{detail.prompt.name}</h3>
            <p className="card-copy">service_ai 프롬프트는 schema, guardrail, test case 실행 결과를 갖춘 뒤에만 publish합니다.</p>
          </div>
          <div className="status-stack">
            <StatusBadge tone={publishBlocked ? "warning" : "success"} label={publishBlocked ? "publish blocked" : "publish ready"} />
            <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
          </div>
        </div>
        <div className="admin-filter-row">
          <span className="switcher">{detail.prompt.promptType}</span>
          <span className="switcher">{detail.prompt.featureId}</span>
          <span className="switcher">v{currentVersion?.versionNo ?? "-"}</span>
        </div>
        <div className={`admin-warning-strip ${publishBlocked ? "caution" : "published"}`}>
          {publishBlocked
            ? "테스트 케이스 또는 최근 실행 이력이 부족합니다. publish 전 run/run-test-cases를 먼저 통과시켜야 합니다."
            : "최근 테스트 실행 이력이 있습니다. schema, forbidden behavior, output preview를 확인한 뒤 publish합니다."}
        </div>
        <div className="key-value-grid">
          <div className="kv-card">
            <strong>promptKey</strong>
            <span>{detail.prompt.promptKey}</span>
          </div>
          <div className="kv-card">
            <strong>currentVersion</strong>
            <span>v{currentVersion?.versionNo ?? "-"}</span>
          </div>
          <div className="kv-card">
            <strong>testCases</strong>
            <span>{detail.testCases.length}개</span>
          </div>
          <div className="kv-card">
            <strong>runLogs</strong>
            <span>{detail.runLogs.length}건</span>
          </div>
        </div>
        <div className="utility-row" style={{ justifyContent: "flex-start", marginTop: 16 }}>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  await createAdminPromptVersionAction(detail.prompt.id, {
                    systemMessage: currentVersion.systemMessage,
                    userMessageTemplate: currentVersion.userMessageTemplate,
                    inputSchema: currentVersion.inputSchema,
                    outputSchema: currentVersion.outputSchema,
                    guardrails: currentVersion.guardrails,
                    forbiddenBehaviors: currentVersion.forbiddenBehaviors,
                  });
                  setMessage("POST /prompts/:id/versions");
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
                  const response = await runAdminPromptVersionAction(currentVersion.id, {
                    inputFixture: { promptId: detail.prompt.id },
                  });
                  setRunOutput(response.runLog.outputText);
                  setMessage("POST /run");
                } catch {
                  setMessage("프롬프트 실행 대기");
                }
              })
            }
            type="button"
          >
            단일 실행
          </button>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  await runAdminPromptTestCasesAction(currentVersion.id);
                  setMessage("POST /run-test-cases");
                } catch {
                  setMessage("테스트 실행 대기");
                }
              })
            }
            type="button"
          >
            테스트 케이스 실행
          </button>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                try {
                  await createAdminPromptTestCaseAction(detail.prompt.id, {
                    name: "초안 케이스",
                    inputFixture: { promptId: detail.prompt.id },
                    expectedContains: ["draft"],
                    expectedMissing: [],
                  });
                  setMessage("POST /test-cases");
                } catch {
                  setMessage("테스트 케이스 생성 대기");
                }
              })
            }
            type="button"
          >
            테스트 케이스 추가
          </button>
          <button
            className="inline-link button-reset"
            onClick={() =>
              startTransition(async () => {
                if (!currentVersion) return;
                try {
                  await publishAdminPromptVersionAction(currentVersion.id, { reason: "검증 완료" });
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
                  await rollbackAdminPromptVersionAction(currentVersion.id, { reason: "운영 rollback" });
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
            <p className="card-eyebrow">Prompt Contract</p>
            <h3 className="panel-title">버전 / Schema / Guardrail</h3>
            <p className="card-copy">현재 버전 계약과 테스트 케이스를 같이 보면서 release checklist를 빠르게 검토합니다.</p>
          </div>
        </div>
        <div className="admin-impact-grid">
          <div className="kv-card">
            <strong>last test run</strong>
            <span>{currentVersion?.lastTestRunAt ?? "미실행"}</span>
          </div>
          <div className="kv-card">
            <strong>test cases</strong>
            <span>{detail.testCases.length}개</span>
          </div>
        </div>
        <div className="stack-list">
          <article className="admin-variable-item">
            <div>
              <strong>inputSchema</strong>
              <span>{JSON.stringify(currentVersion?.inputSchema ?? {}, null, 2)}</span>
            </div>
          </article>
          <article className="admin-variable-item">
            <div>
              <strong>outputSchema</strong>
              <span>{JSON.stringify(currentVersion?.outputSchema ?? {}, null, 2)}</span>
            </div>
          </article>
          <article className="admin-variable-item">
            <div>
              <strong>guardrails</strong>
              <span>{(currentVersion?.guardrails ?? []).join(", ")}</span>
            </div>
          </article>
          <article className="admin-variable-item">
            <div>
              <strong>forbiddenBehaviors</strong>
              <span>{(currentVersion?.forbiddenBehaviors ?? []).join(", ")}</span>
            </div>
          </article>
        </div>
        <div className="stack-list" style={{ marginTop: 12 }}>
          {detail.testCases.map((testCase) => (
            <article className="admin-tree-item" key={testCase.id}>
              <div>
                <strong>{testCase.name}</strong>
                <span>expectedContains {testCase.expectedContains.join(", ") || "없음"}</span>
              </div>
              <StatusBadge tone="info" label="test case" />
            </article>
          ))}
        </div>
      </article>
      <article className="panel admin-preview-panel">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">Prompt Run Console</p>
            <h3 className="panel-title">실행 결과</h3>
            <p className="card-copy">실행 결과 JSON과 publish checklist를 함께 보면서 운영 반영 가능 상태를 확인합니다.</p>
          </div>
        </div>
        <div className="admin-missing-panel">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Release Checklist</p>
              <h4 className="panel-title">발행 전 점검</h4>
            </div>
            <StatusBadge tone={publishBlocked ? "warning" : "success"} label={publishBlocked ? "점검 필요" : "발행 가능"} />
          </div>
          <div className="stack-list">
            <article className="admin-caution-item">
              <div>
                <strong>schema valid</strong>
                <span>{latestRun?.schemaValid ? "최근 실행이 schema를 통과했습니다." : "schema 검증 이력이 필요합니다."}</span>
              </div>
            </article>
            <article className="admin-caution-item">
              <div>
                <strong>forbidden behavior</strong>
                <span>{latestRun?.forbiddenBehaviorHits.length ? latestRun.forbiddenBehaviorHits.join(", ") : "감지된 금지 동작이 없습니다."}</span>
              </div>
            </article>
          </div>
        </div>
        <div className="document-preview-sheet admin-document-preview">
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{runOutput || "아직 실행 결과가 없습니다."}</pre>
        </div>
      </article>
    </section>
  );
}
