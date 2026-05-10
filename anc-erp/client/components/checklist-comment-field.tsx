export function ChecklistCommentField({ comment }: { comment?: string | null }) {
  return (
    <div className="stacked-note">
      <strong>현장 메모</strong>
      <p>{comment ?? "메모 없음"}</p>
    </div>
  );
}
