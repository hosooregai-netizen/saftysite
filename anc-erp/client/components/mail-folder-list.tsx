export function MailFolderList({ currentFolder = "inbox" }: { currentFolder?: string }) {
  const folders = ["inbox", "sent", "drafts", "archive"];
  return (
    <section className="panel">
      <p className="card-eyebrow">Folders</p>
      <div className="link-list">
        {folders.map((folder) => (
          <span className={`pill ${currentFolder === folder ? "" : "outline"}`} key={folder}>
            {folder}
          </span>
        ))}
      </div>
    </section>
  );
}
