# Sync Endpoint

`POST /nexori/sync` is Nexori's backend matchmaking heartbeat.

It lets a backend observe the current server snapshot, inspect backend-driven queue members, acknowledge assignment ACKs, and return match assignments that Nexori should attempt to launch.

This endpoint is only used for backend-driven matchmaking. Local FIFO queues do not need it.

## When Nexori Calls It

Nexori calls this endpoint when:

- backend config has `syncEnabled=true`
- `baseUrl` and `serverToken` are configured
- the server process reaches its next `syncIntervalMs`
- no previous sync request is still in flight

One server process sends at most one sync request per configured interval. The interval is controlled by `syncIntervalMs`; for example, `10000` means the server attempts roughly one heartbeat every 10 seconds.

This is global per server process, not per player, queue, arena, portal, or entity tick.

```http
POST <baseUrl>/nexori/sync
Authorization: Bearer <serverToken>
Content-Type: application/json
X-Nexori-Server-Id: <serverId>
X-Nexori-Sync-Id: <syncId>
X-Nexori-Sequence: <sequence>
X-Nexori-Sent-At-Epoch-Ms: <sentAtEpochMs>
```

## Required Headers

| Header | Required | Owner/source | Description |
| --- | --- | --- | --- |
| `Authorization` | Yes | Nexori config | Must be `Bearer <serverToken>`. Your backend should reject missing or invalid tokens. |
| `Content-Type` | Yes | Nexori | Always `application/json`. |
| `X-Nexori-Server-Id` | Yes | Nexori server identity | Same value as body `serverId`. Useful for logs and auth policy. |
| `X-Nexori-Sync-Id` | Yes | Nexori sync runtime | Same value as body `syncId`. Unique per sync attempt. |
| `X-Nexori-Sequence` | Yes | Nexori durable assignment store | Same value as body `sequence`. Monotonic per server process/store. |
| `X-Nexori-Sent-At-Epoch-Ms` | Yes | Nexori | Same value as body `sentAtEpochMs`. Unix epoch milliseconds. |

Your backend should validate that the trace headers match the body so request logs, idempotency checks, and debugging all refer to the same sync attempt.

## Request Payload

```json
{
  "schemaVersion": 1,
  "syncId": "8c80e2d9-4f6e-4f62-bd9f-f02fdad9d43d",
  "sequence": 123,
  "sentAtEpochMs": 1760000000000,
  "serverId": "7b2fd2f5-50a5-4d0b-8e62-dc2dc82e9bb9",
  "server": {
    "fingerprint": "server-fingerprint",
    "connectionAddress": "lobby.example.com:21918",
    "role": "SERVER",
    "region": "us-east"
  },
  "queues": [
    {
      "queueId": "duel_sword",
      "displayName": "Sword Duel",
      "minPlayers": 2,
      "maxPlayers": 2,
      "countdownSeconds": 5,
      "launchTravelProfileId": "default",
      "matchmakingMode": "BACKEND_DRIVEN",
      "enabled": true,
      "arenaIds": ["duel_arena_01"],
      "runtime": {
        "phase": "WAITING",
        "countdownEndsAtEpochMs": 0,
        "readyAtEpochMs": 0,
        "lastStateChangeEpochMs": 1760000000000,
        "lastLaunchAttemptAtEpochMs": 0,
        "lastLaunchError": "",
        "waitingMembers": [
          {
            "playerUuid": "11111111-1111-1111-1111-111111111111",
            "playerNameSnapshot": "PlayerOne",
            "sourceLobbyId": "main_lobby",
            "sourcePortalId": "duel_portal",
            "joinedAtEpochMs": 1760000000000
          }
        ],
        "readyMembers": []
      }
    }
  ],
  "arenas": [
    {
      "arenaId": "duel_arena_01",
      "displayName": "Duel Arena 01",
      "destinationConnectionAddress": "arena.example.com:21918",
      "destinationTargetId": "arena-server-01",
      "instanceTemplateId": "DuelTemplate",
      "matchResolutionTriggerId": "none",
      "maxSupportedPlayers": 2,
      "enabled": true
    }
  ],
  "activeMatches": [
    {
      "matchId": "nexori-match-001",
      "queueId": "duel_sword",
      "arenaId": "duel_arena_01",
      "expectedPlayerCount": 2,
      "arrivedPlayerCount": 1,
      "activePlayerCount": 1,
      "createdAtEpochMs": 1760000000000,
      "updatedAtEpochMs": 1760000005000,
      "lastError": ""
    }
  ],
  "assignmentAcks": [
    {
      "ackId": "ack-001",
      "assignmentId": "assign-001",
      "externalMatchId": "backend-match-001",
      "status": "LAUNCHED",
      "localMatchId": "nexori-match-001",
      "reason": "",
      "createdAtEpochMs": 1760000000000
    }
  ]
}
```

## Request Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `schemaVersion` | integer | Yes | Nexori | Payload schema version. Current value is `1`. |
| `syncId` | string UUID | Yes | Nexori | Unique id for this sync attempt. Also sent in `X-Nexori-Sync-Id`. |
| `sequence` | integer | Yes | Nexori | Monotonic sync sequence from Nexori's durable backend assignment store. Also sent in `X-Nexori-Sequence`. |
| `sentAtEpochMs` | integer | Yes | Nexori | Time the request was created, in Unix epoch milliseconds. |
| `serverId` | string UUID | Yes | Nexori server identity | Stable id for the server process sending the heartbeat. |
| `server` | object | Yes | Nexori | Snapshot of the sending server. |
| `queues` | array | Yes | Nexori queue runtime | All known queues and their runtime state when available. |
| `arenas` | array | Yes | Nexori arena config | All known arenas/games available to launch. |
| `activeMatches` | array | Yes | Nexori arena runtime | Active match snapshots currently known by this server. |
| `assignmentAcks` | array | Yes | Nexori durable assignment store | Pending assignment ACKs Nexori wants your backend to acknowledge. |

## `server` Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `fingerprint` | string | Yes | Nexori server identity | Server fingerprint for diagnostics and trust correlation. |
| `connectionAddress` | string | Yes | Nexori local address service | Address this server advertises for travel, if known. |
| `role` | string | Yes | Nexori server identity | Current role marker sent by Nexori. In the current contract this value is `SERVER`. |
| `region` | string | Yes | Nexori backend config | Manual routing hint configured by the operator. Can be blank. |

## `queues[]` Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `queueId` | string | Yes | Nexori queue config | Stable queue id. Use this when returning assignments. |
| `displayName` | string | Yes | Nexori queue config | Human-readable queue name. |
| `minPlayers` | integer | Yes | Nexori queue config | Minimum players needed for a valid match. |
| `maxPlayers` | integer | Yes | Nexori queue config | Maximum players allowed by this queue. |
| `countdownSeconds` | integer | Yes | Nexori queue config | Local countdown value. Backend-driven queues do not rely on local countdown to decide assignment. |
| `launchTravelProfileId` | string | Yes | Nexori queue config | Travel profile used by Nexori when launching. |
| `matchmakingMode` | string | Yes | Nexori queue config | `LOCAL_FIFO` or `BACKEND_DRIVEN`. Your backend should only assign players from `BACKEND_DRIVEN` queues. |
| `enabled` | boolean | Yes | Nexori queue config | Whether the queue is enabled. |
| `arenaIds` | array of string | Yes | Nexori queue config | Arena ids this queue is allowed to launch into. Assignments must use one of these ids. |
| `runtime` | object or null | Yes | Nexori queue runtime | Current queue state. May be `null` if the queue has no runtime state yet. |

## `runtime` Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `phase` | string | Yes | Nexori queue runtime | Current queue phase, such as `WAITING`, `READY`, or a launch-related phase. Treat as diagnostic unless your backend needs it. |
| `countdownEndsAtEpochMs` | integer | Yes | Nexori queue runtime | Local countdown end time. Usually not used for backend-driven assignment decisions. |
| `readyAtEpochMs` | integer | Yes | Nexori queue runtime | Time the queue became ready locally, if applicable. |
| `lastStateChangeEpochMs` | integer | Yes | Nexori queue runtime | Last runtime state transition time. |
| `lastLaunchAttemptAtEpochMs` | integer | Yes | Nexori queue runtime | Last local launch attempt time. |
| `lastLaunchError` | string | Yes | Nexori queue runtime | Last launch error known to Nexori, if any. |
| `waitingMembers` | array | Yes | Nexori queue runtime | Players currently waiting in the queue. Backend-driven matchmakers usually read from here. |
| `readyMembers` | array | Yes | Nexori queue runtime | Players considered ready by runtime. Backend-driven matchmakers may include them depending on policy. |

## `waitingMembers[]` And `readyMembers[]` Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `playerUuid` | string UUID | Yes | Nexori queue runtime | Player UUID to use in assignments. |
| `playerNameSnapshot` | string | Yes | Nexori queue runtime | Last known player name snapshot. Do not use as identity. |
| `sourceLobbyId` | string | Yes | Nexori queue/runtime source | Lobby id where the player joined, if known. |
| `sourcePortalId` | string | Yes | Nexori queue/runtime source | Portal id used to join the queue, if known. |
| `joinedAtEpochMs` | integer | Yes | Nexori queue runtime | Time the player joined the queue. Useful for FIFO or timeout logic. |

## `arenas[]` Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `arenaId` | string | Yes | Nexori arena config | Stable arena/game id. Assignments must reference an arena id known to Nexori. |
| `displayName` | string | Yes | Nexori arena config | Human-readable arena name. |
| `destinationConnectionAddress` | string | Yes | Nexori arena config | Destination server address Nexori will travel players to. |
| `destinationTargetId` | string | Yes | Nexori arena config | Destination target id used by Nexori travel. |
| `instanceTemplateId` | string | Yes | Nexori arena config | Instance template Nexori should create or materialize. |
| `matchResolutionTriggerId` | string | Yes | Nexori arena config | Built-in trigger id or `none`/manual-style value for rules-mod controlled games. |
| `maxSupportedPlayers` | integer | Yes | Nexori arena config | Maximum players supported by this arena. Assignments above this number are rejected. |
| `enabled` | boolean | Yes | Nexori arena config | Whether this arena is enabled. Disabled arenas should not be assigned. |

## `activeMatches[]` Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `matchId` | string | Yes | Nexori arena runtime | Local Nexori match id. |
| `queueId` | string | Yes | Nexori arena runtime | Queue that launched the match. |
| `arenaId` | string | Yes | Nexori arena runtime | Arena where the match is running. |
| `expectedPlayerCount` | integer | Yes | Nexori arena runtime | Number of players expected by the match. |
| `arrivedPlayerCount` | integer | Yes | Nexori arena runtime | Number of players that have reached the arena server runtime. |
| `activePlayerCount` | integer | Yes | Nexori arena runtime | Number of players still considered active by Nexori. |
| `createdAtEpochMs` | integer | Yes | Nexori arena runtime | Match creation time. |
| `updatedAtEpochMs` | integer | Yes | Nexori arena runtime | Last match runtime update time. |
| `lastError` | string | Yes | Nexori arena runtime | Last runtime error known to Nexori, if any. |

## `assignmentAcks[]` Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `ackId` | string | Yes | Nexori durable assignment store | Unique ACK id. Return it in `acknowledgedAssignmentAckIds` once your backend has processed it. |
| `assignmentId` | string | Yes | Backend assignment, persisted by Nexori | Original backend assignment id. |
| `externalMatchId` | string | Yes | Backend assignment, persisted by Nexori | Backend-owned match id from the assignment. |
| `status` | string enum | Yes | Nexori assignment execution | `LAUNCHED`, `REJECTED`, or `FAILED`. |
| `localMatchId` | string | Yes | Nexori assignment execution | Nexori-owned local match id when launch succeeded. Blank for rejected/failed assignments. |
| `reason` | string | Yes | Nexori assignment execution | Human-readable reason for rejection/failure, or blank on success. |
| `createdAtEpochMs` | integer | Yes | Nexori durable assignment store | Time the ACK was created. |

## Response Payload

Your backend must respond with JSON for any successful `2xx` sync response.

```json
{
  "schemaVersion": 1,
  "receivedSequence": 123,
  "acknowledgedAssignmentAckIds": ["ack-001"],
  "assignments": [
    {
      "assignmentType": "INITIAL_MATCH",
      "assignmentId": "assign-002",
      "matchId": "backend-match-002",
      "externalMatchId": "backend-match-002",
      "type": "CREATE_MATCH",
      "queueId": "duel_sword",
      "playerUuids": [
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222"
      ],
      "expectedPlayerUuids": [
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222"
      ],
      "arenaId": "duel_arena_01",
      "players": [],
      "reportingServerId": "",
      "targetConnectionAddress": "",
      "modeId": "duel",
      "kitId": "sword",
      "ranked": true,
      "metadata": {
        "ratingBucket": "gold",
        "region": "us-east"
      }
    }
  ]
}
```

## Response Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `schemaVersion` | integer | Yes | Backend | Response schema version. Use `1`. |
| `receivedSequence` | integer | Yes | Backend | Echo the request `sequence` your backend processed. |
| `acknowledgedAssignmentAckIds` | array of string | Yes | Backend | ACK ids from request `assignmentAcks` that your backend has processed and durably accepted. Nexori removes these from its pending ACK store. |
| `assignments` | array | Yes | Backend | Assignments Nexori should attempt to launch. Use an empty array when no match should launch. |

## `assignments[]` Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `assignmentType` | string enum | Yes | Backend | `INITIAL_MATCH` or `BACKFILL`. Legacy `CREATE_MATCH` responses can omit this only for initial-match behavior. |
| `assignmentId` | string | Yes | Backend | Unique id for this assignment. Never reuse with different content. |
| `matchId` | string | Yes | Backend | Backend-owned shared match id. Required for modern backend-driven flow. |
| `externalMatchId` | string | Yes | Backend | Backend-owned match id preserved by Nexori for reporting and reconciliation. In most modern backends this should match or align with `matchId`. |
| `type` | string enum | Yes | Backend | `CREATE_MATCH` for `INITIAL_MATCH`. `JOIN_MATCH` or `BACKFILL` is accepted for `BACKFILL`. |
| `queueId` | string | Yes | Backend, from request queue snapshot | Queue to launch from. Must exist and be `BACKEND_DRIVEN`. |
| `playerUuids` | array of UUID string | Yes | Backend, from queue members | Players assigned to this instruction. For `BACKFILL`, this should align with `players[].playerUuid`. |
| `expectedPlayerUuids` | array of UUID string | Yes | Backend | Initial roster model for `INITIAL_MATCH`. Use an empty array for `BACKFILL`. |
| `arenaId` | string | Yes | Backend, from request arena snapshot | Arena Nexori should launch. Must exist and belong to the queue's `arenaIds`. |
| `players` | array | Yes | Backend | Per-player backfill tickets. Required for `BACKFILL`; use an empty array for `INITIAL_MATCH`. |
| `reportingServerId` | string | Yes | Backend | Arena/reporting server that owns the existing match for `BACKFILL`. Blank for `INITIAL_MATCH` if unused. |
| `targetConnectionAddress` | string | Yes | Backend | Explicit arena-server travel address for `BACKFILL`. Blank for `INITIAL_MATCH` if unused. |
| `modeId` | string | Yes | Backend | Optional backend/gameplay hint. Nexori transports it as assignment metadata but does not own your matchmaking algorithm. Use blank string if unused. |
| `kitId` | string | Yes | Backend | Optional backend/gameplay hint. Use blank string if unused. |
| `ranked` | boolean | Yes | Backend | Whether your backend considers this assignment ranked. |
| `metadata` | object | Yes | Backend | Backend-owned JSON object. Nexori does not interpret mode-specific matchmaking metadata. |

## `players[]` Fields

| Field | Type | Required | Owner/source | Description |
| --- | --- | --- | --- | --- |
| `playerUuid` | string UUID | Yes | Backend | Player being admitted through backfill. |
| `admissionReservationId` | string | Yes | Backend reservation system | One reservation id per player and per slot. |
| `admissionExpiresAtEpochMs` | integer | Yes | Backend reservation system | Expiration deadline for that player's admission ticket. |

## Assignment Validation In Nexori

Nexori validates every assignment before launching:

- `assignmentId` must not have been processed before with different content
- `assignmentType` must be `INITIAL_MATCH` or `BACKFILL`
- `INITIAL_MATCH` must use `CREATE_MATCH`
- `BACKFILL` must use `JOIN_MATCH`, `BACKFILL`, or leave `type` compatible with backfill handling
- `matchId` must be a valid backend-owned match id
- `queueId` must exist
- queue must be `BACKEND_DRIVEN`
- every player must be online
- every player must still be in that queue
- `arenaId` must exist
- arena must belong to the queue's `arenaIds`
- arena must be enabled
- `playerUuids.length` must be less than or equal to `arena.maxSupportedPlayers`
- players must not already be in another active match
- destination travel data must be parseable by Nexori
- `BACKFILL` must include `targetConnectionAddress`
- `BACKFILL` must include one `admissionReservationId` and one positive `admissionExpiresAtEpochMs` per player
- `INITIAL_MATCH` player set must be a subset of `expectedPlayerUuids` when `expectedPlayerUuids` is provided

If validation or launch fails, Nexori creates an assignment ACK with `REJECTED` or `FAILED`.

## Idempotency Rules

### Request Idempotency

Each sync has a unique `syncId` and a monotonic `sequence`. The backend should treat `(serverId, sequence)` or `syncId` as request trace identity for logs and duplicate protection.

Sync is a heartbeat, so the backend should be tolerant of repeated, delayed, or skipped heartbeats.

### Assignment Idempotency

`assignmentId` is the idempotency key for assignments.

- Same `assignmentId` with the same payload: Nexori does not launch it again.
- Same `assignmentId` with different payload: Nexori rejects it as suspicious and ACKs rejection.
- New assignment attempt: use a new `assignmentId`.

### ACK Idempotency

`ackId` is the idempotency key for ACK processing.

The backend should only include an id in `acknowledgedAssignmentAckIds` after it has safely processed that ACK. Nexori will keep sending pending ACKs until they are acknowledged.

## Status Code Behavior

| Backend status | Response body | What it means | What Nexori does | Retry? |
| --- | --- | --- | --- | --- |
| `200` to `299` | Required, parseable sync response | Sync accepted. | Parses response, acknowledges returned ACK ids, processes assignments. | Next heartbeat at `syncIntervalMs`. |
| `400` | Ignored by Nexori | Bad request or malformed payload. | Marks sync unhealthy. No assignments processed. | Yes, later heartbeat. |
| `401` | Ignored by Nexori | Missing bearer token. | Marks auth failed. | Yes, after auth backoff. |
| `403` | Ignored by Nexori | Invalid/forbidden bearer token. | Marks auth forbidden. | Yes, after auth backoff. |
| `422` | Ignored by Nexori | Payload is valid JSON but semantically invalid. | Marks sync unhealthy. No assignments processed. | Yes, later heartbeat. |
| `429` | Ignored by Nexori | Backend rate limited the heartbeat. | Marks sync unhealthy. | Yes, later heartbeat. |
| `500` to `599` | Ignored by Nexori | Backend unavailable or failed. | Marks sync unhealthy. | Yes, later heartbeat. |
| Timeout/no response | None | Backend did not answer in `requestTimeoutMs`. | Clears in-flight state with a stale guard. | Yes, later heartbeat. |
| `2xx` with empty/invalid body | Invalid | Backend returned success but not the required schema. | Marks sync unhealthy. No assignments processed. | Yes, later heartbeat. |

For sync, non-success responses do not permanently stop future heartbeats. Nexori will keep trying while `syncEnabled=true` and the config remains usable.

## Backend Implementation Rules

- Authenticate every request with the bearer token.
- Validate trace headers against the body.
- Only assign players from `BACKEND_DRIVEN` queues.
- Only assign players currently present in `waitingMembers` or `readyMembers`.
- Only assign arenas listed in that queue's `arenaIds`.
- Keep `assignmentId` stable and unique.
- Do not reuse an `assignmentId` with changed payload.
- Persist processed `ackId` values before returning them in `acknowledgedAssignmentAckIds`.
- Return an empty `assignments` array when no match should be launched.

## Example Flow

1. Player A enters a backend-driven queue.
2. Nexori sends `/nexori/sync` with Player A in `waitingMembers`.
3. Backend sees not enough players and returns no assignments.
4. Player B enters the same queue.
5. Nexori sends the next `/nexori/sync` with both players.
6. Backend chooses an arena and returns one `INITIAL_MATCH` assignment.
7. Nexori validates the assignment.
8. Nexori launches the match and records an ACK:
   - `status="LAUNCHED"`
   - `localMatchId="<nexori-match-id>"`
9. Nexori includes that ACK in later `assignmentAcks`.
10. Backend stores the ACK and returns its `ackId` in `acknowledgedAssignmentAckIds`.
11. Nexori removes the ACK from its pending ACK store.

## Backfill Flow

For real backfill:

1. A backend-driven match is already running on an arena server.
2. Nexori reports its admission visibility through `/nexori/matches/state`.
3. Another player joins the same synced queue from the same or another lobby server.
4. The backend chooses the existing match instead of creating a new one.
5. The backend returns a `BACKFILL` assignment with:
   - `assignmentType="BACKFILL"`
   - `matchId`
   - `externalMatchId`
   - `reportingServerId`
   - `targetConnectionAddress`
   - one `players[]` ticket per player
6. Nexori validates the ticket, launches travel to the owning arena server, and attempts to admit the player into the existing match runtime.
