import type { ChecklistResult } from "../../packages/contracts/src";
import { ChecklistResultRadioGroup } from "./checklist-result-radio-group";

export function ChecklistItemCard({ result }: { result: ChecklistResult }) {
  return (
    <article className="card checklist-mobile-card">
      <div className="card-head checklist-mobile-card-head">
        <div>
          <p className="card-eyebrow">ChecklistItemCard</p>
          <h3>{result.item?.title ?? result.checklistItemId}</h3>
          <p>{result.item?.detail ?? "세부 설명 없음"}</p>
        </div>
      </div>
      <ChecklistResultRadioGroup resultId={result.id} value={result.result} />
    </article>
  );
}
