import type { FileAsset } from "../../packages/contracts/src";
import { FileRow } from "./file-row";

export function FileList({ files }: { files: FileAsset[] }) {
  return (
    <section className="panel webhard-table-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">FileList</p>
          <h3 className="panel-title">파일 목록</h3>
          <p className="inline-link-meta">파일명, 태그, 연결 대상, 상태를 한 번에 비교하는 운영용 테이블입니다.</p>
        </div>
        <span className="pill outline">{files.length} rows</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>태그</th>
            <th>연결</th>
            <th>크기</th>
            <th>수정일</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
