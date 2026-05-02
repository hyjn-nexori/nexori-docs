# Results Endpoint

```http
POST <baseUrl>/nexori/results
Authorization: Bearer <serverToken>
Content-Type: application/json
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
  "players": [
    {
      "playerUuid": "uuid-a",
      "outcome": "WIN",
      "reason": "objective_completed"
    }
  ],
  "reason": "rules_mod_completed",
  "metadata": {},
  "endedAtEpochMs": 1760000000000
}
```

## Minimal Response

```json
{
  "schemaVersion": 1,
  "receivedResultId": "result-uuid",
  "status": "ACCEPTED"
}
```

