import type { Contact, Organization } from "../../packages/contracts/src";

import { ContactCard } from "./project-summary-cards";

export function ContactTable({
  contacts,
  organizations,
}: {
  contacts: Contact[];
  organizations: Organization[];
}) {
  const organizationMap = new Map(organizations.map((item) => [item.id, item]));

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContactTable</p>
          <h3>담당자 연락처</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>이름</th>
            <th>소속</th>
            <th>연락처</th>
            <th>보고서</th>
            <th>조치요청</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>{contact.name}</td>
              <td>{organizationMap.get(contact.organizationId)?.name ?? "-"}</td>
              <td>
                {contact.phone ?? "-"}
                <div className="table-subtext">{contact.email ?? "이메일 미입력"}</div>
              </td>
              <td>{contact.receivesReport ? "수신" : "미수신"}</td>
              <td>{contact.receivesActionRequest ? "수신" : "미수신"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="card-grid" style={{ marginTop: 18 }}>
        {contacts.map((contact) => (
          <ContactCard
            contact={contact}
            key={contact.id}
            organization={organizationMap.get(contact.organizationId)}
          />
        ))}
      </div>
    </section>
  );
}
