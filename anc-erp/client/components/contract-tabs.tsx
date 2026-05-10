import Link from "next/link";

export function ContractTabs({ contractId, active }: { contractId: string; active: string }) {
  const tabs = [
    { label: "요약", href: `/contracts/${contractId}` },
    { label: "수정", href: `/contracts/${contractId}/edit` },
    { label: "미리보기", href: `/contracts/${contractId}/preview` },
    { label: "지급조건", href: `/contracts/${contractId}/payments` },
    { label: "파일", href: `/contracts/${contractId}/files` },
    { label: "변경이력", href: `/contracts/${contractId}/changes` },
  ];

  return (
    <section className="card tab-shell">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractTabs</p>
          <h3>계약 상세 탭</h3>
        </div>
      </div>
      <div className="tab-strip">
        {tabs.map((tab) => (
          <Link className={`tab-link${tab.label === active ? " active" : ""}`} href={tab.href} key={tab.href}>
            {tab.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
