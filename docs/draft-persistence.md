# Draft persistence and local verification

## Storage and access

`DraftSession`, `DraftPick`, `DraftCaptainCredential`, and `DraftEvent` are registered Keystone 5 lists. The server uses `global.sflKeystone`, normal list CRUD with a sudo context, and `server-graphql-client` for roster/registration relationship reads. Team assignments use Keystone `players.connect` / `players.disconnect`; application code never writes Keystone join collections.

All four lists allow authenticated User administrators to inspect records in Keystone, but deny direct create/update/delete access. Anonymous reads are denied, including in development. Credential salt/hash fields also deny field access. Only authorized draft API handlers should call the store's commissioner helpers. A captain identity is checked against both draft session and team before state access or picking. The store's internal sudo context is not a browser-facing authorization mechanism.

## Login

Captains use the existing Keystone Express session cookie, with a separate `draftCaptain` identity; they are not Keystone User administrators. Login rotates the session ID, saves it before responding, and retains an existing commissioner login. Captain access expires after 12 hours. The cookie is HttpOnly, SameSite=Lax, and retains Keystone's production Secure policy. There is no extra `DRAFT_SESSION_SECRET` or custom signed-token cookie to configure. Previous custom-cookie sessions must sign in again.

Sessions use the application's existing Keystone session store. With its current default in-memory store, restarting the server signs users out, and multiple web instances would require a shared session store. This revision does not introduce deployment infrastructure.

## Existing drafts: no data migration required

The lists explicitly bind to the existing `draft_sessions`, `draft_picks`, `draft_captain_credentials`, and `draft_events` collections. IDs, foreign-key field names, password hashes, picks, events and counters are retained. Date fields use Keystone `DateTimeUtc`, which preserves the original single BSON Date storage; `DateTime` would use different offset/UTC fields and is deliberately not used here.

New sessions store their immutable ordered team-ID snapshot in the list's `orderJson` text field. Old sessions retain their original BSON `teamOrder` array. A narrowly scoped read through Keystone's existing Mongoose model retrieves this legacy array, because Keystone projects only registered fields. No startup backfill, renaming, copying, deletion or credential reset is performed. The ordered snapshot is not a many-relationship because Keystone many-relationships do not define a stable draft order.

Keystone initializes the declared indexes on connection. Existing drafts already had the same four uniqueness guarantees: one session per league, one credential per draft/team, one pick per draft/player, and one pick per draft/selection number. Duplicates that violate these indexes must be investigated before rollout; nothing automatically deletes or merges them. Deploy/restart the Keystone server through the normal deployment process so the new list registry and indexes are loaded. Do not run old and new draft writers simultaneously: old workers do not respect the new operation claim.

Compatibility is covered using disposable synthetic records, including the original BSON team-order format. No production or restored real dataset was migrated or modified in verification. Historical corruption, missing relationship targets, or duplicate legacy records are not repaired by this change.

## Concurrency and failure recovery

A per-session database compare-and-set claim (`operationToken`) protects pick, undo, commissioner updates and credential changes across Node processes. Only claim/release use direct Mongoose writes, on Keystone's existing model/connection; normal CRUD remains Keystone-managed. A process-local mutex merely reduces contention. The unique pick indexes remain an independent safety net. Version checks occur after acquiring the claim.

The deployment supports standalone MongoDB; this is **not a multi-document transaction**. A mutation or process failure can leave a partial operation. Once pick/undo writes begin, write failures retain the claim rather than deleting possibly committed picks or silently continuing. State reads also refuse a claimed draft, so partial draft state is not served as a completed action. Claims deliberately have no timeout: expiring a lease could let a delayed original worker mutate concurrently with its replacement.

Recovery is manual and requires an operator:

1. Stop/disable writers for the affected draft and establish that the claiming worker is no longer running. Do not blindly clear a busy claim.
2. Back up the affected session, picks, events and team roster relationships. Inspect the last operation against the session version, selection count, snake position, override and actual roster.
3. Reconcile that one operation using Keystone relationships/CRUD. Prefer completing a committed pick and advancing its session once; preserve the audit trail. For an interrupted undo, inspect both the removed pick and the undo event before deciding how to restore the cursor. Selection count remains a monotonic audit number, including after undo.
4. Only after confirming coherence, clear that session's exact observed `operationToken` with a conditional update, then read state and verify roster/counters before reopening writes.

There is intentionally no automatic recovery script that guesses the correct outcome. External commissioner changes to Team/Player relationships outside draft endpoints are not serialized by the draft claim; avoid manual roster edits while a draft is active.

## Tests

Use a supported Node runtime (Node 16.20.2 is available locally at `/usr/local/bin/node`):

```sh
node scripts/test-draft-store.js
node scripts/test-draft-integration.js
```

The integration script does not load `.env` and never targets the application database. It creates a random `draft_test_<random>` database on `127.0.0.1:27017`, registers the actual lists, and creates/removes only fixture records through Keystone. It verifies relationship assignment/removal, duplicate team slugs across leagues, captain authorization/privacy, legacy order compatibility, competing picks from two independent Node processes, commissioner overrides, undo and fail-closed behavior after an injected audit-write failure. Cleanup verifies that all fixture lists contain no remaining records. Empty database/collection metadata is not dropped.

## Live browser fixture

The fixture does not infer its target from `.env`. Run the app against an isolated local `draft_browser_*` database and explicitly provide its exact resolved URI. Other database names are refused because this fixture creates a test commissioner account as well as a league. Existing matching leagues are never overwritten; cleanup uses exact IDs in the ownership manifest, never a broad slug.

```sh
DRAFT_FIXTURE_MONGO_URI=mongodb://127.0.0.1:27017/draft_browser_test \
  DRAFT_FIXTURE_MANIFEST=/path/to/scratch/draft-browser-fixture.json \
  node scripts/draft-browser-fixture.js seed

# Run HTTP/Cypress tests against the app using that database.

DRAFT_FIXTURE_MONGO_URI=mongodb://127.0.0.1:27017/draft_browser_test \
  DRAFT_FIXTURE_MANIFEST=/path/to/scratch/draft-browser-fixture.json \
  node scripts/draft-browser-fixture.js cleanup
```

Fixture-only commissioner: `draft-commissioner@example.invalid` / `draft-commissioner-password`. Run `cypress run --spec cypress/e2e/draftboard.cy.js --config baseUrl=http://localhost:3001` against the isolated app to verify captain and commissioner flows.

Default fixture league: `draft-browser-test`; teams: `draft-browser-team-a` and `draft-browser-team-b`; fixture-only password: `draft-browser-password`. `DRAFT_FIXTURE_SLUG` can change the league slug. The manifest contains exact created IDs and a target hash, no database credentials. It must be retained until cleanup. Cleanup verifies its database/league ownership and removes only those IDs through Keystone. The fixture cannot remove pre-existing fixtures created by the former raw-Mongo script without their ownership manifest; do not use broad deletion as a workaround.
