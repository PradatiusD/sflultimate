# Draftboard Redesign Implementation Plan

> **For Hermes:** Implement this plan task-by-task, loading the test-driven-development skill first. Do not commit or push unless the user explicitly asks.

**Goal:** Replace the single-user draftboard with a synchronized commissioner page and password-protected captain pages that use snake order as the default while allowing explicit commissioner exceptions, keep every client current through long polling, and alert a captain when their team is on the clock.

**Architecture:** Keep MongoDB as the durable source of truth across browser users, while taking advantage of the single Heroku dyno with an in-process per-draft mutation queue and long-poll notification hub. The existing Keystone-authenticated route becomes the commissioner workspace; each team gets a separate captain URL and a password-derived, signed HTTP-only session cookie. Draft mutations are validated and serialized on the server, while clients long-poll versioned state for up to about 20 seconds per request.

**Tech Stack:** KeystoneJS 5, Next.js 10 pages/API routes, React, Bootstrap/SCSS, MongoDB 3.7 native driver, Node 16 built-in `crypto`, Cypress 13, Node `assert` for pure draft-engine tests.

---

## Current Context

- The current page is `app/next/pages/leagues/[slug]/draftboard.js`. It fetches every league player server-side and lets a logged-in Keystone user add/remove players from teams.
- The current mutation endpoint is `app/next/pages/api/draftboard.js`. It directly changes Keystone's `team_players_manies` relationship collection and returns only the modified team.
- Team order already exists as `Team.draftOrder` in `app/lists/Team.js`; captains and roster players are existing relationships.
- There is no durable draft session, pick number, turn, audit log, captain credential, synchronization/version, or concurrency guard.
- The existing page keeps its own React state, so two open users immediately diverge.
- `req.user` is already available for Keystone admin authentication. Captain authentication must be separate and scoped to one draft/team.
- The GraphQL schema is public; password hashes and session secrets must not be placed in a publicly queryable Keystone list.
- The application currently runs on one Heroku dyno. Approximately 20-second long polls are safer than Heroku's request timeout, and an in-process notification hub can wake waiting requests without repeatedly querying MongoDB.
- The working tree already contains user changes in `package.json`, `package-lock.json`, `app/next/lib/stat-editor-utils.js`, and `scripts/test-stat-editor.js`. Do not overwrite or reformat them. No new npm dependency is required.

## Proposed URLs and Roles

### Commissioner/admin

`/leagues/[slug]/draftboard`

- Requires the existing Keystone `req.user` session before returning private player data.
- Creates/configures the draft, validates team order, sets or resets each team's captain password, starts/pauses/resumes/ends the draft, makes a pick for any team with the expected next team selected by default, adjusts the next team when needed, and undoes the latest pick.
- Shows all available players, all team rosters, the complete pick log, current round/direction/team, and captain-login status.
- Displays each captain URL with a copy button, but never displays a previously saved password.

### Captain

`/leagues/[slug]/draftboard/captain/[teamSlug]`

- Shows a password form until the team-specific cookie is valid.
- Once authenticated, shows that captain's roster, the available player board, draft status, current team, next teams, and pick history.
- Enables the Pick button only when this team is on the clock and the draft is active.
- Does not expose email, phone, payment, or other registration-only fields. Comments are hidden by default and can be enabled for captains by a commissioner setting.

### Optional display-only board

Do not build a third public route in the first pass. If the intended “admin-owned URL” means a projector/public display rather than the authenticated commissioner page, add a read-only tokenized board as a follow-up after confirming exactly which player fields may be shown publicly.

## Data Design

Use direct MongoDB collections, accessed only by server-side helpers, rather than Keystone lists exposed through the public GraphQL schema.

### `draft_sessions`

One document per league:

- `_id`
- `leagueId` (unique)
- `status`: `setup`, `active`, `paused`, or `completed`
- `teamOrder`: snapshot of team ObjectIds sorted by `draftOrder`
- `currentPickNumber`: zero-based position in the default snake sequence
- `nextTeamOverrideId`: optional commissioner-selected team for the next captain turn; `null` means use the team derived from the snake sequence
- `version`: monotonically increasing integer used by long polling
- `showCommentsToCaptains`: boolean, default `false`
- `createdAt`, `startedAt`, `updatedAt`, `completedAt`
- `lastMutationId` / lock metadata used for concurrency recovery

The suggested next team is derived from `currentPickNumber` and `teamOrder`. For `N` teams, position within a round is `currentPickNumber % N`; even rounds use ascending order and odd rounds use descending order. This produces `A, B, C, C, B, A` for three teams. A commissioner may override the effective next team without rewriting the underlying team order.

### `draft_captain_credentials`

- `draftSessionId`
- `leagueId`
- `teamId`
- `passwordSalt`
- `passwordHash`
- `failedAttempts`, `lockedUntil`, `lastLoginAt`, `updatedAt`
- Unique compound index on `{ draftSessionId, teamId }`

Hash passwords with Node's built-in asynchronous `crypto.scrypt`, a random per-team salt, and `timingSafeEqual`. Never log or return the hash. Keep failed-login counters in MongoDB so lockouts survive a dyno restart, even though request coordination itself is in process.

### `draft_picks`

- `draftSessionId`, `leagueId`
- `selectionNumber`: monotonically increasing for every selection, including non-advancing makeup picks
- `snakePosition`: the zero-based default-order position active when the selection was made
- `roundNumber`
- `teamId`, `playerId`
- `scheduledTeamId`: the team suggested/effective when the pick form opened
- `isCommissionerOverride`: true when the commissioner selected a different team or chose not to advance the sequence
- `advancedSequence`: whether this pick consumed the current snake position
- `overrideNote`: optional short commissioner note explaining an exception
- `selectedByRole`: `captain` or `admin`
- `selectedAt`
- `status` / mutation token for recovery if the deployment cannot use transactions
- Unique indexes on `{ draftSessionId, selectionNumber }` and `{ draftSessionId, playerId }`

The existing `team_players_manies` relationship remains the canonical roster for the rest of the site. Draft picks also provide order, auditability, undo, and protection against selecting the same player twice.

### Cookie/session token

- Require a new deployment secret named `DRAFT_SESSION_SECRET`; do not reuse or add another hard-coded secret.
- Issue a signed HMAC token containing only draft session ID, team ID, and expiration.
- Store it in an HTTP-only, `SameSite=Lax`, `Secure`-in-production site cookie. The cookie must use `Path=/` so browsers send it to `/api/draft/*`; the signed payload—not the cookie path—scopes it to one draft/team.
- Use a finite expiration (recommended: 12 hours) and provide logout.
- A valid cookie authorizes only its embedded team; request bodies cannot switch teams.

## Single-Dyno Coordination and Consistency Rules

1. Captain picks are authorized only for the effective team currently on the clock. A logged-in commissioner may assign an available player to any team as an explicit override.
2. Route all mutations for the same draft through a server-only in-process promise queue/mutex. Requests for different drafts may proceed independently.
3. Once a request owns the draft lock, re-read the session, player eligibility, league membership, current turn, expected version, and existing team association immediately before writing. Browser state is never authoritative.
4. Keep unique MongoDB indexes on session/pick number and session/player ID as defense in depth. The in-process lock is the primary concurrency mechanism for the documented single-dyno deployment.
5. Write the team relationship and pick record before advancing `currentPickNumber` and `version`. If an intermediate write fails, roll back the writes completed by that mutation before releasing the lock. Add a small reconciliation routine for recovery after a dyno crash during the write sequence.
6. Increment `version` only after the pick and roster relationship are readable, then notify the in-process long-poll hub. This prevents clients from observing a turn advance without the selected player on the roster.
7. A normal captain pick advances one snake position. A commissioner pick defaults to the effective next team and defaults to advancing one position, but the commissioner may choose another team and may uncheck “Advance draft order after this pick” for a makeup/special-consideration pick.
8. After any advancing pick, clear `nextTeamOverrideId` and derive the following team from the next snake position. The commissioner can then use “Set next team” to override that one upcoming turn without changing the saved base order.
9. Return `409 Conflict` with fresh state for stale turn, already-drafted player, duplicate submission, or version conflicts. The client replaces local state rather than guessing.
10. Undo is commissioner-only, limited to the latest completed pick, removes the exact relationship, restores the prior cursor and next-team override from the pick audit record, increments the version, and wakes long polls.
11. Existing team members/captains at draft initialization are treated as baseline roster members, excluded from the available pool, and do not consume snake-draft pick numbers.

If the application is ever scaled beyond one web dyno, replace the in-process queue/hub with distributed coordination before scaling. That future concern is explicitly outside this implementation.

## API Shape

Create a clean `/api/draft/*` namespace and remove the old `/api/draftboard` mutation only after all callers have moved.

- `GET /api/draft/state?league=<slug>` — role-filtered current state; requires commissioner or captain session.
- `GET /api/draft/poll?league=<slug>&version=<n>` — checks the durable version, then waits on the single-dyno notification hub for up to about 20 seconds. It returns fresh state when `version > n` and a small unchanged response on timeout. Subscribe before the final version re-check to avoid a read/subscribe race. Set `Cache-Control: no-store` and remove the waiter when the client disconnects.
- `POST /api/draft/login` — validates league/team/password, applies persistent throttling, sets cookie, returns captain-safe state.
- `POST /api/draft/logout` — expires the scoped captain cookie.
- `POST /api/draft/pick` — validates role, expected version, turn, and player; performs the atomic pick.
- `POST /api/draft/admin` — Keystone-admin-only setup actions: initialize, set/reset team password, start, pause, resume, complete, settings update, set/clear next-team override, flexible admin pick, and undo.

Use an action allow-list and strict validation for IDs, slugs, versions, statuses, and HTTP methods. Return normalized errors without stack traces or personal data.

## Shared State Response

Return one stable shape to both pages, filtered by role:

- `session`: status, version, pick/round/direction, suggested snake team, effective current team, any active override, next-team preview, settings
- `league`: id, slug, title
- `teams`: id, slug, name, color, draft order, role-safe roster players
- `availablePlayers`: only undrafted league players and only approved draft fields
- `picks`: ordered pick history
- `viewer`: `admin` or `captain`, plus authorized team ID for a captain

Never trust the old server-rendered `teamMap` after hydration; all post-load screens render from the normalized state.

## Long-Polling Client Behavior

- Add a reusable hook that begins a poll with the current version, replaces state when changed, and immediately starts the next poll.
- Abort the active request on unmount, logout, route change, or when a mutation begins; restart from the mutation response's version.
- Back off on network/server failures (for example 1s, 2s, 5s, capped at 10s) and show a visible “Reconnecting…” indicator.
- Resume immediately when the tab becomes visible or the browser comes back online.
- Never use rapid `setInterval` polling. The notification hub and mutation locks may be process-local, but authoritative draft state must remain in MongoDB so a dyno restart only causes clients to reconnect rather than losing the draft.

## Turn Reminder Behavior

When a captain's newly received state changes from another team to their team:

- Show a persistent, high-contrast “Your turn to pick” banner.
- Change the document title while the tab is hidden.
- Play a short local chime only after the captain has interacted with the page and enabled reminders.
- Use `navigator.vibrate` where available.
- Offer browser notifications through an explicit “Enable turn reminders” button; request permission only from that user gesture.
- Deduplicate alerts by pick number/version so reconnects and unchanged long polls do not repeat them.

This first pass reminds captains while their page/browser is open. Email, SMS, or WhatsApp reminders are intentionally out of scope until the desired channel, consent, and contact policy are specified.

---

## Implementation Tasks

### Task 1: Extract and test the snake-draft engine

**Objective:** Create deterministic pure functions for suggested snake order, effective overridden turns, rounds, advancement choices, and state transitions before adding persistence.

**Files:**
- Create: `app/next/lib/draft-engine.js`
- Create: `scripts/test-draft-engine.js`

**Steps:**
1. Write failing Node `assert` cases for zero teams, one team, three-team snake order, round and direction labels, next-team previews, a one-turn team override, a commissioner pick that advances, a makeup pick that does not advance, clearing an override, end-of-pool behavior, and restoring the exact prior cursor/override when undoing one pick.
2. Run `node scripts/test-draft-engine.js`; verify the missing module/functions fail.
3. Implement the smallest pure functions needed by the API and UI.
4. Run the script and verify all assertions pass.
5. Run `npx eslint app/next/lib/draft-engine.js scripts/test-draft-engine.js`.

### Task 2: Build server-only authentication helpers

**Objective:** Add captain password hashing, constant-time verification, signed cookies, cookie parsing, and role guards without exposing secrets to client bundles.

**Files:**
- Create: `app/next/lib/draft-auth.js`
- Create: `scripts/test-draft-auth.js`

**Steps:**
1. Write failing tests for password success/failure, different salts, tampered tokens, expired tokens, wrong-team tokens, cookie attributes, and missing `DRAFT_SESSION_SECRET`.
2. Implement asynchronous `scrypt` hashing and HMAC token helpers using Node `crypto` only.
3. Ensure tests use a temporary process secret and never print generated values.
4. Run `node scripts/test-draft-auth.js` and targeted ESLint.

### Task 3: Add the MongoDB draft repository and indexes

**Objective:** Centralize all direct MongoDB reads/writes, state projection, validation, serialized pick behavior, rollback, and crash reconciliation.

**Files:**
- Create: `app/next/lib/draft-store.js`
- Create: `scripts/test-draft-store.js` if the local test database can be safely isolated; otherwise keep repository contract tests in the API/Cypress fixture layer.

**Steps:**
1. Implement a cached Mongo connection helper and idempotent index creation for sessions, credentials, and picks.
2. Implement league/team/player lookup with strict ObjectId validation and league ownership checks.
3. Implement initialization that snapshots teams sorted by unique, non-null `draftOrder`; return actionable setup errors for missing/duplicate order or fewer than two teams.
4. Implement role-filtered state projection and explicitly allow-list player fields.
5. Implement password set/reset and persistent failed-login throttling.
6. Implement a per-draft in-process mutation queue and use it for captain picks, flexible commissioner picks, next-team override changes, and latest-pick undo.
7. Add rollback for intermediate failures and reconciliation for a dyno restart during a partially completed mutation.
8. Verify against an isolated local database only; never run destructive tests against production or restored user data.

### Task 4: Add API contract tests and route handlers

**Objective:** Expose a small, validated API for state, long polling, login/logout, picks, and commissioner controls.

**Files:**
- Create: `app/next/pages/api/draft/state.js`
- Create: `app/next/pages/api/draft/poll.js`
- Create: `app/next/pages/api/draft/login.js`
- Create: `app/next/pages/api/draft/logout.js`
- Create: `app/next/pages/api/draft/pick.js`
- Create: `app/next/pages/api/draft/admin.js`
- Delete after migration: `app/next/pages/api/draftboard.js`
- Create: `cypress/e2e/draftboard-api.cy.js`

**Steps:**
1. Add Cypress/API cases for unauthorized access, wrong HTTP methods, bad slug/ID/version, wrong password, throttled login, wrong-team captain pick, duplicate player race, stale version, successful snake progression, commissioner selection defaulting to the next team, commissioner reassignment to another team, a non-advancing makeup pick, set/clear next-team override, long-poll timeout/change, pause, and admin-only undo.
2. Implement shared method/error handling rather than duplicating it across routes.
3. Ensure commissioner checks use `req.user`; captain checks use only the signed team cookie.
4. Add the process-local notification hub, race-free subscribe/re-check behavior, disconnect cleanup, and a sub-Heroku-timeout deadline to `poll.js`.
5. Verify no response includes hashes, salts, tokens, emails, phone numbers, or server errors.

### Task 5: Build shared draft UI components and polling hook

**Objective:** Provide one responsive UI foundation used by commissioner and captain views.

**Files:**
- Create: `app/next/components/draftboard/DraftStatus.js`
- Create: `app/next/components/draftboard/DraftPlayerBoard.js`
- Create: `app/next/components/draftboard/DraftTeamRoster.js`
- Create: `app/next/components/draftboard/DraftPickHistory.js`
- Create: `app/next/components/draftboard/useDraftState.js`
- Create: `app/next/components/draftboard/useTurnReminder.js`
- Modify: `app/next/public/styles/site/_layout.scss`

**Steps:**
1. Build Bootstrap-based responsive components with accessible tables/cards, clear disabled states, visible focus, team color used as an accent rather than the sole status signal, and mobile layouts.
2. Implement long polling with AbortController, reconnect backoff, visibility/online recovery, and server-state replacement.
3. Implement deduplicated banner/title/chime/vibration/browser notification reminders with an explicit enable control.
4. Add component-level selectors/data attributes needed for stable Cypress tests.
5. Run targeted ESLint.

### Task 6: Replace the commissioner page

**Objective:** Turn the existing draftboard URL into a strictly authenticated commissioner workspace.

**Files:**
- Rewrite locally: `app/next/pages/leagues/[slug]/draftboard.js`

**Steps:**
1. Add server-side authentication enforcement before querying or returning any private player information; redirect unauthenticated users to the existing admin sign-in flow with a return target, or return a clear 401 page if Keystone cannot safely preserve the return URL.
2. Load the normalized initial state through the server-only store rather than duplicating mapping logic in the page.
3. Add setup validation, captain URL/password controls, start/pause/resume/complete controls, available-player board, all rosters, turn display, pick history, flexible admin pick, set-next-team control, and last-pick undo.
4. In the admin pick form, preselect the effective next team, check “Advance draft order after this pick” by default, allow any team to be selected, and show an optional override-note field when the team or advancement behavior differs from the default.
5. Require explicit confirmation for reset/complete/undo operations and for commissioner overrides that differ from the default; disable duplicate submissions.
6. Replace local speculative roster changes with API response state.
7. Preserve useful sorting/filtering from the old page, but ensure filters operate on the latest synchronized state.

### Task 7: Add the password-protected captain page

**Objective:** Give each team a scoped page that can authenticate, monitor the draft, and pick only on its own turn.

**Files:**
- Create: `app/next/pages/leagues/[slug]/draftboard/captain/[teamSlug].js`

**Steps:**
1. Server-render only non-sensitive league/team identity until a cookie is validated.
2. Add password login, generic error messages, lockout feedback without account enumeration, and logout.
3. After authentication, render team roster, available players, current/next turn, history, and reminder controls.
4. Enable Pick only for the authenticated current team while active; show a confirmation containing player and team names.
5. Handle `409` by replacing state and explaining that the board changed rather than leaving a stale selection.
6. Confirm direct navigation to another team slug does not grant that team's data or actions.

### Task 8: Add end-to-end multi-user coverage

**Objective:** Prove two captains and one commissioner remain synchronized and cannot violate order.

**Files:**
- Create: `cypress/e2e/draftboard.cy.js`
- Modify only if necessary: `cypress/plugins/index.js`

**Steps:**
1. Seed a dedicated test league with at least three ordered teams and several synthetic players through a safe test-only task/fixture.
2. Use isolated browser sessions/cookie jars for commissioner, Captain A, and Captain B.
3. Verify A picks, all views update, B is alerted/enabled, and A is disabled.
4. Verify the snake turn sequence includes the same end team twice at the round boundary.
5. From the commissioner view, verify the pick form defaults to the effective next team, then assign a pick to a different team and confirm the sequence advances normally.
6. Make a non-advancing makeup pick and confirm the same scheduled position remains next; set a one-turn next-team override and confirm only that team's captain is enabled/notified.
7. Race two captain picks and verify only one succeeds and no player/team association is duplicated.
8. Verify pause blocks captain picks, resume restores the same turn, undo restores the exact prior cursor/override and removes the latest roster player on all clients, and reload preserves state.
9. Verify comments and contact fields do not leak to captain responses or rendered HTML.
10. Clean up only the dedicated synthetic test records.

### Task 9: Final validation and operational setup

**Objective:** Verify the complete feature and document the one required deployment secret.

**Files:**
- Modify if this repo has an environment-variable template or deployment documentation; never modify `.env` or place a real secret in source.
- Update `app/schema.graphql` only if implementation changes Keystone fields (the direct-collection design should not require it).

**Steps:**
1. Configure `DRAFT_SESSION_SECRET` locally and in Heroku through the appropriate secret manager; generate it outside logs.
2. Verify production is still configured for one web dyno. Document that scaling out requires replacing the process-local queue and notification hub.
3. Run `node scripts/test-draft-engine.js`.
4. Run `node scripts/test-draft-auth.js`.
5. Run any isolated draft-store contract test.
6. Start the app with the repository's required Node/npm versions and run the two draftboard Cypress specs.
7. Run `npm run lint`.
8. Run `npm run build`.
9. Manually verify in isolated/Guest browser contexts: admin setup, three captain turns including the snake reversal, reminders, reconnect behavior, reload persistence, pause/resume, undo, logout, mobile width, and no private fields in network responses.
10. Review `git diff` and `git status`; ensure no `.env`, database dump, generated user data, credentials, unrelated package changes, `it.only`, or `describe.only` are included.

---

## Acceptance Criteria

- An unauthenticated visitor cannot view the commissioner draftboard or its player data.
- Each captain URL requires a password and grants access only to one league/team.
- Captain credentials are salted/hashed; session cookies are HTTP-only, signed, scoped, expiring, and secure in production.
- All clients converge on MongoDB state without manual refresh, including after page reload or a single dyno restart/replacement.
- The server—not the browser—enforces captain turns and prevents stale and duplicate picks, while commissioners can explicitly override the suggested snake team or make a non-advancing makeup pick.
- Two simultaneous attempts cannot draft one player twice or advance the turn twice.
- The selected player appears on the correct roster before clients observe the next turn.
- Captains get a deduplicated visible reminder, and optional browser/audio/device reminders, when their turn begins.
- The commissioner can initialize, set/reset passwords, start, pause, resume, finish, pick for any team with the next team selected by default, choose whether that pick advances the sequence, set the next team, and undo the latest pick.
- Existing roster members are excluded from available players and remain intact.
- Captain/API payloads do not expose contact, payment, credential, or unapproved comment data.
- Draft engine/auth tests, Cypress synchronization/security coverage, full lint, and production build pass.

## Risks and Tradeoffs

- **Single-dyno assumption:** The process-local mutation queue and notification hub are intentionally designed for the current one-web-dyno deployment. Scaling horizontally without replacing them would reintroduce cross-process races and missed wake-ups.
- **Heroku long polling:** Every connected page holds a recurring request. This is acceptable for a small live draft, but a future scale increase may justify Server-Sent Events or a hosted pub/sub service. Durable versioned state ensures a dyno restart is recoverable.
- **Browser reminders:** Audio, vibration, and Notifications are permission/platform dependent. The in-page banner is the guaranteed reminder; off-browser messaging is not included.
- **Password sharing:** One team password means all captains on that team share access. Per-person accounts would require a different identity model.
- **Private draft notes:** Player comments can contain sensitive content. They remain admin-only unless the commissioner explicitly enables them for captains.
- **Existing relationship collection:** Directly using Keystone's `team_players_manies` is already established here but is adapter-specific. Encapsulating it in `draft-store.js` limits this coupling.
- **Scope:** The existing file contains extensive analytics tables. The first implementation should preserve commissioner access to useful analytics but should not send those details to captains unless explicitly approved.

## Decisions Needed Before Coding

The plan uses conservative defaults, but these product decisions should be confirmed before implementation:

1. Does “admin-owned URL” mean the authenticated commissioner workspace described above, or should there also be a tokenized read-only projector/public board?
2. Should captains see player comments, or should comments remain admin-only? Recommended default: admin-only.
3. Is one shared password per team acceptable, or does each captain need an individual login? Recommended first pass: one password per team.
4. Should reminders only operate while the captain page/browser is open, or must there be WhatsApp/email/SMS delivery? Recommended first pass: page/browser reminders only.
5. Are captains already present in `Team.players`, or only in `Team.captains`? Recommended behavior: treat both relationships as baseline roster membership and never make a captain draftable.
