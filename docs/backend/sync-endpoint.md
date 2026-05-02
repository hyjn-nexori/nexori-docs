# Sync Endpoint

```http
POST <baseUrl>/nexori/sync
Authorization: Bearer <serverToken>
Content-Type: application/json
```

## Minimal Request

```json
{
  "schemaVersion": 1,
  "syncId": "uuid",
  "sequence": 123,
  "sentAtEpochMs": 1760000000000,
  "serverId": "server-uuid",
  "server": {},
  "queues": [],
  "arenas": [],
  "activeMatches": [],
  "assignmentAcks": []
}
```

## Minimal Response

```json
{
  "schemaVersion": 1,
  "receivedSequence": 123,
  "acknowledgedAssignmentAckIds": ["ack-001"],
  "assignments": []
}
```

