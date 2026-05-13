# Backend Configuration

Nexori uses `backend-matchmaking.json` for backend sync, result reporting, and match admission state reporting.

::: tip Use The In-Game UI
You normally do not need to edit this file by hand. Nexori Menu V2 includes a `Backend` view where you can edit these fields, save the config, and inspect request health from the terminal tab.
:::

![Nexori backend configuration UI](/images/backend-matchmaking-ui.png)

```json
{
  "schemaVersion": 1,
  "syncEnabled": false,
  "baseUrl": "http://127.0.0.1:8000",
  "serverToken": "dev-nexori-token",
  "syncIntervalMs": 10000,
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

- `syncEnabled`: enables matchmaking sync heartbeat with `POST /nexori/sync`.
- `resultReportingEnabled`: enables result reporting with `POST /nexori/results`.
- `matchStateReportingEnabled`: enables match admission visibility reporting with `POST /nexori/matches/state`.
- `baseUrl`: backend HTTP origin, for example `http://127.0.0.1:8000`.
- `serverToken`: Bearer token sent in the `Authorization` header.
- `syncIntervalMs`: global server heartbeat interval for `POST /nexori/sync`.
- `resultRetryIntervalMs`: retry delay for failed result reports.
- `matchStateDebounceMs`: debounce delay before flushing admission state changes.
- `matchStateMaxCoalesceWindowMs`: maximum window for merging several admission changes into one snapshot.
- `matchStateRetryIntervalMs`: retry delay for failed admission-state reports.
- `matchStateStaleAfterMs`: snapshot freshness window for admission-state reporting.

Arena servers can use `syncEnabled=false` and `resultReportingEnabled=true`.

## Sync vs Results vs Admission State

`POST /nexori/sync` is a heartbeat. When backend sync is enabled, each server process sends at most one sync request per `syncIntervalMs`. For example, `10000` means one sync attempt about every 10 seconds, not once per player, queue, arena, or tick.

`POST /nexori/results` is event-driven. It is not a heartbeat. It is sent when a match has a final result to report, usually once per completed match.

`POST /nexori/matches/state` is also event-driven. It is sent when Nexori wants the backend to see admission visibility changes for one backend-driven match, such as open admission, reservation consumption, admission closure, or backfill window expiry.

For Nexori built-in minigames or built-in resolution flows, Nexori can submit the final result automatically when the match ends, as long as `resultReportingEnabled=true` and `baseUrl`/`serverToken` are configured.

For third-party rules mods, the mod completes the match through the public Minigame API. If the minigame has custom stats, it should collect them during gameplay and pass them as `customData` when calling `submitFinalMatchResult(...)`.

For backend-driven backfill, arena servers can use `matchStateReportingEnabled=true` so the backend can see whether running matches are still eligible for additional players.
