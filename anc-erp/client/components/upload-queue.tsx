export function UploadQueue({ items }: { items: string[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">UploadQueue</p>
          <h3 className="panel-title">업로드 큐</h3>
        </div>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

