"use client";

import { useState } from "react";

export function MailSearchBar() {
  const [query, setQuery] = useState("");
  return (
    <label className="field">
      <span className="field-label">메일 검색</span>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목, 수신자, 첨부명" />
    </label>
  );
}
