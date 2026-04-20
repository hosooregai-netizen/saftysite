# Admin Users / Schedules / Photo Download Proof

- scope
  - inactive users are hidden from the admin users list
  - controller schedule PATCH persists `selectionReasonMemo`
  - photo album download filename keeps an image/archive extension

- verification
  - `npx tsc --noEmit --pretty false`
  - smoke harness login did not complete in this shell session, so browser smoke was not used as the final proof artifact for this batch
