# Backend Configuration

Nexori uses `backend-matchmaking.json` for backend sync and result reporting.

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
  "resultRetryIntervalMs": 5000
}
```

## Fields

- `syncEnabled`: enables matchmaking sync heartbeat with `POST /nexori/sync`.
- `resultReportingEnabled`: enables result reporting with `POST /nexori/results`.
- `baseUrl`: backend HTTP origin, for example `http://127.0.0.1:8000`.
- `serverToken`: Bearer token sent in the `Authorization` header.
- `syncIntervalMs`: global server heartbeat interval for `POST /nexori/sync`.
- `resultRetryIntervalMs`: retry delay for failed result reports.

Arena servers can use `syncEnabled=false` and `resultReportingEnabled=true`.

## Sync vs Results

`POST /nexori/sync` is a heartbeat. When backend sync is enabled, each server process sends at most one sync request per `syncIntervalMs`. For example, `10000` means one sync attempt about every 10 seconds, not once per player, queue, arena, or tick.

`POST /nexori/results` is event-driven. It is not a heartbeat. It is sent when a match has a final result to report, usually once per completed match.

For Nexori built-in minigames or built-in resolution flows, Nexori can submit the final result automatically when the match ends, as long as `resultReportingEnabled=true` and `baseUrl`/`serverToken` are configured.

For third-party rules mods, the mod completes the match through the public Minigame API. If the minigame has custom stats, it should collect them during gameplay and pass them as `customData` when calling `submitFinalMatchResult(...)`.
