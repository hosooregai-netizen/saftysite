# Admin Proof: Single Field Agent Assignment

## Covered Behavior

- The headquarter assignment modal can load field-agent options from directory lookups when dashboard user data is empty.
- A site shows only one current field-agent assignment.
- A headquarter shows only one current field-agent assignment.
- Selecting another field agent is presented as a replacement action instead of an additional parallel assignment.
- Client-side admin assignment state drops older active assignments for the same site when a replacement is saved.

## Verification

- `npm run lint -w @saftysite/web`
