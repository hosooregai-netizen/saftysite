# Step 18 Next Actions

## Build가 통과하면

Step 19는 feature hardening으로 진행한다.

우선순위:

1. Mailbox compose/recipient UX hardening
2. PhotoAlbumPanel grid/filter/upload hardening
3. Headquarters/Sites directory table/modal hardening
4. Document bridge PDF/HWPX real output hardening

## Build가 실패하면

Step 19는 remaining error patch로 진행한다.

우선순위:

1. missing import
2. TypeScript props mismatch
3. API client path mismatch
4. CSS module class mismatch
5. server helper mismatch
