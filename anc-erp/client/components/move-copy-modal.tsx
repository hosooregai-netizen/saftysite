export function MoveCopyModal({ folderPath }: { folderPath: string }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">MoveCopyModal</p>
          <h3 className="panel-title">이동 / 복사 안내</h3>
        </div>
      </div>
      <p>현재 대상 폴더: {folderPath}</p>
    </section>
  );
}

