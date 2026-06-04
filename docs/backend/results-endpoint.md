# Results Endpoint

`POST /nexori/results` is Nexori's event-driven match result report endpoint.

It is not a heartbeat. Nexori sends it when a match has a final result to report.

This endpoint is used for backend result reporting, not matchmaking. An arena server can send results with `resultReportingEnabled=true` even when `syncEnabled=false`.

## When Nexori Calls It

Nexori calls this endpoint when:

- `resultReportingEnabled=true`
- `baseUrl` and `serverToken` are configured
- a match has been completed locally
- the match has an `externalMatchId`
- Nexori has a pending result report due for sending
- no previous result request is still in flight

For third-party rules/minigame mods, the mod should use the public Minigame API:

1. collect mode-specific stats during the match
2. call `setPlayerOutcome(...)` as players win, lose, or disconnect
3. call `submitFinalMatchResult(...)` when the final result is ready
4. pass custom stats as `customData`

Nexori validates and stores the final result, then sends it here if backend result reporting is enabled.

```http
POST <baseUrl>/nexori/results
Authorization: Bearer <serverToken>
Content-Type: application/json
X-Nexori-Server-Id: <serverId>
X-Nexori-Result-Id: <resultId>
X-Nexori-Sent-At-Epoch-Ms: <sentAtEpochMs>
```

## Required Headers

| Header | Required | Source | Description |
| --- | --- | --- | --- |
| `Authorization` | Yes | Nexori config | Must be `Bearer <serverToken>`. Your backend should reject missing or invalid tokens. |
| `Content-Type` | Yes | Nexori | Always `application/json`. |
| `X-Nexori-Server-Id` | Yes | Nexori server identity | Same value as body `serverId`. |
| `X-Nexori-Result-Id` | Yes | Nexori result store | Same value as body `resultId`. |
| `X-Nexori-Sent-At-Epoch-Ms` | Yes | Nexori | Same value as body `sentAtEpochMs`. Unix epoch milliseconds. |

Your backend should validate that trace headers match the body so request logs, idempotency checks, and debugging all refer to the same result report.

## Request Payload

```json
{
  "schemaVersion": 1,
  "resultId": "result-9ffb58dc-8ff6-45b5-8d2f-e6e9dfc59697",
  "sentAtEpochMs": 1760000000000,
  "serverId": "arena-server-id",
  "localMatchId": "nexori-match-001",
  "externalMatchId": "backend-match-001",
  "assignmentId": "assign-001",
  "assignmentIdsByPlayerUuid": {
    "11111111-1111-1111-1111-111111111111": "assign-na-001",
    "22222222-2222-2222-2222-222222222222": "assign-eu-001"
  },
  "queueId": "capture_zone_queue",
  "arenaId": "capture_zone_arena",
  "rulesEngineId": "capture_the_zone",
  "players": [
    {
      "playerUuid": "11111111-1111-1111-1111-111111111111",
      "outcome": "WIN",
      "reason": "zone_captured"
    },
    {
      "playerUuid": "22222222-2222-2222-2222-222222222222",
      "outcome": "LOSS",
      "reason": "opponent_captured_zone"
    }
  ],
  "reason": "rules_mod_completed",
  "metadata": {},
  "customData": {
    "mode": "capture_the_zone",
    "captureDurationSeconds": 60,
    "playerCaptureProgress": {
      "11111111-1111-1111-1111-111111111111": {
        "progressSeconds": 60.0,
        "progressPercent": 100.0
      },
      "22222222-2222-2222-2222-222222222222": {
        "progressSeconds": 18.4,
        "progressPercent": 30.6
      }
    }
  },
  "endedAtEpochMs": 1760000060000
}
```

## Request Fields

| Field | Type / Required | Source | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer / Yes | Nexori | Payload schema version. Current value is `1`. |
| `resultId` | string / Yes | Nexori result store | Idempotency key for this result report. Also sent in `X-Nexori-Result-Id`. |
| `sentAtEpochMs` | integer / Yes | Nexori result reporting service | Time this HTTP attempt was created, in Unix epoch milliseconds. |
| `serverId` | string / Yes | Nexori server identity | Server id of the arena server sending the result. |
| `localMatchId` | string / Yes | Nexori match runtime | Nexori-owned local/runtime match id. Together with `externalMatchId`, this is the real match identity for backend reconciliation. |
| `externalMatchId` | string / Yes | Backend assignment | Backend-owned match id from the original assignment. Required for result reporting. Together with `localMatchId`, this is the real match identity for backend reconciliation. |
| `assignmentId` | string / Yes | Backend assignment | Legacy/best-effort assignment id. In multi-lobby flows this may reflect only one contributing lobby assignment, so it should not be treated as the sole identity of the match. Can be blank for non-assignment flows. |
| `assignmentIdsByPlayerUuid` | object / No | Nexori launch metadata | Optional map of `playerUuid -> assignmentId` showing which assignment launched each player in multi-lobby flows. |
| `queueId` | string / Yes | Nexori match runtime | Queue that launched the match. |
| `arenaId` | string / Yes | Nexori match runtime | Arena/game where the match ran. |
| `rulesEngineId` | string / Yes | Nexori arena/game config | Rules engine id that controlled the match. Blank if none was configured. |
| `players` | array / Yes | Nexori match runtime and rules mod outcomes | Final player outcomes for required result players. |
| `reason` | string / Yes | Rules mod or Nexori completion flow | General result reason, such as `rules_mod_completed` or `last_player_alive`. |
| `metadata` | object / Yes | Nexori legacy result metadata | Legacy flat metadata map. Prefer `customData` for mode-specific stats. |
| `customData` | object / Yes | Minigame/rules mod | Custom JSON data owned by the minigame mod. Nexori validates and forwards it but does not interpret it. |
| `endedAtEpochMs` | integer / Yes | Nexori match runtime | Time the match was completed locally. |

## `players[]` Fields

| Field | Type / Required | Source | Description |
| --- | --- | --- | --- |
| `playerUuid` | string UUID / Yes | Nexori match runtime | Player UUID. |
| `outcome` | string enum / Yes | Rules mod or Nexori resolution flow | `WIN`, `LOSS`, `DISCONNECTED`, or `NO_CONTEST`. |
| `reason` | string / Yes | Rules mod or Nexori resolution flow | Per-player reason, such as `fell_into_void`, `zone_captured`, or `disconnect`. |

## Assignment Identity Notes

In single-lobby backend-driven matches, `assignmentId` is usually enough as a convenient trace field.

In multi-lobby matches, there may be one assignment per contributing lobby or per instruction. In that case:

- `localMatchId` + `externalMatchId` is the real match identity
- `assignmentId` is legacy/best-effort
- `assignmentIdsByPlayerUuid` tells your backend which assignment launched each player when that metadata is available

`assignmentIdsByPlayerUuid` is launch metadata, not competitive result data.

## Outcome Values

| Outcome | Meaning |
| --- | --- |
| `WIN` | Player won the match or was part of the winning side. Multiple winners are allowed in the payload. |
| `LOSS` | Player lost the match. |
| `DISCONNECTED` | Player disconnected and the rules mod/Nexori completion flow reported that state. Backend can apply its own penalty policy. |
| `NO_CONTEST` | Player was included in a cancelled or no-contest match result without being marked as a winner, loser, or disconnect. |

`DRAW` is not part of this result contract yet.

Normal final results require at least one `WIN`. A full no-contest result is valid when every required player has `NO_CONTEST`.

## Custom Data

`customData` is owned by the minigame/rules mod.

Nexori does not interpret custom stats such as damage, kills, assists, beds broken, flags captured, zone progress, chests looted, or any other mode-specific data.

The backend can process `customData` however it wants. Different minigames may send different shapes.

### `customData.nexoriAfk`

The minigame owns `customData`, but Nexori reserves and may add `customData.nexoriAfk` for local AFK reporting when AFK snapshots are available. Minigame mods should avoid using this key for their own data.

```json
"nexoriAfk": {
  "schemaVersion": 1,
  "matchId": "nexori-match-001",
  "playerFields": [
    "playerUuid",
    "playerName",
    "currentlyAfk",
    "totalAfkMs",
    "afkCount",
    "currentStartedAtEpochMs",
    "lastIdleMs",
    "sources"
  ],
  "players": [
    [
      "11111111-1111-1111-1111-111111111111",
      "PlayerOne",
      true,
      15000,
      1,
      1760000045000,
      5000,
      ["IDLE_TIMEOUT"]
    ]
  ]
}
```

Nexori validates custom data before storing and sending it:

| Rule | Limit |
| --- | --- |
| Root type | JSON object |
| Null custom data | Treated as `{}` |
| Serialized UTF-8 size | 32 KiB |
| Max depth | 8 |
| Total object properties | 256 |
| Array length | 128 |
| Property name length | 64 |
| String value length | 1024 |

Nexori does not silently truncate invalid `customData`. Invalid data makes final result submission fail locally before a backend request is queued.

## Response Payload

Your backend must return JSON for a result report that Nexori should consider complete.

```json
{
  "schemaVersion": 1,
  "receivedResultId": "result-9ffb58dc-8ff6-45b5-8d2f-e6e9dfc59697",
  "status": "ACCEPTED"
}
```

## Response Fields

| Field | Type / Required | Source | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer / Yes | Backend | Response schema version. Use `1`. |
| `receivedResultId` | string / Yes | Backend | Must equal request `resultId`. Nexori uses this to confirm the backend acknowledged the intended result. |
| `status` | string enum / Yes | Backend | `ACCEPTED` or `DUPLICATE`. |

## Response Status Values

| Status | Meaning | Nexori behavior |
| --- | --- | --- |
| `ACCEPTED` | Backend stored or processed this result for the first time. | Nexori marks the result `ACKNOWLEDGED`. |
| `DUPLICATE` | Backend has already accepted this exact `resultId`. | Nexori treats it as acknowledged and stops retrying. |

The response only acknowledges the result when:

- HTTP status is successful enough for Nexori to parse the body
- `receivedResultId` equals the request `resultId`
- `status` is `ACCEPTED` or `DUPLICATE`

## Idempotency Rules

### Result Idempotency

`resultId` is the idempotency key for backend result reporting.

Your backend should:

- store `resultId` for every accepted result
- return `ACCEPTED` the first time it accepts a result
- return `DUPLICATE` if the same `resultId` is submitted again
- avoid creating a second result record for repeated `resultId`

### Match-Level Duplicates

Your backend may also enforce one result per `localMatchId` or `externalMatchId`.

Recommended behavior:

- Same `resultId`: return `200` with `DUPLICATE`
- Same match identity and same already accepted result: return `200` with `DUPLICATE`
- Same match identity but conflicting result: return an error and store enough information for operator review

If you return `409` for conflict, Nexori currently treats it as retryable. Use `400` or `422` if you want Nexori to stop retrying because the payload is permanently invalid.

## Status Code Behavior

| Backend status | Response body | What it means | What Nexori does | Retry? |
| --- | --- | --- | --- | --- |
| `200` with `ACCEPTED` | Required | Result accepted. | Marks result `ACKNOWLEDGED`. | No. |
| `200` with `DUPLICATE` | Required | Result was already accepted. | Marks result `ACKNOWLEDGED`. | No. |
| `200` with unknown status | Required but invalid | Backend returned a response Nexori cannot treat as acknowledged. | Keeps result pending. | Yes. |
| `200` with wrong `receivedResultId` | Required but invalid | Backend acknowledged a different result id. | Keeps result pending. | Yes. |
| `400` | Optional body, ignored by Nexori | Permanent malformed result request. | Marks result as permanent failure/needs attention. | No. |
| `401` | Optional body, ignored by Nexori | Missing bearer token. | Marks auth failed and keeps result pending. | Yes, after auth backoff. |
| `403` | Optional body, ignored by Nexori | Invalid/forbidden bearer token. | Marks auth forbidden and keeps result pending. | Yes, after auth backoff. |
| `409` | Optional body, ignored by Nexori | Conflict, usually duplicate match identity with different result. | Keeps result pending. | Yes. |
| `422` | Optional body, ignored by Nexori | Permanent semantic payload error. | Marks result as permanent failure/needs attention. | No. |
| `429` | Optional body, ignored by Nexori | Backend rate limited result reporting. | Keeps result pending. | Yes, after `resultRetryIntervalMs`. |
| `500` to `599` | Optional body, ignored by Nexori | Backend failed or is unavailable. | Keeps result pending. | Yes, after `resultRetryIntervalMs`. |
| Timeout/no response | None | Backend did not answer in `requestTimeoutMs`. | Clears in-flight state with a stale guard and keeps result pending. | Yes. |
| Parse error or empty body | Invalid | Nexori could not parse the response body. | Behavior follows status code: `400`/`422` become permanent, others remain pending. | Depends on status. |

## Retry Behavior

Nexori stores pending result reports durably before sending them.

If the backend is down, slow, rate limited, or returns a retryable status, Nexori keeps the result pending and retries later.

Result reporting sends at most one request in flight per server process. HTTP callbacks do not mutate game state directly; Nexori processes completed HTTP results on the main tick.

Important retry rules:

- `ACCEPTED` or `DUPLICATE` with matching `receivedResultId`: acknowledged, no retry
- `400` or `422`: permanent failure/needs attention, no infinite retry
- `401` or `403`: retry after auth backoff
- `429`, `5xx`, timeout, connection error, parse error on retryable status: retry
- result reporting can run with `syncEnabled=false`

## Backend Implementation Rules

- Authenticate every request with the bearer token.
- Validate trace headers against the body.
- Require a non-blank `resultId`.
- Require a non-blank `externalMatchId`.
- Require at least one player.
- Store accepted `resultId` values.
- Return `DUPLICATE` for repeated `resultId`.
- Treat `customData` as minigame-owned data.
- Do not require one universal custom data shape for all minigames.
- Return `400` or `422` only when you want Nexori to stop retrying that result.

## Example Flow

1. Backend-driven queue launches a match with:
   - `assignmentId="assign-001"`
   - `externalMatchId="backend-match-001"`
2. Players arrive on the arena server.
3. A rules mod controls the match because `rulesEngineId="capture_the_zone"`.
4. During gameplay, the rules mod records outcomes with `setPlayerOutcome(...)`.
5. During gameplay, the rules mod accumulates stats in its own runtime.
6. At the end, the rules mod calls `submitFinalMatchResult(...)` with `customData`.
7. Nexori validates the result locally and completes the match.
8. Nexori stores a pending backend result report.
9. Nexori sends `POST /nexori/results`.
10. Backend stores the result and returns:

```json
{
  "schemaVersion": 1,
  "receivedResultId": "result-9ffb58dc-8ff6-45b5-8d2f-e6e9dfc59697",
  "status": "ACCEPTED"
}
```

11. Nexori marks the result `ACKNOWLEDGED`.
12. If the backend was unavailable, Nexori would retry the same stored result later.
