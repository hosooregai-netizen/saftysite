"use client";

import { useState } from "react";

import { startGoogleMailOAuthDraft } from "../lib/mail-actions";

export function OAuthConnectCard() {
  const [authUrl, setAuthUrl] = useState("");

  async function handleConnect() {
    const response = await startGoogleMailOAuthDraft();
    setAuthUrl(response.authUrl);
  }

  return (
    <section className="panel">
      <p className="card-eyebrow">OAuthConnectCard</p>
      <h3 className="panel-title">Google OAuth 연결</h3>
      <button type="button" onClick={handleConnect}>
        연결 URL 생성
      </button>
      {authUrl ? <p className="muted">{authUrl}</p> : null}
    </section>
  );
}
