export function RenameModal({ currentName }: { currentName: string }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">RenameModal</p>
          <h3 className="panel-title">이름 변경</h3>
        </div>
      </div>
      <p>{currentName}</p>
    </section>
  );
}

