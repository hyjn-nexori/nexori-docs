# Results Endpoint

`POST /nexori/results` is an event-driven result report.

This endpoint is not a heartbeat. Nexori sends it when a match has a final result to report, usually once per completed match. Failed reports are stored durably by Nexori and retried according to `resultRetryIntervalMs`.

For Nexori built-in minigames or built-in resolution flows, Nexori can call this automatically when the match ends, as long as `resultReportingEnabled=true` and the backend `baseUrl`/`serverToken` are usable.

For third-party rules mods, the mod should call the public Minigame API. During the match, collect any minigame-specific stats in your own runtime. At the end, pass those stats as `customData` to `submitFinalMatchResult(...)`; Nexori validates and forwards that JSON here.

```http
POST <baseUrl>/nexori/results
Authorization: Bearer <serverToken>
Content-Type: application/json
```

## Request Headers

```http
X-Nexori-Server-Id: <serverId>
X-Nexori-Result-Id: <resultId>
X-Nexori-Sent-At-Epoch-Ms: <sentAtEpochMs>
```

## Minimal Request

```json
{
  "schemaVersion": 1,
  "resultId": "result-uuid",
  "sentAtEpochMs": 1760000000000,
  "serverId": "arena-server-id",
  "localMatchId": "nexori-match-id",
  "externalMatchId": "backend-match-id",
  "assignmentId": "assign-001",
  "queueId": "queue-id",
  "arenaId": "arena-id",
  "rulesEngineId": "capture_the_zone",
  "players": [
    {
      "playerUuid": "uuid-a",
      "outcome": "WIN",
      "reason": "objective_completed"
    }
  ],
  "reason": "rules_mod_completed",
  "metadata": {},
  "customData": {
    "mode": "capture_the_zone",
    "playerCaptureProgress": {
      "uuid-a": {
        "progressSeconds": 60.0,
        "progressPercent": 100.0
      }
    }
  },
  "endedAtEpochMs": 1760000000000
}
```

## Payload Ownership

The top-level result fields are Nexori's stable contract with the backend: match ids, queue id, arena id, `rulesEngineId`, player outcomes, reason, and timing.

`customData` belongs to the minigame/rules mod. Nexori does not interpret mode-specific stats such as damage, beds broken, captures, assists, objectives, chests looted, or capture progress. The rules mod collects that data and sends it in `customData` at final submit time.

The backend can process `customData` however it wants. Different minigames may send different shapes.

## Minimal Response

```json
{
  "schemaVersion": 1,
  "receivedResultId": "result-uuid",
  "status": "ACCEPTED"
}
```
