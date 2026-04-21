# Admin Proof: Headquarters And Sites Pagination State Hold

## Covered behavior

- when the headquarters list opens from a cached first page and the user moves to page 2, the current rows remain visible until the next page payload resolves
- when the sites list opens from a cached first page and the user moves to page 2, the table does not drop to the initial empty/skeleton branch before the fetch completes
- headquarter/site drilldown routing keeps the selected URL context long enough for the section-level loaders to restore the matching entity

## Manual verification notes

- reproduce with a signed-in admin account and enough headquarters/sites to reach at least two pages
- load page 1 once, return to the same section so the first page is available from session cache, then click `다음`
- confirm the table keeps the previous page rows instead of flashing the initial skeleton panel during the next-page request
