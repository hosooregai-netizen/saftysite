"use client";

import { useState } from "react";

type EducationPlanFormProps = {
  onAdd: (item: {
    educationType: string;
    target: string;
    cycle: string;
    content: string;
    recordMethod: string;
  }) => void;
};

export function EducationPlanForm({ onAdd }: EducationPlanFormProps) {
  const [educationType, setEducationType] = useState("");
  const [target, setTarget] = useState("");
  const [cycle, setCycle] = useState("");
  const [content, setContent] = useState("");
  const [recordMethod, setRecordMethod] = useState("");

  function handleAdd() {
    if (!educationType.trim() || !target.trim() || !cycle.trim()) {
      return;
    }
    onAdd({
      educationType: educationType.trim(),
      target: target.trim(),
      cycle: cycle.trim(),
      content: content.trim(),
      recordMethod: recordMethod.trim(),
    });
    setEducationType("");
    setTarget("");
    setCycle("");
    setContent("");
    setRecordMethod("");
  }

  return (
    <div className="form-grid">
      <label className="form-field">
        <span>교육유형</span>
        <input className="fake-input" onChange={(event) => setEducationType(event.target.value)} value={educationType} />
      </label>
      <label className="form-field">
        <span>대상</span>
        <input className="fake-input" onChange={(event) => setTarget(event.target.value)} value={target} />
      </label>
      <label className="form-field">
        <span>주기</span>
        <input className="fake-input" onChange={(event) => setCycle(event.target.value)} value={cycle} />
      </label>
      <label className="form-field">
        <span>기록 방식</span>
        <input className="fake-input" onChange={(event) => setRecordMethod(event.target.value)} value={recordMethod} />
      </label>
      <label className="form-field span-2">
        <span>교육 내용</span>
        <textarea className="fake-input" onChange={(event) => setContent(event.target.value)} rows={3} value={content} />
      </label>
      <div className="inline-actions">
        <button className="secondary-button" onClick={handleAdd} type="button">
          교육 항목 추가
        </button>
      </div>
    </div>
  );
}
