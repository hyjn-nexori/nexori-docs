# Backend Configuration

Nexori uses `backend-matchmaking.json` for backend sync, result reporting, and match admission state reporting.

The file is stored under the plugin data config directory as `config/backend-matchmaking.json`.

::: tip In-Game Configuration
Open `Nexori Menu V2`, go to `Backend`, and use the `Config` tab to edit backend settings. Use the `Terminal` tab to inspect backend request health/status while testing.
:::

```json
{
  "schemaVersion": 1,
  "syncEnabled": false,
  "baseUrl": "http://127.0.0.1:8000",
  "serverToken": "dev-nexori-token",
  "syncIntervalMs": 1000,
  "region": "local",
  "requestTimeoutMs": 3000,
  "resultReportingEnabled": false,
  "resultRetryIntervalMs": 5000,
  "matchStateReportingEnabled": false,
  "matchStateDebounceMs": 1000,
  "matchStateMaxCoalesceWindowMs": 5000,
  "matchStateRetryIntervalMs": 3000,
  "matchStateStaleAfterMs": 30000
}
```

## Fields

All operational backend fields are exposed in the `Backend` config UI. `schemaVersion` is file-managed and normally should not be edited by hand.

| Field | UI exposed? | Purpose | Notes |
| --- | --- | --- | --- |
| `schemaVersion` | No, file-managed | Config schema version. | Current value is `1`. Nexori writes this when the file is created or normalized. |
| `syncEnabled` | Yes | Enables the lobby/queue server heartbeat to `POST /nexori/sync`. | Usually enabled on lobby/queue servers for backend-driven matchmaking. Arena/minigame servers usually keep this disabled. |
| `baseUrl` | Yes | Backend HTTP origin shared by backend endpoints. | Nexori derives `/nexori/sync`, `/nexori/results`, and `/nexori/matches/state` from this base URL. |
| `serverToken` | Yes | Bearer token sent in the `Authorization` header. | Existing tokens are masked in the UI. Leaving the token input blank keeps the current token. |
| `syncIntervalMs` | Yes | Global throttle for `POST /nexori/sync`. | Default is `1000`. One server process sends at most one sync attempt per interval. |
| `region` | Yes | Optional backend grouping/filtering value. | Sent as a routing hint in sync payloads. Use blank if your backend does not need regions. |
| `requestTimeoutMs` | Yes | HTTP timeout for backend requests. | Default is `3000`. Applies to backend HTTP calls before Nexori marks the attempt failed/timed out. |
| `resultReportingEnabled` | Yes | Enables arena/minigame server final result reporting to `POST /nexori/results`. | Can be enabled while `syncEnabled=false`. |
| `resultRetryIntervalMs` | Yes | Retry delay for failed result reports. | Default is `5000`. Controls retry timing for pending `/nexori/results` reports. |
| `matchStateReportingEnabled` | Yes | Enables arena/minigame server admission/backfill visibility reporting to `POST /nexori/matches/state`. | Used when the backend needs to track open running matches for backfill. Can be enabled while `syncEnabled=false`. |
| `matchStateDebounceMs` | Yes | Debounce delay before sending dirty admission state snapshots. | Default is `1000`. Helps merge quick match-state changes before reporting. |
| `matchStateMaxCoalesceWindowMs` | Yes | Maximum time to coalesce admission state changes before forcing a send. | Default is `5000`. Nexori normalizes invalid values so the max window is not below the debounce delay. |
| `matchStateRetryIntervalMs` | Yes | Retry delay for failed admission-state reports. | Default is `3000`. Controls retry timing for `/nexori/matches/state`. |
| `matchStateStaleAfterMs` | Yes | Freshness window for admission-state snapshots. | Default is `30000`. Backends should ignore stale open-match state after this window. |

Arena/minigame servers can usually keep `syncEnabled=false`. Enable `resultReportingEnabled=true` for final result reports, and enable `matchStateReportingEnabled=true` when backend backfill needs visibility into matches running on that server.

## UI vs File

Use the UI for normal editing. It writes `config/backend-matchmaking.json` and applies the updated config to the live backend services.

Edit the file directly only when you need to automate server setup or change `schemaVersion` during a future migration. Older or unknown keys are ignored when the config is loaded and are not written back when Nexori saves the normalized file.

## Endpoint Pages

- [Backend Overview](/backend/overview) explains when to enable each endpoint.
- [Sync Endpoint](/backend/sync-endpoint) documents `POST /nexori/sync`.
- [Results Endpoint](/backend/results-endpoint) documents `POST /nexori/results`.
- [Match Admission State Endpoint](/backend/match-admission-state-endpoint) documents `POST /nexori/matches/state`.

For third-party rules mods, the mod completes the match through the public Minigame API. If the minigame has custom stats, it should collect them during gameplay and pass them as `customData` when calling `submitFinalMatchResult(...)`.
