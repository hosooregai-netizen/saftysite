import type { ChecklistResult } from "../../packages/contracts/src";
import { ChecklistCommentField } from "./checklist-comment-field";
import { ChecklistResultRadioGroup } from "./checklist-result-radio-group";
import { StatusBadge } from "./status-badge";

export function ChecklistResultTable({ results }: { results: ChecklistResult[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistResultTable</p>
          <h3>표준 점검표 입력</h3>
          <p>보고서 표 구조와 최대한 유사하게 결과, 의견, 사진, 지적후보 상태를 함께 검토합니다.</p>
        </div>
      </div>
      <div className="checklist-table-wrap">
        <table className="table checklist-table">
          <thead>
            <tr>
              <th>분야</th>
              <th>항목</th>
              <th>결과 입력</th>
              <th>지적사항 및 의견</th>
              <th>사진</th>
              <th>지적후보</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id}>
                <td>
                  <div className="section-stack compact">
                    <strong>{result.item?.categoryKey ?? "-"}</strong>
                    <span className="helper-text">{result.item?.reportLabel ?? "라벨 미정"}</span>
                  </div>
                </td>
                <td>
                  <div className="section-stack compact">
                    <strong>{result.item?.title ?? result.checklistItemId}</strong>
                    <span>{result.item?.detail ?? "세부 설명 없음"}</span>
                  </div>
                </td>
                <td>
                  <ChecklistResultRadioGroup resultId={result.id} value={result.result} />
                </td>
                <td>
                  <ChecklistCommentField comment={result.comment} />
                </td>
                <td>
                  <div className="status-stack">
                    <StatusBadge tone={result.photoIds.length > 0 ? "success" : "warning"} label={`${result.photoIds.length}건`} />
                    <span className="helper-text">{result.photoIds.length > 0 ? "사진 연결 완료" : "사진 등록 권장"}</span>
                  </div>
                </td>
                <td>
                  <div className="status-stack">
                    <StatusBadge
                      tone={result.findingCandidateId ? "warning" : "neutral"}
                      label={result.findingCandidateId ? "후보 생성" : "후보 없음"}
                    />
                    <span className="helper-text">{result.findingCandidateId ?? "주의/불량 시 후보 생성"}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
