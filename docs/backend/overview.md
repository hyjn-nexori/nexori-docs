# Backend Overview

Nexori can run standalone with local queues and no external backend. In that mode, the plugin owns queueing, match launch, local completion, and player returns inside the server setup.

Nexori can also integrate with an external backend. In that mode, Nexori still owns the in-server runtime, but your backend can receive queue/match visibility, return matchmaking assignments, receive final results, and track whether running matches are still open for backfill.

## Endpoint Map

<div class="endpoint-grid">
  <section class="endpoint-card">
    <h3><code>/nexori/sync</code></h3>
    <dl>
      <dt>Config flag</dt>
      <dd><code>syncEnabled</code></dd>
      <dt>Typical server</dt>
      <dd>lobby/queue server</dd>
      <dt>Trigger</dt>
      <dd>heartbeat interval</dd>
      <dt>Purpose</dt>
      <dd>backend-driven matchmaking assignments</dd>
    </dl>
  </section>
  <section class="endpoint-card">
    <h3><code>/nexori/results</code></h3>
    <dl>
      <dt>Config flag</dt>
      <dd><code>resultReportingEnabled</code></dd>
      <dt>Typical server</dt>
      <dd>arena/minigame server</dd>
      <dt>Trigger</dt>
      <dd>final match result</dd>
      <dt>Purpose</dt>
      <dd>final result reporting</dd>
    </dl>
  </section>
  <section class="endpoint-card">
    <h3><code>/nexori/matches/state</code></h3>
    <dl>
      <dt>Config flag</dt>
      <dd><code>matchStateReportingEnabled</code></dd>
      <dt>Typical server</dt>
      <dd>arena/minigame server</dd>
      <dt>Trigger</dt>
      <dd>match admission state changes</dd>
      <dt>Purpose</dt>
      <dd>backend backfill visibility</dd>
    </dl>
  </section>
</div>

## Recommended Multi-Server Split

Lobby/queue servers usually enable `syncEnabled=true` so the backend can see queued players and return `INITIAL_MATCH` or `BACKFILL` assignments. Arena/minigame servers usually keep `syncEnabled=false`, enable `resultReportingEnabled=true` for final result reports, and enable `matchStateReportingEnabled=true` when the backend needs open-match visibility for backfill.

For cross-server backfill, the arena publishes match admission visibility through `/nexori/matches/state`; later, a lobby sync request exposes a queued player; then the backend returns a `BACKFILL` assignment through `/nexori/sync` to the lobby server, using `targetConnectionAddress` from the arena state payload.

### Shared Queue And Game IDs Across Lobbies

When several lobby servers should feed the same backend-managed queue, their portals must point to the same shared queue/game definitions. The backend groups waiting players by the `queueId` and related game definition each lobby sends through `POST /nexori/sync`.

Do not manually recreate an identical-looking game or queue on every lobby server. Those copies will have different internal ids, so the backend will treat them as different queues even if their names and settings look the same.

Create the game/queue once, then use Nexori's in-game `Minigames > Sync` / `Catalog Sync` tab to copy the saved game or saved queue to the other lobby servers. Catalog Sync preserves the ids that matter for backend matchmaking, so players entering portals on different lobbies can still be reported through `POST /nexori/sync` as waiting for the same queue/game.

Catalog Sync is an admin replication tool, not the same thing as the backend `POST /nexori/sync` endpoint. Catalog Sync copies the selected saved game or queue definition; it does not copy portals, spawns, backend config, local server identity, or local UI state.

## How The Endpoints Relate

### `POST /nexori/sync`

`/nexori/sync` is a server heartbeat for backend-driven matchmaking. Nexori sends queue, arena, active-match, and assignment-ack snapshots, then your backend may return assignments for Nexori to launch.

See [Sync Endpoint](/backend/sync-endpoint) for the request and response payloads.

### `POST /nexori/results`

`/nexori/results` is event-driven result reporting. Nexori sends it after a match is completed locally and a backend result report is queued.

See [Results Endpoint](/backend/results-endpoint) for the result contract.

### `POST /nexori/matches/state`

`/nexori/matches/state` is event-driven admission visibility reporting. Nexori sends it when a backend-driven match changes whether it can still accept future admission or backfill.

See [Match Admission State Endpoint](/backend/match-admission-state-endpoint) for the admission-state snapshot contract.

## Common Setups

| Setup | Recommended flags |
| --- | --- |
| Standalone/local queues | leave backend flags disabled |
| Backend matchmaking lobby | `syncEnabled=true` |
| Arena result reporting only | `syncEnabled=false`, `resultReportingEnabled=true` |
| Backend backfill arena | `matchStateReportingEnabled=true` |

Arena servers can combine result reporting and match-state reporting without running the matchmaking sync heartbeat.
