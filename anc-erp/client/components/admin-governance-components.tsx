"use client";

import { useState, useTransition } from "react";

import type {
  AdminAuditLog,
  ApprovalTemplateDetailResponse,
  ChecklistItem,
  CompanyProfile,
  DocumentTemplateDetailResponse,
  LegalClause,
  Permission,
  Phrase,
  PromptDetailResponse,
  PromptRunLog,
  PromptTestCase,
  Role,
  SignatureAsset,
  TemplateCondition,
  TemplateLoop,
  TemplateVariable,
} from "../../packages/contracts/src";
import {
  createAdminRoleAction,
  publishAdminPromptVersionAction,
  rollbackAdminTemplateVersionAction,
  rollbackAdminPromptVersionAction,
  runAdminPromptVersionAction,
  updateAdminPromptAction,
  uploadAdminLogoAction,
  uploadAdminSealAction,
} from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

export function AdminRecentActivity({ logs }: { logs: AdminAuditLog[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">AdminRecentActivity</p>
          <h3 className="panel-title">최근 운영 활동</h3>
        </div>
      </div>
      <div className="stack-list">
        {logs.map((log) => (
          <article className="ops-item" key={log.id}>
            <div>
              <strong>{log.targetName}</strong>
              <span>{log.reason}</span>
            </div>
            <StatusBadge tone="review" label={log.action} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminWarningList({
  warnings,
}: {
  warnings: Array<{ code: string; message: string; severity: string }>;
}) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">AdminWarningList</p>
          <h3 className="panel-title">운영 경고</h3>
        </div>
      </div>
      <div className="stack-list">
        {warnings.map((warning) => (
          <article className="admin-caution-item" key={warning.code}>
            <div>
              <strong>{warning.code}</strong>
              <span>{warning.message}</span>
            </div>
            <StatusBadge tone={warning.severity === "danger" ? "danger" : "warning"} label={warning.severity} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function UserRoleSelector({ roleIds, roles }: { roleIds: string[]; roles: Role[] }) {
  const labels = roles.filter((role) => roleIds.includes(role.id)).map((role) => role.name);
  return (
    <div className="hero-badges">
      {labels.length > 0 ? labels.map((label) => <span className="pill outline" key={label}>{label}</span>) : <span className="table-subtext">역할 미지정</span>}
    </div>
  );
}

export function UserStatusBadge({ status }: { status: string }) {
  const tone = status === "active" ? "success" : status === "invited" ? "review" : "warning";
  return <StatusBadge tone={tone} label={status} />;
}

export function RoleForm() {
  const [message, setMessage] = useState("role draft");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">RoleForm</p>
          <h3 className="panel-title">역할 초안 생성</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <button
        className="inline-link button-reset"
        onClick={() =>
          startTransition(async () => {
            try {
              await createAdminRoleAction({
                key: "review_operator",
                name: "검토 운영자",
                description: "템플릿과 프롬프트 검토 전용 역할",
              });
              setMessage("POST /api/v1/admin/roles");
            } catch {
              setMessage("역할 생성 대기");
            }
          })
        }
        type="button"
      >
        검토 역할 생성
      </button>
    </section>
  );
}

export function PermissionGroupTabs({ permissions }: { permissions: Permission[] }) {
  const groupKeys = [...new Set(permissions.map((permission) => permission.groupKey))];
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PermissionGroupTabs</p>
          <h3 className="panel-title">권한 그룹</h3>
        </div>
      </div>
      <div className="hero-badges">
        {groupKeys.map((groupKey) => (
          <span className="pill outline" key={groupKey}>{groupKey}</span>
        ))}
      </div>
    </section>
  );
}

function AssetUploadButton({
  title,
  action,
}: {
  title: string;
  action: () => Promise<unknown>;
}) {
  const [message, setMessage] = useState("업로드 대기");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">{title}</p>
          <h3 className="panel-title">{title}</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <button
        className="inline-link button-reset"
        onClick={() =>
          startTransition(async () => {
            try {
              await action();
              setMessage("업로드 API 연결됨");
            } catch {
              setMessage("업로드 대기");
            }
          })
        }
        type="button"
      >
        업로드 실행
      </button>
    </section>
  );
}

export function LogoUploader({ companyProfile }: { companyProfile: CompanyProfile }) {
  return (
    <AssetUploadButton
      title={`LogoUploader${companyProfile.logoFileId ? ` · ${companyProfile.logoFileId}` : ""}`}
      action={() => uploadAdminLogoAction({ fileName: `${companyProfile.id}-logo.png`, fileType: "image/png" })}
    />
  );
}

export function SealUploader({ companyProfile }: { companyProfile: CompanyProfile }) {
  return (
    <AssetUploadButton
      title={`SealUploader${companyProfile.sealFileId ? ` · ${companyProfile.sealFileId}` : ""}`}
      action={() => uploadAdminSealAction({ fileName: `${companyProfile.id}-seal.png`, fileType: "image/png" })}
    />
  );
}

export function TemplateTypeBadge({ documentType }: { documentType: string }) {
  return <StatusBadge tone="info" label={documentType} />;
}

export function TemplateStatusBadge({ status }: { status: string }) {
  const tone = status === "published" ? "success" : status === "review" ? "warning" : "review";
  return <StatusBadge tone={tone} label={status} />;
}

export function TemplateSectionTree({ sections }: { sections: DocumentTemplateDetailResponse["sections"] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">TemplateSectionTree</p>
          <h3 className="panel-title">섹션 트리</h3>
        </div>
      </div>
      <div className="admin-tree-list">
        {sections.map((section) => (
          <article className="admin-tree-item" key={section.id}>
            <div>
              <strong>{section.title}</strong>
              <span>{section.key}</span>
            </div>
            <span className="table-subtext">{section.displayOrder}번째</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TemplateSectionEditor({ sections }: { sections: DocumentTemplateDetailResponse["sections"] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">TemplateSectionEditor</p>
          <h3 className="panel-title">섹션 본문 검토</h3>
        </div>
      </div>
      <div className="stack-list">
        {sections.map((section) => (
          <article className="admin-variable-item" key={section.id}>
            <div>
              <strong>{section.title}</strong>
              <span>{section.body}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TemplatePreviewPane({ previewText }: { previewText: string }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">TemplatePreviewPane</p>
          <h3 className="panel-title">A4 미리보기</h3>
        </div>
      </div>
      <div className="document-preview-sheet admin-document-preview">
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{previewText}</pre>
      </div>
    </section>
  );
}

export function TemplateVariableTable({ variables }: { variables: TemplateVariable[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">TemplateVariableTable</p>
          <h3 className="panel-title">변수 표</h3>
        </div>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>변수</span>
          <span>source</span>
          <span>규칙</span>
        </div>
        {variables.map((variable) => (
          <div className="table-row" key={variable.id}>
            <span className="approval-table-document">
              <strong>{variable.label}</strong>
              <small>{variable.variableKey}</small>
            </span>
            <span>{variable.sourceModel} / {variable.dataPath}</span>
            <span>{variable.required ? "required" : "optional"} / {variable.ownerSpecific ? "owner" : "shared"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MappingList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; label: string; subtitle: string }>;
}) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">{title}</p>
          <h3 className="panel-title">{title}</h3>
        </div>
      </div>
      <div className="stack-list">
        {items.length > 0 ? (
          items.map((item) => (
            <article className="ops-item" key={item.id}>
              <div>
                <strong>{item.label}</strong>
                <span>{item.subtitle}</span>
              </div>
            </article>
          ))
        ) : (
          <article className="ops-item">
            <div>
              <strong>설정 없음</strong>
              <span>현재 연결된 항목이 없습니다.</span>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

export function TemplateLoopEditor({ loops }: { loops: TemplateLoop[] }) {
  return (
    <MappingList
      title="TemplateLoopEditor"
      items={loops.map((loop) => ({
        id: loop.id,
        label: loop.loopKey,
        subtitle: `${loop.dataPath} as ${loop.alias}`,
      }))}
    />
  );
}

export function TemplateConditionBuilder({ conditions }: { conditions: TemplateCondition[] }) {
  return (
    <MappingList
      title="TemplateConditionBuilder"
      items={conditions.map((condition) => ({
        id: condition.id,
        label: condition.conditionKey,
        subtitle: condition.expression,
      }))}
    />
  );
}

export function VersionDiffViewer({
  currentVersionId,
  versions,
}: {
  currentVersionId?: string | null;
  versions: Array<{ id: string; versionNo: number; status: string; updatedAt: string }>;
}) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">VersionDiffViewer</p>
          <h3 className="panel-title">버전 이력</h3>
        </div>
      </div>
      <div className="stack-list">
        {versions.map((version) => (
          <article className="ops-item" key={version.id}>
            <div>
              <strong>v{version.versionNo}</strong>
              <span>{version.updatedAt}</span>
            </div>
            <StatusBadge tone={version.id === currentVersionId ? "success" : "review"} label={version.status} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function RollbackButton({
  versionId,
  kind = "template",
}: {
  versionId?: string | null;
  kind?: "template" | "prompt";
}) {
  const [message, setMessage] = useState("rollback 대기");
  const [isPending, startTransition] = useTransition();

  if (!versionId) return null;

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">RollbackButton</p>
          <h3 className="panel-title">롤백</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <button
        className="inline-link button-reset"
        onClick={() =>
          startTransition(async () => {
            try {
              if (kind === "prompt") {
                await rollbackAdminPromptVersionAction(versionId, { reason: "관리자 롤백" });
              } else {
                await rollbackAdminTemplateVersionAction(versionId, { reason: "관리자 롤백" });
              }
              setMessage(
                kind === "prompt"
                  ? "POST /api/v1/admin/prompt-versions/:id/rollback"
                  : "POST /api/v1/admin/template-versions/:id/rollback",
              );
            } catch {
              setMessage("롤백 대기");
            }
          })
        }
        type="button"
      >
        이전 운영본으로 롤백
      </button>
    </section>
  );
}

export function PublishChecklist({
  blockedItems,
  readyLabel = "발행 가능",
}: {
  blockedItems: string[];
  readyLabel?: string;
}) {
  const blocked = blockedItems.length > 0;
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PublishChecklist</p>
          <h3 className="panel-title">발행 체크리스트</h3>
        </div>
        <StatusBadge tone={blocked ? "warning" : "success"} label={blocked ? `${blockedItems.length}건 보완 필요` : readyLabel} />
      </div>
      <div className="stack-list">
        {blocked ? blockedItems.map((item) => (
          <article className="admin-caution-item" key={item}>
            <div>
              <strong>{item}</strong>
              <span>발행 전에 먼저 보완해야 합니다.</span>
            </div>
          </article>
        )) : (
          <article className="admin-caution-item">
            <div>
              <strong>차단 항목 없음</strong>
              <span>현재 기준 즉시 발행 가능한 상태입니다.</span>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

export function ReportMappingEditor({ items }: { items: ChecklistItem[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ReportMappingEditor</p>
          <h3 className="panel-title">보고서 매핑 검토</h3>
        </div>
      </div>
      <div className="stack-list">
        {items.map((item) => (
          <article className="ops-item" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.reportLabel ?? "report label 없음"} / {item.sourceSectionKey ?? "section 미매핑"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PhraseEditor({ phrase }: { phrase: Phrase }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PhraseEditor</p>
          <h3 className="panel-title">{phrase.title}</h3>
        </div>
        <StatusBadge tone="review" label={phrase.status} />
      </div>
      <p>{phrase.body}</p>
    </section>
  );
}

export function UsageTemplateList({ phrases }: { phrases: Phrase[] }) {
  return (
    <MappingList
      title="UsageTemplateList"
      items={phrases.map((phrase) => ({
        id: phrase.id,
        label: phrase.title,
        subtitle: phrase.tags.join(", ") || "tag 없음",
      }))}
    />
  );
}

export function LegalClauseApprovalPanel({ clause }: { clause: LegalClause }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LegalClauseApprovalPanel</p>
          <h3 className="panel-title">법령 승인 상태</h3>
        </div>
        <StatusBadge tone={clause.status === "published" ? "success" : "warning"} label={clause.status} />
      </div>
      <div className="stack-list">
        <article className="ops-item">
          <div>
            <strong>changeReason</strong>
            <span>{clause.changeReason ?? "사유 없음"}</span>
          </div>
        </article>
        <article className="ops-item">
          <div>
            <strong>approvedBy</strong>
            <span>{clause.approvedBy ?? "미승인"}</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export function ImpactPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <MappingList
      title="ImpactPanel"
      items={items.map((item, index) => ({
        id: `${title}-${index}`,
        label: title,
        subtitle: item,
      }))}
    />
  );
}

export function PromptTypeBadge({ promptType }: { promptType: string }) {
  return <StatusBadge tone="info" label={promptType} />;
}

export function PromptStatusBadge({ status }: { status: string }) {
  const tone = status === "published" ? "success" : status === "review" ? "warning" : "review";
  return <StatusBadge tone={tone} label={status} />;
}

export function PromptMessageEditor({ detail }: { detail: PromptDetailResponse }) {
  const currentVersion = detail.currentVersion ?? detail.versions[0];
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PromptMessageEditor</p>
          <h3 className="panel-title">메시지 템플릿</h3>
        </div>
      </div>
      <div className="stack-list">
        <article className="admin-variable-item">
          <div>
            <strong>systemMessage</strong>
            <span>{currentVersion?.systemMessage ?? "없음"}</span>
          </div>
        </article>
        <article className="admin-variable-item">
          <div>
            <strong>userMessageTemplate</strong>
            <span>{currentVersion?.userMessageTemplate ?? "없음"}</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export function PromptSchemaEditor({ detail }: { detail: PromptDetailResponse }) {
  const currentVersion = detail.currentVersion ?? detail.versions[0];
  return (
    <MappingList
      title="PromptSchemaEditor"
      items={[
        {
          id: "input-schema",
          label: "inputSchema",
          subtitle: JSON.stringify(currentVersion?.inputSchema ?? {}, null, 2),
        },
        {
          id: "output-schema",
          label: "outputSchema",
          subtitle: JSON.stringify(currentVersion?.outputSchema ?? {}, null, 2),
        },
      ]}
    />
  );
}

export function PromptGuardrailEditor({ detail }: { detail: PromptDetailResponse }) {
  const currentVersion = detail.currentVersion ?? detail.versions[0];
  return (
    <MappingList
      title="PromptGuardrailEditor"
      items={[
        ...((currentVersion?.guardrails ?? []).map((item, index) => ({
          id: `guardrail-${index}`,
          label: "guardrail",
          subtitle: item,
        }))),
        ...((currentVersion?.forbiddenBehaviors ?? []).map((item, index) => ({
          id: `forbidden-${index}`,
          label: "forbidden",
          subtitle: item,
        }))),
      ]}
    />
  );
}

export function PromptTestCaseTable({ testCases }: { testCases: PromptTestCase[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PromptTestCaseTable</p>
          <h3 className="panel-title">테스트 케이스</h3>
        </div>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>케이스</span>
          <span>expectedContains</span>
          <span>expectedMissing</span>
        </div>
        {testCases.map((testCase) => (
          <div className="table-row" key={testCase.id}>
            <span className="approval-table-document">
              <strong>{testCase.name}</strong>
              <small>{JSON.stringify(testCase.inputFixture)}</small>
            </span>
            <span>{testCase.expectedContains.join(", ") || "없음"}</span>
            <span>{testCase.expectedMissing.join(", ") || "없음"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PromptExpectedCheckEditor({ testCases }: { testCases: PromptTestCase[] }) {
  return (
    <MappingList
      title="PromptExpectedCheckEditor"
      items={testCases.map((testCase) => ({
        id: testCase.id,
        label: testCase.name,
        subtitle: `contains: ${testCase.expectedContains.join(", ") || "없음"} / missing: ${testCase.expectedMissing.join(", ") || "없음"}`,
      }))}
    />
  );
}

export function PromptRunConsole({
  detail,
  initialOutput,
}: {
  detail: PromptDetailResponse;
  initialOutput?: string;
}) {
  const currentVersion = detail.currentVersion ?? detail.versions[0];
  const [message, setMessage] = useState("실행 대기");
  const [output, setOutput] = useState(initialOutput ?? detail.runLogs[0]?.outputText ?? "");
  const [isPending, startTransition] = useTransition();

  if (!currentVersion) return null;

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PromptRunConsole</p>
          <h3 className="panel-title">실행 콘솔</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <button
        className="inline-link button-reset"
        onClick={() =>
          startTransition(async () => {
            try {
              const response = await runAdminPromptVersionAction(currentVersion.id, {
                inputFixture: { promptId: detail.prompt.id },
              });
              setOutput(response.runLog.outputText);
              setMessage("POST /api/v1/admin/prompt-versions/:id/run");
            } catch {
              setMessage("실행 대기");
            }
          })
        }
        type="button"
      >
        프롬프트 실행
      </button>
      <div className="document-preview-sheet admin-document-preview" style={{ marginTop: 16 }}>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{output || "실행 결과 없음"}</pre>
      </div>
    </section>
  );
}

export function PromptRunResultPanel({ runLogs }: { runLogs: PromptRunLog[] }) {
  const latestRun = runLogs[0];
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PromptRunResultPanel</p>
          <h3 className="panel-title">최근 실행 결과</h3>
        </div>
        <StatusBadge tone={latestRun?.passed ? "success" : "warning"} label={latestRun?.passed ? "passed" : "review"} />
      </div>
      <div className="stack-list">
        <article className="ops-item">
          <div>
            <strong>schemaValid</strong>
            <span>{latestRun?.schemaValid ? "true" : "false"}</span>
          </div>
        </article>
        <article className="ops-item">
          <div>
            <strong>forbiddenBehaviorHits</strong>
            <span>{latestRun?.forbiddenBehaviorHits.join(", ") || "없음"}</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export function SubmissionDetailCard({ detail }: { detail: ApprovalTemplateDetailResponse | SignatureAsset }) {
  const label = "template" in detail ? detail.template.name : detail.label;
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SubmissionDetailCard</p>
          <h3 className="panel-title">{label}</h3>
        </div>
      </div>
    </section>
  );
}

export function PromptReleaseAction({
  versionId,
}: {
  versionId?: string | null;
}) {
  const [message, setMessage] = useState("발행 대기");
  const [isPending, startTransition] = useTransition();
  if (!versionId) return null;
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PromptReleaseAction</p>
          <h3 className="panel-title">프롬프트 발행</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <button
        className="inline-link button-reset"
        onClick={() =>
          startTransition(async () => {
            try {
              await publishAdminPromptVersionAction(versionId, { reason: "운영 반영" });
              setMessage("POST /api/v1/admin/prompt-versions/:id/publish");
            } catch {
              setMessage("발행 대기");
            }
          })
        }
        type="button"
      >
        현재 버전 발행
      </button>
    </section>
  );
}

export function PromptMetadataEditor({ detail }: { detail: PromptDetailResponse }) {
  const [name, setName] = useState(detail.prompt.name);
  const [message, setMessage] = useState("prompt metadata");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PromptMetadataEditor</p>
          <h3 className="panel-title">프롬프트 기본 정보</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <label className="field">
        <span className="field-label">이름</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button
        className="inline-link button-reset"
        onClick={() =>
          startTransition(async () => {
            try {
              await updateAdminPromptAction(detail.prompt.id, { name });
              setMessage("PATCH /api/v1/admin/prompts/:id");
            } catch {
              setMessage("저장 대기");
            }
          })
        }
        type="button"
      >
        기본 정보 저장
      </button>
    </section>
  );
}
