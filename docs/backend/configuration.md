# Backend Configuration

Nexori uses `backend-matchmaking.json` for backend sync and result reporting.

```json
{
  "schemaVersion": 1,
  "enabled": false,
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

- `enabled`: enables matchmaking sync with `POST /nexori/sync`.
- `resultReportingEnabled`: enables result reporting with `POST /nexori/results`.
- `baseUrl`: backend HTTP origin, for example `http://127.0.0.1:8000`.
- `serverToken`: Bearer token sent in the `Authorization` header.
- `syncIntervalMs`: global server sync throttle.
- `resultRetryIntervalMs`: retry delay for failed result reports.

Arena servers can use `enabled=false` and `resultReportingEnabled=true`.

