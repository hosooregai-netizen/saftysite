type OrganizationRoleTableProps = {
  rows: Array<{
    role: string;
    name?: string | null;
    responsibility: string;
  }>;
};

export function OrganizationRoleTable({ rows }: OrganizationRoleTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>역할</th>
          <th>담당자</th>
          <th>책임</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.role}-${index}`}>
            <td>{row.role}</td>
            <td>{row.name ?? "-"}</td>
            <td>{row.responsibility}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
