# Admin Proof: Site List Project Kind Column Removal

## Covered behavior

- the admin 사업장/현장 목록 screen no longer shows a `공사 종류` header in the site list table
- each site row now renders without the `project_kind` cell, so the visible order remains `현장명`, `담당자`, `주소`, `금액`, `상태`, `현장별 진행률`, `메뉴`
- row click navigation and the action menu stay available after the column removal

## Manual verification notes

- open `/admin?section=headquarters&siteStatus=all` with an admin account that can see the site list
- confirm the site list table header does not include `공사 종류`
- confirm a sample row still opens the site entry screen on row click and that the `메뉴` action button remains aligned on the far right
