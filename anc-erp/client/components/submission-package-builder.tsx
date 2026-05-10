"use client";

import { useState, useTransition } from "react";

import {
  createSubmissionPackageAction,
  finalizeSubmissionPackageAction,
  validateSubmissionPackageAction,
} from "../lib/approval-actions";
import { StatusBadge } from "./status-badge";

type SubmissionPackageBuilderProps = {
  documentId: string;
  packageId?: string | null;
  mainFileId?: string | null;
};

export function SubmissionPackageBuilder({ documentId, packageId, mainFileId }: SubmissionPackageBuilderProps) {
  const [message, setMessage] = useState("패키지 작업 대기");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SubmissionPackageBuilder</p>
          <h3 className="panel-title">제출 패키지 빌더</h3>
          <p className="card-copy">main file 기준으로 생성, validate, finalize 순서를 직접 점검합니다.</p>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <div className="stack-list">
        <article className="ops-item">
          <strong>mainFileId</strong>
          <span>{mainFileId ?? "미연결"}</span>
        </article>
      </div>
      <div className="utility-row">
        <button
          className="inline-link button-reset"
          disabled={!mainFileId || isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                await createSubmissionPackageAction(documentId, { mainFileId });
                setMessage("create API 연결됨");
              } catch {
                setMessage("create 대기");
              }
            })
          }
          type="button"
        >
          패키지 생성
        </button>
        <button
          className="inline-link button-reset"
          disabled={!packageId || isPending}
          onClick={() =>
            startTransition(async () => {
              if (!packageId) return;
              try {
                await validateSubmissionPackageAction(packageId);
                setMessage("validate API 연결됨");
              } catch {
                setMessage("validate 대기");
              }
            })
          }
          type="button"
        >
          패키지 검증
        </button>
        <button
          className="inline-link button-reset"
          disabled={!packageId || isPending}
          onClick={() =>
            startTransition(async () => {
              if (!packageId) return;
              try {
                await finalizeSubmissionPackageAction(packageId);
                setMessage("finalize API 연결됨");
              } catch {
                setMessage("finalize 대기");
              }
            })
          }
          type="button"
        >
          패키지 확정
        </button>
      </div>
    </section>
  );
}
