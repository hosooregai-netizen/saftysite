"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import type {
  AlertRule,
  DashboardAlert,
  DashboardInsightRun,
  DashboardMetric,
  DashboardWidget,
  FindingAgingBucket,
  InspectionRound,
  InspectionTask,
  OwnerReportStatusSummary,
  Project,
  ProjectHealthMetric,
  StatisticsMetric,
} from "../../packages/contracts/src";
import {
  acknowledgeDashboardAlertAction,
  createDashboardAlertRuleAction,
  createDashboardProjectRiskInsightAction,
  createDashboardInsightSummaryAction,
  createDashboardWeeklyBriefingAction,
  createDashboardWidgetAction,
  dismissDashboardAlertAction,
  refreshDashboardAlertsAction,
  reorderDashboardWidgetsAction,
  updateDashboardAlertRuleAction,
} from "../lib/dashboard-actions";
import { ErpShell } from "./erp-shell";
import { StatusBadge } from "./status-badge";

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return <ErpShell title={title} subtitle={subtitle}>{children}</ErpShell>;
}

function metricTone(status?: string): "neutral" | "review" | "warning" | "info" | "success" | "danger" | "submitted" {
  switch (status) {
    case "danger":
    case "critical":
      return "danger";
    case "warning":
    case "watch":
      return "warning";
    case "success":
    case "normal":
    case "healthy":
      return "success";
    case "review":
    case "pending":
      return "review";
    case "submitted":
      return "submitted";
    case "info":
      return "info";
    default:
      return "neutral";
  }
}

export function DashboardWidgetCard({ widget }: { widget: DashboardWidget }) {
  return (
    <article className="ops-item dashboard-widget-item dashboard-signal-card">
      <div className="dashboard-widget-main dashboard-widget-head">
        <div>
          <p className="card-eyebrow dashboard-inline-eyebrow">{widget.widgetType}</p>
          <strong>{widget.title}</strong>
          <span>관련 route와 연결된 읽기 전용 관제 위젯</span>
        </div>
        <div className="hero-badges">
          <span className="pill outline">#{widget.displayOrder}</span>
          <StatusBadge tone={widget.enabled ? "success" : "warning"} label={widget.enabled ? "enabled" : "disabled"} />
        </div>
      </div>
      <div className="dashboard-kpi-inline">
        <article className="dashboard-mini-kpi">
          <span>scope</span>
          <strong>{widget.scope}</strong>
        </article>
        <article className="dashboard-mini-kpi">
          <span>route</span>
          <strong>{widget.route}</strong>
        </article>
      </div>
      <p className="helper-text">관련 route에서 원본 업무를 처리하고, dashboard에서는 상태와 경고만 추적합니다.</p>
      <div className="dashboard-widget-footer">
        <div className="hero-badges">
          {widget.projectId ? <span className="pill subtle">{widget.projectId}</span> : null}
        </div>
        <div className="hero-badges">
          <Link className="inline-link" href={widget.route}>
            열기
          </Link>
        </div>
      </div>
    </article>
  );
}

export function DashboardWidgetGrid({ widgets }: { widgets: DashboardWidget[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">DashboardWidgetGrid</p>
          <h3 className="panel-title">위젯 구성</h3>
          <p className="table-subtext">오늘 우선 확인할 KPI와 경고를 한 줄에서 재배치할 수 있습니다.</p>
        </div>
      </div>
      <div className="ops-card-list dashboard-widget-grid">
        {widgets.map((widget) => (
          <DashboardWidgetCard key={widget.id} widget={widget} />
        ))}
      </div>
    </section>
  );
}

export function TodayInspectionCard({ rounds }: { rounds: InspectionRound[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">TodayInspectionCard</p>
          <h3 className="panel-title">오늘 점검</h3>
          <p className="table-subtext">오늘 바로 움직여야 하는 점검 회차를 먼저 보여줍니다.</p>
        </div>
        <StatusBadge tone="info" label={`${rounds.length}건`} />
      </div>
      <div className="stack-list dashboard-card-list">
        {rounds.length > 0 ? rounds.map((round) => (
          <article className="ops-item dashboard-queue-item" key={round.id}>
            <div>
              <strong>{round.name}</strong>
              <span>{round.plannedDate ?? round.actualInspectionDate ?? "일정 미입력"}</span>
            </div>
            <div className="hero-badges">
              {round.roundNo ? <span className="pill subtle">{round.roundNo}회차</span> : null}
              <StatusBadge tone="review" label={round.status} />
            </div>
          </article>
        )) : <p className="table-subtext dashboard-empty-state">오늘 예정된 점검이 없습니다.</p>}
      </div>
    </section>
  );
}

export function UpcomingInspectionList({ rounds }: { rounds: InspectionRound[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">UpcomingInspectionList</p>
          <h3 className="panel-title">다가오는 점검</h3>
          <p className="table-subtext">plannedDate와 documentNo를 같이 보고 준비 항목을 점검합니다.</p>
        </div>
      </div>
      <div className="stack-list dashboard-card-list">
        {rounds.map((round) => (
          <article className="ops-item dashboard-queue-item" key={round.id}>
            <div>
              <strong>{round.name}</strong>
              <span>{round.plannedMonth ?? round.plannedDate ?? "예정월 미정"}</span>
            </div>
            <div className="hero-badges">
              {round.documentNo ? <span className="pill subtle">{round.documentNo}</span> : null}
              <StatusBadge tone="neutral" label={round.status} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MyTaskQueue({ tasks }: { tasks: InspectionTask[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">MyTaskQueue</p>
          <h3 className="panel-title">오늘 할 일</h3>
          <p className="table-subtext">내가 바로 처리해야 하는 inspection task를 우선순위 순으로 모아봅니다.</p>
        </div>
        <StatusBadge tone={tasks.length > 0 ? "warning" : "success"} label={`${tasks.length}건`} />
      </div>
      <div className="stack-list dashboard-card-list">
        {tasks.length > 0 ? tasks.map((task) => (
          <article className="ops-item dashboard-queue-item dashboard-signal-card" key={task.id}>
            <div>
              <strong>{task.title}</strong>
              <span>{task.dueDate ?? "기한 미입력"} · {task.taskType}</span>
            </div>
            <div className="hero-badges">
              {task.assigneeId ? <span className="pill subtle">{task.assigneeId}</span> : null}
              <StatusBadge tone={metricTone(task.status)} label={task.status} />
            </div>
          </article>
        )) : <p className="table-subtext dashboard-empty-state">오늘 바로 처리할 task가 없습니다.</p>}
      </div>
    </section>
  );
}

export function ReportDueCard({ items }: { items: OwnerReportStatusSummary[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ReportDueCard</p>
          <h3 className="panel-title">제출 지연 / 대기 보고서</h3>
          <p className="table-subtext">발주처, 회차, 기한을 한 줄에서 같이 확인합니다.</p>
        </div>
      </div>
      <div className="stack-list dashboard-card-list">
        {items.map((item) => (
          <article className="ops-item dashboard-queue-item dashboard-signal-card" key={item.id}>
            <div>
              <strong>{item.ownerDisplayName}</strong>
              <span>{item.dueDate ? `기한 ${item.dueDate}` : "기한 미입력"} · {item.inspectionRoundId}</span>
            </div>
            <div className="hero-badges">
              <span className="pill subtle">{item.ownerPartyId}</span>
              {item.documentId ? <span className="pill subtle">{item.documentId}</span> : null}
              <StatusBadge tone={metricTone(item.status)} label={item.status} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function OwnerReportStatusMatrix({ items }: { items: OwnerReportStatusSummary[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">OwnerReportStatusMatrix</p>
          <h3 className="panel-title">발주처별 제출 상태 매트릭스</h3>
          <p className="table-subtext">발주처 badge와 회차를 같이 보고 drafting부터 confirmed까지 단계를 추적합니다.</p>
        </div>
      </div>
      <div className="dashboard-matrix">
        <div className="dashboard-matrix-head">
          <span>발주처 / 회차</span>
          <span>초안</span>
          <span>검토</span>
          <span>최종본</span>
          <span>제출</span>
          <span>확인</span>
        </div>
        {items.map((item) => (
          <div className="dashboard-matrix-row" key={item.id}>
            <div className="dashboard-matrix-label">
              <strong>{item.ownerDisplayName}</strong>
              <p className="table-subtext">{item.inspectionRoundId}</p>
              <div className="hero-badges">
                <span className="pill subtle">{item.ownerPartyId}</span>
                {item.dueDate ? <span className="pill subtle">기한 {item.dueDate}</span> : null}
              </div>
            </div>
            <span className={`matrix-dot ${item.status === "drafting" ? "active" : ""}`}>●</span>
            <span className={`matrix-dot ${item.status === "review" ? "active" : ""}`}>●</span>
            <span className={`matrix-dot ${item.status === "exported" ? "active" : ""}`}>●</span>
            <span className={`matrix-dot ${item.status === "submitted" ? "active submitted" : ""}`}>●</span>
            <span className={`matrix-dot ${item.status === "confirmed" ? "active success" : ""}`}>●</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OpenFindingCard({ count }: { count: number }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">OpenFindingCard</p>
          <h3 className="panel-title">미조치 지적사항</h3>
        </div>
      </div>
      <div className="hero-summary-grid dashboard-mini-stats">
        <article className="hero-summary-card dashboard-metric-card danger">
          <span>open</span>
          <strong>{count}건</strong>
          <small>Dashboard에서는 상태만 확인하고, 실제 조치/검증은 원본 모듈에서 처리합니다.</small>
        </article>
      </div>
    </section>
  );
}

export function FindingAgingChart({ buckets }: { buckets: FindingAgingBucket[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">FindingAgingChart</p>
          <h3 className="panel-title">지적사항 경과 분포</h3>
          <p className="table-subtext">closed/verified 제외 bucket 기준입니다.</p>
        </div>
      </div>
      <div className="hero-summary-grid dashboard-mini-stats">
        {buckets.map((bucket) => (
          <article className="hero-summary-card dashboard-metric-card" key={bucket.id}>
            <span>{bucket.label}</span>
            <strong>{bucket.count}건</strong>
            <small>{bucket.findingIds.length > 0 ? `linked ${bucket.findingIds.length}` : "연결된 지적사항 기준"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CorrectiveActionQueue({ items }: { items: Array<Record<string, unknown>> }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">CorrectiveActionQueue</p>
          <h3 className="panel-title">조치 대기 큐</h3>
          <p className="table-subtext">기한이 보이는 follow-up 항목을 우선 정렬합니다.</p>
        </div>
      </div>
      <div className="stack-list dashboard-card-list">
        {items.length > 0 ? items.map((item, index) => {
          const finding = item.finding as { title?: string; dueDate?: string } | undefined;
          return (
            <article className="ops-item dashboard-queue-item" key={String(finding?.title ?? index)}>
              <div>
                <strong>{finding?.title ?? "지적사항"}</strong>
                <span>{finding?.dueDate ?? "기한 미입력"}</span>
              </div>
              <div className="hero-badges">
                <span className="pill subtle">원본 이동</span>
                <StatusBadge tone="warning" label="follow-up" />
              </div>
            </article>
          );
        }) : <p className="table-subtext dashboard-empty-state">조치 대기 항목이 없습니다.</p>}
      </div>
    </section>
  );
}

export function SafetyCostUsageCard({ warnings }: { warnings: Array<Record<string, unknown>> }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostUsageCard</p>
          <h3 className="panel-title">산안비 경고</h3>
          <p className="table-subtext">증빙 누락, owner mismatch, 사용률 이상치를 분리해서 표시합니다.</p>
        </div>
        <StatusBadge tone={warnings.length > 0 ? "warning" : "success"} label={`${warnings.length}건`} />
      </div>
      <div className="stack-list dashboard-card-list">
        {warnings.length > 0 ? warnings.map((warning, index) => {
          const usage = warning.usage as { ownerPartyId?: string } | undefined;
          const issues = (warning.issues as string[] | undefined) ?? [];
          return (
            <article className="ops-item dashboard-queue-item dashboard-signal-card" key={`${usage?.ownerPartyId ?? "usage"}-${index}`}>
              <div>
                <strong>{usage?.ownerPartyId ?? "발주처"}</strong>
                <span>{issues.join(", ")}</span>
              </div>
              <div className="hero-badges">
                {issues.map((issue) => <span className="pill subtle" key={issue}>{issue}</span>)}
                <StatusBadge tone="warning" label="review" />
              </div>
            </article>
          );
        }) : <p className="table-subtext dashboard-empty-state">현재 감지된 산안비 경고가 없습니다.</p>}
      </div>
    </section>
  );
}

export function ApprovalQueueCard({ approvals }: { approvals: Array<Record<string, unknown>> }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ApprovalQueueCard</p>
          <h3 className="panel-title">결재 대기 큐</h3>
          <p className="table-subtext">required step 수와 현재 workflow 상태를 같이 확인합니다.</p>
        </div>
      </div>
      <div className="stack-list dashboard-card-list">
        {approvals.length > 0 ? approvals.map((approval, index) => {
          const workflow = approval.workflow as { title?: string; status?: string } | undefined;
          const pendingRequiredCount = approval.pendingRequiredCount as number | undefined;
          return (
            <article className="ops-item dashboard-queue-item dashboard-signal-card" key={`${workflow?.title ?? "workflow"}-${index}`}>
              <div>
                <strong>{workflow?.title ?? "결재 workflow"}</strong>
                <span>required {pendingRequiredCount ?? 0}건</span>
              </div>
              <div className="hero-badges">
                <span className="pill subtle">document control</span>
                <StatusBadge tone="review" label={workflow?.status ?? "requested"} />
              </div>
            </article>
          );
        }) : <p className="table-subtext dashboard-empty-state">현재 대기 중인 결재가 없습니다.</p>}
      </div>
    </section>
  );
}

export function SignatureMissingList({ approvals }: { approvals: Array<Record<string, unknown>> }) {
  const rows = approvals.flatMap((approval) => {
    const workflow = approval.workflow as { title?: string } | undefined;
    const document = approval.document as { title?: string; id?: string } | undefined;
    const tasks = (approval.missingSignatureTasks as Array<{ id: string; title?: string; status?: string; required?: boolean }> | undefined) ?? [];
    return tasks.map((task) => ({
      id: task.id,
      workflowTitle: workflow?.title ?? "결재 workflow",
      documentTitle: document?.title ?? document?.id ?? "문서",
      title: task.title ?? "서명 task",
      status: task.status ?? "pending",
      required: task.required ?? false,
    }));
  });

  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SignatureMissingList</p>
          <h3 className="panel-title">서명 / 날인 누락</h3>
          <p className="table-subtext">결재 대기 중인 문서 가운데 서명 또는 날인 반영이 남은 항목입니다.</p>
        </div>
        <StatusBadge tone={rows.length > 0 ? "warning" : "success"} label={`${rows.length}건`} />
      </div>
      <div className="stack-list dashboard-card-list">
        {rows.length > 0 ? rows.map((row) => (
          <article className="ops-item dashboard-queue-item dashboard-signal-card" key={row.id}>
            <div>
              <strong>{row.title}</strong>
              <span>{row.documentTitle} · {row.workflowTitle}</span>
            </div>
            <div className="hero-badges">
              <span className="pill subtle">{row.required ? "required" : "optional"}</span>
              <StatusBadge tone={metricTone(row.status)} label={row.status} />
            </div>
          </article>
        )) : <p className="table-subtext dashboard-empty-state">현재 누락된 서명/날인 task가 없습니다.</p>}
      </div>
    </section>
  );
}

export function SubmissionStatusCard({ items }: { items: OwnerReportStatusSummary[] }) {
  const submittedCount = items.filter((item) => item.status === "submitted" || item.status === "confirmed").length;
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SubmissionStatusCard</p>
          <h3 className="panel-title">제출 상태 요약</h3>
          <p className="table-subtext">confirmed까지 끝난 건과 drafting/review 잔여 건을 분리합니다.</p>
        </div>
      </div>
      <div className="hero-summary-grid dashboard-mini-stats">
        <article className="hero-summary-card dashboard-metric-card success">
          <span>submitted/confirmed</span>
          <strong>{submittedCount}건</strong>
        </article>
        <article className="hero-summary-card dashboard-metric-card warning">
          <span>draft/review</span>
          <strong>{items.length - submittedCount}건</strong>
        </article>
      </div>
    </section>
  );
}

export function MailFileActivityCard({
  activity,
}: {
  activity: {
    messages: Array<Record<string, unknown>>;
    files: Array<Record<string, unknown>>;
    unclassifiedMailCount: number;
    unclassifiedMessages?: Array<Record<string, unknown>>;
  };
}) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">MailFileActivityCard</p>
          <h3 className="panel-title">메일 / 파일 활동</h3>
        </div>
        <StatusBadge tone="review" label={`미분류 ${activity.unclassifiedMailCount}건`} />
      </div>
      <div className="hero-summary-grid dashboard-mini-stats">
        <article className="hero-summary-card dashboard-metric-card">
          <span>최근 메일</span>
          <strong>{activity.messages.length}건</strong>
          <small>프로젝트/문서 링크가 확인된 메일 기준</small>
        </article>
        <article className="hero-summary-card dashboard-metric-card">
          <span>최근 파일 활동</span>
          <strong>{activity.files.length}건</strong>
          <small>웹하드 업로드·분류·공유 로그 기준</small>
        </article>
      </div>
      {activity.unclassifiedMailCount > 0 ? (
        <section className="missing-panel dashboard-inline-warning">
          <div className="hero-badges">
            <StatusBadge tone="warning" label="missing linkage" />
            <span className="pill subtle">mailThread 분류 필요</span>
          </div>
          <p className="helper-text">프로젝트나 문서로 아직 연결되지 않은 메일이 있어 분류 확인이 필요합니다.</p>
        </section>
      ) : null}
    </section>
  );
}

export function UnclassifiedMailList({
  messages,
}: {
  messages: Array<Record<string, unknown>>;
}) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">UnclassifiedMailList</p>
          <h3 className="panel-title">미분류 메일</h3>
          <p className="table-subtext">project/document linkage가 없는 메일을 검토해서 mailbox 쪽에서 분류합니다.</p>
        </div>
        <StatusBadge tone={messages.length > 0 ? "warning" : "success"} label={`${messages.length}건`} />
      </div>
      <div className="stack-list dashboard-card-list">
        {messages.length > 0 ? messages.map((message, index) => (
          <article className="ops-item dashboard-queue-item dashboard-signal-card" key={String(message.id ?? index)}>
            <div>
              <strong>{String(message.subject ?? "메일 제목")}</strong>
              <span>{String(message.fromAddress ?? message.senderName ?? "발신자 미상")}</span>
            </div>
            <div className="hero-badges">
              <span className="pill subtle">{String(message.id ?? "mail-message")}</span>
              <StatusBadge tone="warning" label="link required" />
            </div>
          </article>
        )) : <p className="table-subtext dashboard-empty-state">현재 미분류 메일이 없습니다.</p>}
      </div>
    </section>
  );
}

export function ProjectHealthTable({ items }: { items: ProjectHealthMetric[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectHealthTable</p>
          <h3 className="panel-title">프로젝트 health summary</h3>
          <p className="table-subtext">상태, 지연, 안전관리비 경고, 위험점수를 한 테이블에서 비교합니다.</p>
        </div>
      </div>
      <div className="table-like dashboard-health-table">
        <div className="table-row dashboard-health-head">
          <strong>프로젝트</strong>
          <strong>상태 / backlog</strong>
          <strong>open / overdue</strong>
          <strong>산안비</strong>
          <strong>위험점수</strong>
        </div>
        {items.map((item) => (
          <div className="table-row dashboard-health-row" key={item.id}>
            <div>
              <strong>{item.projectName}</strong>
              <p className="table-subtext">{item.projectId}</p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone={metricTone(item.healthStatus)} label={item.healthStatus} />
              <span className="pill subtle">approval {item.pendingApprovals}</span>
              <span className="pill subtle">lag {item.submissionLagCount}</span>
            </div>
            <div className="table-subtext">open {item.openFindings} / overdue {item.overdueReports}</div>
            <div className="table-subtext">warning {item.safetyCostWarningCount}</div>
            <div className="hero-badges">
              <StatusBadge tone={item.healthStatus === "critical" ? "danger" : item.healthStatus === "warning" ? "warning" : "success"} label={`${item.riskScore}점`} />
              <Link className="inline-link" href={`/projects/${item.projectId}/dashboard`}>
                project dashboard
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProjectRiskHeatmap({ items }: { items: ProjectHealthMetric[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectRiskHeatmap</p>
          <h3 className="panel-title">프로젝트 risk heatmap</h3>
          <p className="table-subtext">warning/danger 카드가 먼저 보이도록 위험점수 중심으로 정리합니다.</p>
        </div>
      </div>
      <div className="hero-summary-grid dashboard-heatmap-grid">
        {items.map((item) => (
          <article className={`hero-summary-card dashboard-heatmap-card ${item.healthStatus}`} key={item.id}>
            <span>{item.projectName}</span>
            <strong>{item.riskScore}점</strong>
            <small>open {item.openFindings} · report {item.overdueReports} · safety {item.safetyCostWarningCount}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProjectDashboardHeader({
  project,
  healthMetric,
}: {
  project: Project;
  healthMetric: ProjectHealthMetric;
}) {
  return (
    <section className="hero-card dashboard-hero-card">
      <div className="hero-head">
        <div>
          <p className="card-eyebrow">ProjectDashboardHeader</p>
          <h2 className="hero-title">{project.projectName}</h2>
          <p className="hero-subtitle">
            {project.projectCode} · {project.siteName} · {project.constructionType}
          </p>
        </div>
        <div className="hero-badges">
          <StatusBadge tone={metricTone(healthMetric.healthStatus)} label={healthMetric.healthStatus} />
          <span className="pill subtle">{project.status}</span>
          <span className="pill subtle">{project.siteAddress}</span>
        </div>
      </div>
      <div className="hero-summary-grid dashboard-kpi-grid">
        <article className="hero-summary-card dashboard-metric-card">
          <span>위험점수</span>
          <strong>{healthMetric.riskScore}점</strong>
          <small>open finding, overdue report, lag 기준</small>
        </article>
        <article className="hero-summary-card dashboard-metric-card warning">
          <span>미조치 / 지연</span>
          <strong>{healthMetric.openFindings} / {healthMetric.overdueReports}</strong>
          <small>follow-up 및 제출 지연 현황</small>
        </article>
        <article className="hero-summary-card dashboard-metric-card review">
          <span>결재 / 산안비</span>
          <strong>{healthMetric.pendingApprovals} / {healthMetric.safetyCostWarningCount}</strong>
          <small>문서 통제와 비용 검토 필요 건수</small>
        </article>
      </div>
    </section>
  );
}

export function ProjectFindingTable({ items }: { items: Array<Record<string, unknown>> }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectFindingTable</p>
          <h3 className="panel-title">프로젝트 미조치 지적사항</h3>
          <p className="table-subtext">round, dueDate, 증빙 개수를 함께 보고 follow-up 우선순위를 잡습니다.</p>
        </div>
      </div>
      <div className="table-like dashboard-stats-table">
        {items.length > 0 ? items.map((item, index) => {
          const finding = item.finding as { id?: string; title?: string; dueDate?: string; inspectionRoundId?: string; status?: string } | undefined;
          const photos = (item.photos as Array<unknown> | undefined) ?? [];
          const actions = (item.actions as Array<unknown> | undefined) ?? [];
          return (
            <div className="table-row dashboard-stats-row" key={String(finding?.id ?? index)}>
              <div>
                <strong>{finding?.title ?? "지적사항"}</strong>
                <p className="table-subtext">{finding?.inspectionRoundId ?? "회차 미연결"}</p>
              </div>
              <div className="dashboard-stat-meta">
                <strong>{finding?.dueDate ?? "기한 미입력"}</strong>
                <span className="table-subtext">기한</span>
              </div>
              <div className="hero-badges">
                <span className="pill subtle">photo {photos.length}</span>
                <span className="pill subtle">action {actions.length}</span>
                <StatusBadge tone={metricTone(finding?.status)} label={finding?.status ?? "open"} />
              </div>
            </div>
          );
        }) : <p className="table-subtext dashboard-empty-state">현재 프로젝트 미조치 지적사항이 없습니다.</p>}
      </div>
    </section>
  );
}

function StatsPanel({ eyebrow, title, stats }: { eyebrow: string; title: string; stats: StatisticsMetric[] }) {
  const total = stats.reduce((sum, stat) => sum + stat.y, 0);
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">{eyebrow}</p>
          <h3 className="panel-title">{title}</h3>
          <p className="table-subtext">기준기간과 원본 집계값을 함께 표시합니다.</p>
        </div>
        <StatusBadge tone="info" label={`합계 ${total}`} />
      </div>
      <div className="dashboard-filter-strip">
        <span className="pill outline">오늘</span>
        <span className="pill outline">이번 주</span>
        <span className="pill outline">이번 달</span>
        <span className="pill outline">직접 선택</span>
      </div>
      <div className="hero-summary-grid dashboard-mini-stats dashboard-chart-summary-grid">
        <article className="hero-summary-card dashboard-metric-card">
          <span>series</span>
          <strong>{stats.length}개</strong>
          <small>표시 중인 구간 수</small>
        </article>
        <article className="hero-summary-card dashboard-metric-card">
          <span>기준</span>
          <strong>{stats[0]?.basisDate ?? "기준일 미입력"}</strong>
          <small>{stats[0]?.calculationNote ?? "source metric 기반 집계"}</small>
        </article>
      </div>
      <div className="table-like dashboard-stats-table">
        {stats.map((stat) => (
          <div className="table-row dashboard-stats-row" key={stat.id}>
            <div>
              <strong>{stat.x}</strong>
              <p className="table-subtext">{stat.label}</p>
            </div>
            <div className="dashboard-stat-meta">
              <strong>{stat.y}</strong>
              <span className="table-subtext">원본 집계값</span>
            </div>
            <div className="dashboard-stat-basis">
              <span className="pill subtle">{stat.seriesKey}</span>
              <span className="table-subtext">
                {stat.periodStart ?? "기간 시작 미입력"} ~ {stat.periodEnd ?? stat.basisDate ?? "기준일 미입력"}
              </span>
              {stat.sourceModels.length > 0 ? (
                <div className="hero-badges">
                  {stat.sourceModels.slice(0, 2).map((model) => (
                    <span className="pill subtle" key={model}>{model}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MonthlyInspectionChart({ stats }: { stats: StatisticsMetric[] }) {
  return <StatsPanel eyebrow="MonthlyInspectionChart" title="월별 점검 통계" stats={stats} />;
}

export function MonthlySubmissionChart({ stats }: { stats: StatisticsMetric[] }) {
  return <StatsPanel eyebrow="MonthlySubmissionChart" title="월별 제출 통계" stats={stats} />;
}

export function RiskTypeDistributionChart({ stats }: { stats: StatisticsMetric[] }) {
  return <StatsPanel eyebrow="RiskTypeDistributionChart" title="위험유형 분포" stats={stats} />;
}

export function SafetyCostUsageChart({ stats }: { stats: StatisticsMetric[] }) {
  return <StatsPanel eyebrow="SafetyCostUsageChart" title="산안비 사용률 분포" stats={stats} />;
}

export function OwnerSubmissionLagChart({ stats }: { stats: StatisticsMetric[] }) {
  return <StatsPanel eyebrow="OwnerSubmissionLagChart" title="발주처 제출 지연 통계" stats={stats} />;
}

export function ExportSummaryChart({ stats }: { stats: StatisticsMetric[] }) {
  return <StatsPanel eyebrow="ExportSummaryChart" title="문서 export 요약" stats={stats} />;
}

export function DashboardInsightPanel({ insightRun }: { insightRun: DashboardInsightRun }) {
  const [message, setMessage] = useState(insightRun.summaryText);
  const [isPending, startTransition] = useTransition();
  return (
    <section className="panel dashboard-insight-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">DashboardInsightPanel</p>
          <h3 className="panel-title">AI draft briefing</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={insightRun.warnings[0] ?? "draft"} />
      </div>
      <div className="hero-badges dashboard-insight-meta">
        <span className="pill outline">AI 요약</span>
        <span className="pill subtle">{insightRun.scope}</span>
        <span className="pill subtle">{insightRun.insightType}</span>
      </div>
      <p className="panel-copy">{message}</p>
      <section className="dashboard-warning-strip">
        <strong>원본 수치 분리</strong>
        <span>이 패널은 sourceMetricKeys 기준 draft 요약만 제공하며, 원본 상태 수정은 하지 않습니다.</span>
      </section>
      <div className="dashboard-source-list">
        {insightRun.sourceMetricKeys.map((metricKey) => (
          <span className="pill subtle" key={metricKey}>{metricKey}</span>
        ))}
      </div>
      <button
        className="inline-link button-reset"
        onClick={() =>
          startTransition(async () => {
            try {
              const response = insightRun.insightType === "project_risk"
                ? await createDashboardProjectRiskInsightAction({ projectId: insightRun.projectId })
                : insightRun.insightType === "weekly_briefing"
                  ? await createDashboardWeeklyBriefingAction({ projectId: insightRun.projectId })
                  : await createDashboardInsightSummaryAction({});
              setMessage(response.insightRun.summaryText);
            } catch {
              setMessage(insightRun.summaryText);
            }
          })
        }
        type="button"
      >
        초안 브리핑 다시 생성
      </button>
    </section>
  );
}

export function AlertList({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">AlertList</p>
          <h3 className="panel-title">운영 경고</h3>
          <p className="table-subtext">severity가 높은 항목부터 보고, 관련 프로젝트/회차/문서로 바로 이동합니다.</p>
        </div>
      </div>
      <div className="stack-list dashboard-card-list">
        {alerts.length > 0 ? alerts.map((alert) => (
          <article className={`ops-item dashboard-alert-item dashboard-signal-card ${alert.severity}`} key={alert.id}>
            <div>
              <strong>{alert.title}</strong>
              <span>{alert.message}</span>
            </div>
            <div className="hero-badges dashboard-alert-meta">
              <span className="pill subtle">{alert.scope}</span>
              {alert.projectId ? <span className="pill subtle">{alert.projectId}</span> : null}
              {alert.inspectionRoundId ? <span className="pill subtle">{alert.inspectionRoundId}</span> : null}
              {alert.documentId ? <span className="pill subtle">{alert.documentId}</span> : null}
              {alert.ownerPartyId ? <span className="pill subtle">{alert.ownerPartyId}</span> : null}
            </div>
            <div className="hero-badges">
              <StatusBadge tone={alert.severity === "danger" ? "danger" : "warning"} label={alert.severity} />
              <StatusBadge tone={metricTone(alert.status)} label={alert.status} />
              <Link className="inline-link" href={alert.route}>원본 이동</Link>
            </div>
          </article>
        )) : <p className="table-subtext dashboard-empty-state">현재 활성 알림이 없습니다.</p>}
      </div>
    </section>
  );
}

export function AlertRuleTable({ rules }: { rules: AlertRule[] }) {
  const [message, setMessage] = useState("alert rules ready");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">AlertRuleTable</p>
          <h3 className="panel-title">알림 규칙</h3>
          <p className="table-subtext">threshold, severity, enabled 상태를 함께 관리합니다.</p>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <div className="table-like dashboard-stats-table">
        {rules.map((rule) => (
          <div className="table-row dashboard-stats-row" key={rule.id}>
            <div>
              <strong>{rule.name}</strong>
              <p className="table-subtext">{rule.description}</p>
            </div>
            <div className="hero-badges">
              <span className="pill subtle">threshold {String(rule.threshold ?? "-")}</span>
              <StatusBadge tone={metricTone(rule.severity)} label={rule.severity} />
              <StatusBadge tone={rule.enabled ? "success" : "warning"} label={rule.enabled ? "enabled" : "disabled"} />
            </div>
            <button
              className="inline-link button-reset"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await updateDashboardAlertRuleAction(rule.id, { enabled: !rule.enabled });
                    setMessage(`PATCH /api/v1/dashboard/alert-rules/${rule.id}`);
                  } catch {
                    setMessage("rule update failed");
                  }
                })
              }
              type="button"
            >
              {rule.enabled ? "비활성화" : "활성화"}
            </button>
          </div>
        ))}
      </div>
      <button
        className="inline-link button-reset"
        onClick={() =>
          startTransition(async () => {
            try {
              await createDashboardAlertRuleAction({
                ruleKey: "custom_watch",
                name: "사용자 경고",
                description: "운영자가 추가한 경고 규칙",
                severity: "warning",
              });
              setMessage("POST /api/v1/dashboard/alert-rules");
            } catch {
              setMessage("rule create failed");
            }
          })
        }
        type="button"
      >
        규칙 초안 추가
      </button>
    </section>
  );
}

export function WidgetSettingsPanel({ widgets }: { widgets: DashboardWidget[] }) {
  const [message, setMessage] = useState("widgets ready");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">WidgetSettingsPanel</p>
          <h3 className="panel-title">위젯 설정</h3>
          <p className="table-subtext">표시 순서와 활성 여부를 저장하고, 신규 KPI 카드를 초안으로 추가합니다.</p>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <div className="stack-list dashboard-card-list">
        {widgets.map((widget) => (
          <article className="ops-item dashboard-widget-item compact" key={widget.id}>
            <div>
              <strong>{widget.title}</strong>
              <span>{widget.route}</span>
            </div>
            <StatusBadge tone={widget.enabled ? "success" : "warning"} label={widget.enabled ? "enabled" : "disabled"} />
          </article>
        ))}
      </div>
      <div className="hero-badges dashboard-control-row">
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await createDashboardWidgetAction({
                  title: "신규 KPI 카드",
                  widgetType: "custom_metric",
                  route: "/dashboard",
                });
                setMessage("POST /api/v1/dashboard/widgets");
              } catch {
                setMessage("widget create failed");
              }
            })
          }
          type="button"
        >
          위젯 추가
        </button>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await reorderDashboardWidgetsAction(widgets.map((item) => item.id));
                setMessage("POST /api/v1/dashboard/widgets/reorder");
              } catch {
                setMessage("widget reorder failed");
              }
            })
          }
          type="button"
        >
          순서 저장
        </button>
      </div>
    </section>
  );
}

export function DashboardControlPanel({ alerts }: { alerts: DashboardAlert[] }) {
  const [message, setMessage] = useState("alerts ready");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="panel dashboard-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">DashboardControlPanel</p>
          <h3 className="panel-title">알림 제어</h3>
          <p className="table-subtext">active alert 정리용 acknowledge/dismiss와 refresh만 제공합니다.</p>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <div className="hero-summary-grid dashboard-mini-stats dashboard-control-summary-grid">
        <article className="hero-summary-card dashboard-metric-card warning">
          <span>active</span>
          <strong>{alerts.filter((alert) => alert.status === "open").length}건</strong>
        </article>
        <article className="hero-summary-card dashboard-metric-card">
          <span>danger</span>
          <strong>{alerts.filter((alert) => alert.severity === "danger").length}건</strong>
        </article>
      </div>
      <div className="hero-badges dashboard-control-row">
        <span className="pill outline">danger / warning 우선</span>
        <span className="pill outline">원본 수정 없음</span>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await refreshDashboardAlertsAction();
                setMessage("POST /api/v1/dashboard/alerts/refresh");
              } catch {
                setMessage("alert refresh failed");
              }
            })
          }
          type="button"
        >
          경고 새로고침
        </button>
        {alerts[0] ? (
          <>
            <button
              className="inline-link button-reset"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await acknowledgeDashboardAlertAction(alerts[0].id);
                    setMessage(`PATCH /api/v1/dashboard/alerts/${alerts[0].id}/acknowledge`);
                  } catch {
                    setMessage("alert acknowledge failed");
                  }
                })
              }
              type="button"
            >
              첫 경고 확인
            </button>
            <button
              className="inline-link button-reset"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await dismissDashboardAlertAction(alerts[0].id);
                    setMessage(`PATCH /api/v1/dashboard/alerts/${alerts[0].id}/dismiss`);
                  } catch {
                    setMessage("alert dismiss failed");
                  }
                })
              }
              type="button"
            >
              첫 경고 숨김
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
