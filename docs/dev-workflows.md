# Dev workflows

## ERP / 한종안

- `npm run dev`
- `npm run dev:erp`

Both commands start the existing ERP app from the repository root through `scripts/rundev.mjs`.

## Report SaaS / 개별 문서

- `npm run dev:sass`
- `npm run dev:saas`

These commands start the report SaaS web workspace and its local FastAPI API together.
The web app runs from `apps/web`, and the API runs from `apps/api`.

Useful direct commands:

- `npm run dev:web`: start only the report SaaS web workspace.
- `npm run api:install`: create/update the API virtual environment.
- `npm run api:dev`: start only the report SaaS API.
