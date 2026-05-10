type A4PreviewProps = {
  title?: string;
  rows?: Array<{ label: string; status: string; note: string }>;
  watermark?: string;
};

export function A4Preview({
  title = "공사안전보건대장 이행확인 보고서",
  watermark = "AI DRAFT",
  rows = [
    { label: "현장 개요", status: "초안", note: "발주처 분기 확인" },
    { label: "점검표", status: "대기", note: "회차 데이터 필요" },
    { label: "사진대지", status: "대기", note: "전/후 사진 연결 필요" },
  ],
}: A4PreviewProps) {
  return (
    <div className="a4-surface">
      <div className="a4-paper">
        <div className="a4-watermark">{watermark}</div>
        <h4>{title}</h4>
        <div className="a4-meta">
          <div className="a4-line medium" />
          <div className="a4-line short" />
        </div>
        <div className="a4-table">
          <div className="a4-row">
            <span>항목</span>
            <span>상태</span>
            <span>검토</span>
          </div>
          {rows.map((row) => (
            <div className="a4-row" key={`${row.label}-${row.status}`}>
              <span>{row.label}</span>
              <span>{row.status}</span>
              <span>{row.note}</span>
            </div>
          ))}
        </div>
        <div className="a4-lines" style={{ marginTop: 18 }}>
          <div className="a4-line" />
          <div className="a4-line medium" />
          <div className="a4-line" />
          <div className="a4-line short" />
        </div>
      </div>
    </div>
  );
}
