type WebhardSaveLocationProps = {
  path?: string | null;
};

export function WebhardSaveLocation({ path }: WebhardSaveLocationProps) {
  return (
    <section className="card">
      <p className="card-eyebrow">WebhardSaveLocation</p>
      <h3>웹하드 저장 위치</h3>
      <p className="card-copy">{path ?? "최종 export 후 생성됩니다."}</p>
    </section>
  );
}

