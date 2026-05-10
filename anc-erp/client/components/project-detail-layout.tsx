import Link from "next/link";
import type { ReactNode } from "react";

import { getProjectRegistryTabLinks } from "../lib/module-registry";

export function ProjectDetailLayout({
  projectId,
  activeLabel,
  children,
}: {
  projectId: string;
  activeLabel: string;
  children: ReactNode;
}) {
  const tabs = getProjectRegistryTabLinks(projectId);

  return (
    <>
      <section className="card tab-shell">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">Project Tabs</p>
            <h3>프로젝트 상세 허브</h3>
          </div>
        </div>
        <div className="tab-strip">
          {tabs.map((tab) => (
            <Link
              className={`tab-link${tab.label === activeLabel ? " active" : ""}`}
              href={tab.href}
              key={tab.href}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </section>
      {children}
    </>
  );
}
