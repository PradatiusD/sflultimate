# AGENTS.md

## Project Overview

This is the South Florida Ultimate website and admin app. The application is a KeystoneJS 5 project in `app/` with a Next.js frontend in `app/next/`, backed by MongoDB and deployed on Heroku.

Primary user-facing workflows include league registration, substitutions, schedules, teams, stats, pickups, events, news, and admin-managed content.

## Runtime

Use the versions declared in `package.json`:

- Node: `20.18.0`
- npm: `10.8.2`

The app expects a root `.env` file loaded from `app/index.js`. Never commit `.env`, database dumps, generated CSVs, credentials, payment tokens, or user data.

## Common Commands

- Install: `npm install`
- Dev app: `npm run dev`
- Lint: `npm run lint`
- Production build: `npm run build`
- Production start: `npm run start`
- Cypress UI: `npm run cypress`
- Rebuild custom Keystone field views: `npm run custom-fields`
- Refresh GraphQL schema from a running local app: `npm run build-schema`
- Restore DB from dump: `npm run restore`

Use `npm run dev` for local app development. Do not use old Grunt server tasks unless they have first been updated; current Grunt server/watch config still references removed root legacy files.

`npm run restore` drops and restores the local `sflultimateV5` database. Do not run it casually.

## Architecture

- Keystone app entry: `app/index.js`
- Keystone adapter/config: `app/keystone.js`
- Keystone lists: `app/lists/*.js`
- List registry: `app/lists/index.js`
- Next app root: `app/next/`
- Next pages: `app/next/pages/`
- API routes: `app/next/pages/api/`
- Shared frontend/server utilities: `app/next/lib/`
- React components: `app/next/components/`
- Static assets and SCSS: `app/next/public/`
- Cypress tests: `cypress/e2e/`
- Operational scripts: `scripts/`

When adding a Keystone list, create it in `app/lists/` and register it in `app/lists/index.js`.

When changing list fields used by the frontend, update the GraphQL queries in `app/next/pages/`, `app/next/components/`, or `app/next/lib/` as needed. If schema changes matter to tooling, rebuild `app/schema.graphql`.

## Code Style

This repo uses ESLint with StandardJS, Cypress, and Next config:

- Run `npm run lint` before handing off code when practical
- No semicolons
- Single quotes
- Space before function parens, matching the existing code
- Prefer existing CommonJS style in Keystone list/config files
- ES module imports are already used in many Next files; follow the surrounding file
- Keep changes small and local to the requested behavior

## Frontend Guidance

Use the existing Bootstrap-based styling and classes. Do not introduce a new design system for narrow changes.

SCSS source files live under `app/next/public/styles/`. Avoid editing compiled CSS alone when an SCSS source exists.

Use existing shared components from `app/next/components/` before adding new one-off markup.

## Registration And Payments

Registration is business-critical. Be careful with:

- `app/next/components/Register.js`
- `app/next/pages/register.js`
- `app/next/pages/leagues/[slug]/register.js`
- `app/next/pages/leagues/[slug]/substitutions.js`
- `app/next/pages/api/register.js`
- `app/next/pages/api/substitutions.js`
- `app/next/pages/api/utils.js`
- `app/next/lib/payment-utils.js`

Payment uses Braintree. Bot checks use reCAPTCHA. Notifications may use email and Slack.

Do not log payment nonces, secrets, or unnecessary personal data. Do not use real payment credentials or live payment flows in tests unless explicitly requested.

The `disable_payment=true` and `force_form=true` query params are local/testing conveniences. Do not rely on them as production authorization.

## Dates And Leagues

League registration windows are date-sensitive and should be interpreted for the South Florida audience. Preserve the existing `America/New_York` behavior where present.

`LeagueUtils.addLeagueStatus` controls registration state. If changing registration timing, verify early, regular, late, closed, and substitution paths.

## Testing

Cypress tests assume a running local app and suitable database state. The registration spec targets configured league slugs in local test data.

Before committing Cypress work:

- Remove any accidental `it.only` or `describe.only`
- Avoid tests that submit real payments or send real user-facing email unless explicitly intended
- Prefer `disable_payment=true` for registration-flow coverage when payment itself is not under test

For build verification, run `npm run build` when the change touches Keystone config, lists, Next pages, shared libs, or imports.

## Data Safety

This app manages real player, registration, payment-adjacent, and contact information.

Agents must not:

- Commit `.env`, dumps, generated CSVs, or local database artifacts
- Print secrets or full user datasets in logs or final responses
- Add broad exports of player data without explicit request
- Weaken payment, reCAPTCHA, admin auth, or registration validation silently

## Deployment

Heroku runs:

```sh
cd app && cross-env NODE_ENV=production keystone start
```

Keep production behavior compatible with that working directory. Root-relative paths should be checked carefully because dev scripts and Heroku both `cd app`.
