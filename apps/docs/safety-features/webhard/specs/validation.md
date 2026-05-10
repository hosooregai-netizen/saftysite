# Validation: Webhard

## 1. Functional Validation

- [ ] `/webhard` loads for authenticated user.
- [ ] Drive items are listed.
- [ ] Folder navigation works.
- [ ] Breadcrumb updates.
- [ ] Search filters items.
- [ ] Sort changes item order.
- [ ] List/grid toggle works.
- [ ] Detail panel opens/closes.
- [ ] Create folder works.
- [ ] Create memo works.
- [ ] Create link works.
- [ ] Upload binary file works.
- [ ] Rename works.
- [ ] Move works.
- [ ] Star/unstar works.
- [ ] Trash works.
- [ ] Restore works.
- [ ] Purge works if supported.

## 2. Permission Validation

- [ ] Owner can read/edit/share.
- [ ] Viewer can read but cannot edit.
- [ ] Editor can edit.
- [ ] User without permission cannot see item in list.
- [ ] User without permission cannot fetch parent folder.
- [ ] User without share permission cannot view permission list.
- [ ] Inherited folder permission applies to child files.
- [ ] Expired permission is ignored.
- [ ] Owner permission cannot be casually deleted.

## 3. Share Link Validation

- [ ] Create share link.
- [ ] Copy share link.
- [ ] Update link visibility.
- [ ] Update link role.
- [ ] Set expiry.
- [ ] Revoke link.
- [ ] Revoked token fails.
- [ ] Expired token fails.

## 4. Public Share Validation

- [ ] Public file share loads.
- [ ] Public folder share loads.
- [ ] Public child folder navigation works.
- [ ] Public breadcrumb is relative to shared root.
- [ ] Public token cannot access parent of root.
- [ ] Public token cannot access sibling item.
- [ ] Public token cannot access workspace root.
- [ ] Deleted/trashed children are hidden.
- [ ] Private permission details are not exposed.

## 5. UI/UX Validation

- [ ] UI is Drive-like fullscreen workspace.
- [ ] Sidebar is flat navigation, not card list.
- [ ] Main file list is canvas/table, not nested card layout.
- [ ] Detail panel is optional.
- [ ] Context menu works on row right-click.
- [ ] Selection toolbar appears when item is selected.
- [ ] Empty states are helpful.
- [ ] Snackbar is used for routine success messages.

## 6. Accessibility Validation

- [ ] Buttons have accessible labels.
- [ ] Enter opens selected folder/file.
- [ ] Escape closes dialog/menu.
- [ ] Share dialog traps focus.
- [ ] Context menu is keyboard reachable or has equivalent more button.
- [ ] Color contrast passes common WCAG AA expectations.

## 7. Build Validation

Frontend:

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

Backend smoke test:

```bash
cd apps/api
python -m pytest
```

If no pytest suite exists, run route-level manual smoke tests.

## 8. Security Non-Negotiables

- [ ] No data_url/text_content/external_url leakage without access check.
- [ ] Public token is bounded by share root.
- [ ] Workspace id is checked on every object.
- [ ] Revoked and expired shares return no useful metadata.
- [ ] Trash/deleted items are excluded from public share.
