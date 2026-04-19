# Admin Proof: Headquarters Write Response Regression

## Expected Behavior

- creating or editing a headquarter or site does not throw `Unexpected end of JSON input` when the upstream success response body is empty
- the modal closes after a successful save without waiting on admin snapshot warm-up work to finish
- the section can refresh its rows immediately after the save response returns

## Automated Check

- `node --import tsx --test lib/safetyApi/client.test.ts server/admin/safetyApiServer.test.ts`

## Manual Check

- open admin `headquarters`
- create a headquarter and confirm the save completes without a JSON parse error
- edit that headquarter or one of its sites and confirm the save returns promptly instead of hanging on the mutation spinner
