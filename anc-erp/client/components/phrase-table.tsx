"use client";

import { useState, useTransition } from "react";

import type { Phrase } from "../../packages/contracts/src";
import { createAdminPhraseAction, publishAdminPhraseAction } from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

export function PhraseTable({ phrases }: { phrases: Phrase[] }) {
  const [message, setMessage] = useState("표준 문구");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PhraseTable</p>
          <h3 className="panel-title">표준 문구 라이브러리</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "info"} label={message} />
      </div>
      <div className="utility-row" style={{ justifyContent: "flex-start", marginBottom: 16 }}>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await createAdminPhraseAction({
                  phraseType: "standard_phrase",
                  title: "초안 안내 문구",
                  body: "본 문서는 업무용 초안입니다.",
                  tags: ["draft"],
                });
                setMessage("POST /admin/phrases");
              } catch {
                setMessage("문구 생성 대기");
              }
            })
          }
          type="button"
        >
          문구 추가
        </button>
      </div>
      <div className="stack-list">
        {phrases.map((phrase) => (
          <article className="ops-item" key={phrase.id}>
            <div>
              <strong>{phrase.title}</strong>
              <span>{phrase.body}</span>
            </div>
            <button
              className="inline-link button-reset"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await publishAdminPhraseAction(phrase.id);
                    setMessage(`POST /phrases/${phrase.id}/publish`);
                  } catch {
                    setMessage("문구 발행 대기");
                  }
                })
              }
              type="button"
            >
              {phrase.status}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
