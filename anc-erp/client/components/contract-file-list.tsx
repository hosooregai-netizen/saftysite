import type { ContractFileLink } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function ContractFileList({ files }: { files: ContractFileLink[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractFileList</p>
          <h3>계약 파일 목록</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>파일명</th>
            <th>분류</th>
            <th>저장 위치</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>{file.fileName}</td>
              <td>
                {file.isSigned ? <StatusBadge tone="success" label="날인본" /> : null}
                {file.isFinal ? <StatusBadge tone="info" label="최종본" /> : null}
                {!file.isSigned && !file.isFinal ? file.fileCategory : null}
              </td>
              <td>{file.storagePath}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
