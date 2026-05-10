import Link from "next/link";

type PageNavigatorProps = {
  items: Array<{
    href: string;
    label: string;
    active?: boolean;
  }>;
};

export function PageNavigator({ items }: PageNavigatorProps) {
  return (
    <section className="panel report-page-nav">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PageNavigator</p>
          <h3 className="panel-title">문서 작업 이동</h3>
        </div>
      </div>
      <div className="report-page-nav-list">
        {items.map((item) => (
          <Link
            className={item.active ? "quick-link report-page-link active" : "quick-link report-page-link"}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
