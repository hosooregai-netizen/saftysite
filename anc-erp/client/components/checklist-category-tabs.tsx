import type { ChecklistCategory } from "../../packages/contracts/src";

export function ChecklistCategoryTabs({ categories }: { categories: ChecklistCategory[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistCategoryTabs</p>
          <h3>카테고리</h3>
        </div>
      </div>
      <div className="badge-row">
        {categories.map((category) => (
          <span className="pill" key={category.id}>
            {category.title}
          </span>
        ))}
      </div>
    </section>
  );
}
