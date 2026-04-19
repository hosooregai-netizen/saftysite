# Admin Proof: Headquarters Site Context Restore

## Expected

- from admin technical guidance, quarterly, bad workplace, photo album, and inspection workspace screens, the left menu `현장 메인` link returns to the same admin site main view
- the same navigation does not fall back to the headquarters list when the current site already has a resolvable `headquarterId`
- opening `/admin?section=headquarters&siteId={siteId}` restores the canonical `headquarterId + siteId` route before rendering the site main view
- the top-level `사업장 / 현장` button still opens the list entry point rather than forcing the current site main
