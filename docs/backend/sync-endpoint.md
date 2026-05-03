# Sync Endpoint

`POST /nexori/sync` is Nexori's backend matchmaking heartbeat.

When backend sync is enabled, one server process sends at most one sync request per `syncIntervalMs`. With `"syncIntervalMs": 10000`, the server attempts roughly one heartbeat every 10 seconds. This is global per server process, not per player, queue, arena, or entity tick.

The backend can use this request to inspect queues, arenas, active matches, and pending assignment ACKs. It returns assignments when it wants Nexori to launch backend-driven matches.

```http
POST <baseUrl>/nexori/sync
Authorization: Bearer <serverToken>
Content-Type: application/json
```

## Request Headers

```http
X-Nexori-Server-Id: <serverId>
X-Nexori-Sync-Id: <syncId>
X-Nexori-Sequence: <sequence>
X-Nexori-Sent-At-Epoch-Ms: <sentAtEpochMs>
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

## What The Backend Controls

For `BACKEND_DRIVEN` queues, the backend owns the matchmaking decision. It can decide player grouping, ranking/ELO, region, load balancing, tournament rules, or any custom algorithm.

Nexori still owns the launch contract. The backend must return assignments in Nexori's expected format, and Nexori validates those assignments before launching any match.

## Minimal Response

```json
{
  "schemaVersion": 1,
  "receivedSequence": 123,
  "acknowledgedAssignmentAckIds": ["ack-001"],
  "assignments": []
}
```
