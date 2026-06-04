# Match Admission State Endpoint

`POST /nexori/matches/state` is Nexori's backend admission visibility report endpoint.

It is not a matchmaking heartbeat and it is not final result reporting. Nexori sends it so your backend can understand whether one backend-driven match is still visible for future admission or backfill decisions.

This endpoint is used by backend-driven backfill. Local FIFO queues do not use it.

::: tip Recommended Multi-Server Setup
This endpoint is expected to run on the arena/minigame server that owns the active match. It exists so the backend can track open admission and backfill state without requiring that server to run `/nexori/sync`.
:::

## When Nexori Calls It

Nexori calls this endpoint when:

- `matchStateReportingEnabled=true`
- `baseUrl` and `serverToken` are configured
- the active match is backend-driven and has a valid launch policy snapshot
- Nexori detects a reportable admission state change
- the debounce/coalescing window says a snapshot should flush now
- no previous admission-state request for that match snapshot is still in flight

Typical change reasons include:

- match created
- player arrived
- placement completed
- match started
- admission window expired
- admission closed explicitly

This endpoint is global per server process and event-driven per match state change. It is not sent once per player tick.

```http
POST <baseUrl>/nexori/matches/state
Authorization: Bearer <serverToken>
Content-Type: application/json
X-Nexori-Server-Id: <reportingServerId>
X-Nexori-State-Update-Id: <stateUpdateId>
X-Nexori-Sequence: <admissionStateSequence>
X-Nexori-Sent-At-Epoch-Ms: <sentAtEpochMs>
```

## Required Headers

| Header | Required | Source | Description |
| --- | --- | --- | --- |
| `Authorization` | Yes | Nexori config | Must be `Bearer <serverToken>`. Your backend should reject missing or invalid tokens. |
| `Content-Type` | Yes | Nexori | Always `application/json`. |
| `X-Nexori-Server-Id` | Yes | Nexori server identity | Same value as body `reportingServerId`. |
| `X-Nexori-State-Update-Id` | Yes | Nexori admission reporting service | Same value as body `stateUpdateId`. Unique per snapshot attempt. |
| `X-Nexori-Sequence` | Yes | Nexori admission reporting service | Same value as body `admissionStateSequence`. Monotonic per reporting server/match publication state. |
| `X-Nexori-Sent-At-Epoch-Ms` | Yes | Nexori | Same value as body `sentAtEpochMs`. Unix epoch milliseconds. |

Your backend should validate that the trace headers match the body so logs, idempotency, and debugging all refer to the same admission snapshot.

## Request Payload

```json
{
  "schemaVersion": 1,
  "stateUpdateId": "0b386f76-2e41-4b35-a4ba-6b0d8dc5a6f2",
  "admissionStateSequence": 17,
  "payloadHash": "8f14c87ab9f7d1caa3d8f04f89f40fbb02ff4cc33e8bb4d08c1e560c321aa2e9",
  "sentAtEpochMs": 1760000000000,
  "stateExpiresAtEpochMs": 1760000030000,
  "reportingServerId": "25bdb01c-97f2-42d4-998a-4ef7b04d71c3",
  "reportingServerConnectionAddress": "arena.example.com:21918",
  "matchId": "3bb28e1b-b83a-459a-ad13-1961acc7759b",
  "externalMatchId": "backend-match-001",
  "queueId": "capture_zone_queue",
  "arenaId": "capture_zone_arena",
  "backfillEnabled": true,
  "backfillMode": "ACTIVE_WINDOW",
  "backfillWindowSeconds": 60,
  "matchLifecycleStatus": "ACTIVE",
  "admissionOpen": true,
  "admissionOpenUntilEpochMs": 1760000060000,
  "admissionCapacity": 8,
  "admittedSlotCount": 7,
  "availableAdmissionSlots": 1,
  "initialRosterSize": 6,
  "arrivedInitialPlayerCount": 6,
  "unfilledInitialRosterCount": 0,
  "consumedAdmissionReservationIds": [
    "reservation-a6d8a0a4"
  ],
  "admissionReportingClosed": false,
  "admissionReportingCloseReason": "",
  "primaryChangeReason": "PLAYER_ARRIVED",
  "coalescedChangeReasons": [
    "PLAYER_ARRIVED"
  ]
}
```

## Request Fields

| Field | Type / Required | Source | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer / Yes | Nexori | Payload schema version. Current value is `1`. |
| `stateUpdateId` | string UUID / Yes | Nexori admission reporting service | Idempotency and trace id for this snapshot attempt. Also sent in `X-Nexori-State-Update-Id`. |
| `admissionStateSequence` | integer / Yes | Nexori admission reporting service | Monotonic sequence for this match publication stream. Also sent in `X-Nexori-Sequence`. |
| `payloadHash` | string / Yes | Nexori admission reporting service | Canonical hash over stable admission snapshot fields. Useful for debugging, duplicate detection, and safety checks. |
| `sentAtEpochMs` | integer / Yes | Nexori admission reporting service | Time this HTTP attempt was created, in Unix epoch milliseconds. |
| `stateExpiresAtEpochMs` | integer / Yes | Nexori admission reporting service | Expiration time for this snapshot. Backends should ignore stale state once this point has passed. |
| `reportingServerId` | string UUID / Yes | Nexori server identity | Arena/reporting server sending the snapshot. |
| `reportingServerConnectionAddress` | string / Yes | Nexori arena/reporting server | Connection address of the server that owns the match. Backend should store it with the open-match record and can later use it as `targetConnectionAddress` in a `BACKFILL` assignment when a lobby sync exposes a queued player. May be blank if unknown. |
| `matchId` | string / Yes | Nexori match runtime | Nexori-owned local/runtime match id. |
| `externalMatchId` | string / Yes | Backend assignment | Backend-owned match id. This is the preferred stable match identity for backend reconciliation. |
| `queueId` | string / Yes | Nexori match runtime | Queue that launched the match. |
| `arenaId` | string / Yes | Nexori match runtime | Arena/game where the match is running. |
| `backfillEnabled` | boolean / Yes | Nexori launch policy snapshot | Whether the launching queue enabled backfill/admission visibility. |
| `backfillMode` | string enum / Yes | Nexori launch policy snapshot | `NONE`, `PLACEMENT_ONLY`, or `ACTIVE_WINDOW`. |
| `backfillWindowSeconds` | integer / Yes | Nexori launch policy snapshot | Configured active-window duration in seconds. `0` for modes that do not use a window. |
| `matchLifecycleStatus` | string enum / Yes | Nexori admission reporting service | Current lifecycle stage for admission reporting, currently `PLACEMENT` or `ACTIVE`. |
| `admissionOpen` | boolean / Yes | Nexori admission reporting service | Whether the match is still open for new admission right now. |
| `admissionOpenUntilEpochMs` | integer / Yes | Nexori admission reporting service | Deadline for admission visibility, when applicable. `0` means no explicit wall-clock deadline is attached to this snapshot. |
| `admissionCapacity` | integer / Yes | Nexori launch policy snapshot | Total admission capacity frozen onto the match at launch. |
| `admittedSlotCount` | integer / Yes | Nexori admission reporting service | Total slots already consumed by the initial roster plus consumed backfill admissions, clamped to capacity. |
| `availableAdmissionSlots` | integer / Yes | Nexori admission reporting service | Remaining visible slots before backend-side reservation filtering. |
| `initialRosterSize` | integer / Yes | Nexori launch context | Size of the original expected roster. Backfill does not rewrite this number. |
| `arrivedInitialPlayerCount` | integer / Yes | Nexori match runtime | How many initial-roster players actually arrived. Backfill players are not counted here. |
| `unfilledInitialRosterCount` | integer / Yes | Nexori admission reporting service | Remaining initial-roster arrivals not yet placed/arrived. Diagnostic only; do not use it for capacity or priority decisions. |
| `consumedAdmissionReservationIds` | array of string / Yes | Nexori admission reporting service | Reservation ids that Nexori considers consumed by accepted backfill arrivals in this specific snapshot. |
| `admissionReportingClosed` | boolean / Yes | Nexori admission reporting service | Whether Nexori considers admission reporting closed for this match. |
| `admissionReportingCloseReason` | string / Yes | Nexori admission reporting service | Close reason id when reporting is closed, otherwise blank. |
| `primaryChangeReason` | string / Yes | Nexori admission reporting service | Main reason this snapshot was emitted. |
| `coalescedChangeReasons` | array of string / Yes | Nexori admission reporting service | Additional reasons merged into this snapshot during debounce/coalescing. |

## Backfill Policy Fields

These fields are frozen from the launching queue onto the active match so the arena server can report admission state without needing local queue config at report time.

| Field | Meaning |
| --- | --- |
| `backfillEnabled` | Queue policy says this match participates in backend admission visibility. |
| `backfillMode` | Controls when the match stays visible for future admission. |
| `backfillWindowSeconds` | Duration of the active admission window for `ACTIVE_WINDOW`. |

## Match Lifecycle Fields

| Field | Meaning |
| --- | --- |
| `matchLifecycleStatus="PLACEMENT"` | Initial placement is still in progress. |
| `matchLifecycleStatus="ACTIVE"` | Initial placement is complete and gameplay is considered active. |
| `admissionOpen=true` | Backend may still consider the match for admission/backfill, subject to reservation and stale-state rules. |
| `admissionReportingClosed=true` | Nexori has closed admission visibility for this match and does not expect it to reopen. |

## Capacity And Slot Semantics

Your backend should treat these values carefully:

- `admissionCapacity` is the total slot budget for admission visibility
- `admittedSlotCount` is the number of slots already consumed by:
  - the initial roster
  - accepted backfill arrivals confirmed through consumed reservation ids
- `availableAdmissionSlots` is `max(0, admissionCapacity - admittedSlotCount)`

Important rules:

- deaths, eliminations, spectator changes, and returns do not reopen slots
- `admittedSlotCount` does not imply a reservation was consumed unless the relevant reservation id appears in `consumedAdmissionReservationIds`
- backfill does not change `initialRosterSize`
- backfill does not rewrite the original expected roster model

## `consumedAdmissionReservationIds`

This field is the normal confirmation path for backfill reservation consumption.

Each reservation id represents exactly one player and one slot.

Use it like this:

- if a snapshot is semantically accepted by the backend, the listed reservation ids can be marked consumed on the backend side
- if a snapshot is stale or semantically rejected, the backend should not apply those consumption side effects

This is why the list is attached to one specific snapshot instead of being inferred from `admittedSlotCount`.

## Response Payload

Your backend must return JSON for any successful `2xx` admission-state response that Nexori should treat as acknowledged.

```json
{
  "schemaVersion": 1,
  "receivedStateUpdateId": "0b386f76-2e41-4b35-a4ba-6b0d8dc5a6f2",
  "receivedAdmissionStateSequence": 17,
  "status": "ACCEPTED"
}
```

## Response Fields

| Field | Type / Required | Source | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer / Yes | Backend | Response schema version. Use `1`. |
| `receivedStateUpdateId` | string / Yes | Backend | Must equal request `stateUpdateId`. Nexori uses this to confirm the backend acknowledged the intended snapshot. |
| `receivedAdmissionStateSequence` | integer / Yes | Backend | Should equal request `admissionStateSequence`. Useful for trace/debug parity. |
| `status` | string enum / Yes | Backend | Recommended values are `ACCEPTED`, `DUPLICATE`, or `STALE`. |

## Response Status Values

| Status | Meaning | Nexori behavior |
| --- | --- | --- |
| `ACCEPTED` | Backend stored or processed this snapshot for the first time. | Nexori treats the snapshot as acknowledged. |
| `DUPLICATE` | Backend already accepted this same `stateUpdateId`. | Nexori treats the snapshot as acknowledged. |
| `STALE` | Backend recognized the snapshot but decided it is older than the current match state. | Nexori does **not** clear pending consumed reservation ids from that snapshot. |

Nexori also treats blank/`OK`/`DUPLICATE_ACCEPTED` style success bodies as semantically accepted, but new backends should prefer explicit `ACCEPTED`, `DUPLICATE`, or `STALE`.

## Idempotency Rules

### Snapshot Idempotency

`stateUpdateId` is the idempotency key for one admission-state snapshot attempt.

Your backend should:

- store `stateUpdateId` for accepted snapshots
- return `ACCEPTED` the first time it accepts a snapshot
- return `DUPLICATE` if the same `stateUpdateId` is submitted again
- avoid replaying reservation side effects for repeated `stateUpdateId`

### Sequence Ordering

`admissionStateSequence` is the monotonic ordering signal for one match publication stream.

Recommended behavior:

- accept newer sequences
- return `STALE` for older sequences
- never apply reservation consumption or closure side effects from a stale snapshot

### Match Identity

For backend identity, prefer:

1. `externalMatchId`
2. fallback: `reportingServerId + matchId`

Do not rely on `assignmentId` here. Admission-state reporting is match-centric, not assignment-centric.

## Status Code Behavior

| Backend status | Response body | What it means | What Nexori does | Retry? |
| --- | --- | --- | --- | --- |
| `200` with `ACCEPTED` | Required | Snapshot accepted. | Marks snapshot acknowledged and clears only the consumed reservation ids included in that accepted snapshot. | No. |
| `200` with `DUPLICATE` | Required | Snapshot already accepted. | Treats snapshot as acknowledged. | No. |
| `200` with `STALE` | Required | Backend recognized an older snapshot. | Keeps pending consumed ids; does not treat that snapshot as semantically accepted. | Nexori emits a newer snapshot later if needed. |
| `200` with unknown status | Required but semantically weak | Backend returned a body Nexori cannot confidently interpret. | If status is not semantically accepted, Nexori keeps the snapshot dirty and reflushes later. | Yes. |
| `400` | Optional body, ignored by Nexori | Permanent malformed request. | Drops or closes that snapshot path as a permanent request failure. | No. |
| `401` | Optional body, ignored by Nexori | Missing bearer token. | Marks auth failed and retries later after auth backoff. | Yes. |
| `403` | Optional body, ignored by Nexori | Invalid/forbidden bearer token. | Marks auth forbidden and retries later after auth backoff. | Yes. |
| `422` | Optional body, ignored by Nexori | Permanent semantic payload error. | Drops that snapshot as permanently invalid. | No. |
| `429` | Optional body, ignored by Nexori | Backend rate limited admission reporting. | Keeps snapshot pending for retry. | Yes. |
| `500` to `599` | Optional body, ignored by Nexori | Backend failed or is unavailable. | Keeps snapshot pending for retry. | Yes. |
| Timeout/no response | None | Backend did not answer in `requestTimeoutMs`. | Keeps snapshot pending with stale/in-flight safety. | Yes. |

## Retry Behavior

Nexori does not report admission state on every tick. It debounces and coalesces match changes.

Important runtime behavior:

- multiple quick changes may merge into one snapshot
- failed snapshots are retried later
- explicit match closure can flush immediately
- empty-runtime closure uses an immediate flush path so dead matches do not remain visible on the backend

Configuration fields that affect this:

- `matchStateDebounceMs`
- `matchStateMaxCoalesceWindowMs`
- `matchStateRetryIntervalMs`
- `matchStateStaleAfterMs`

## Backend Eligibility Rules

Nexori sends this endpoint so your backend can decide whether a running match is still eligible for future backfill.

A backend should generally consider a match eligible only if:

- `admissionOpen == true`
- `availableAdmissionSlots > 0`
- the snapshot is not stale
- the queue matches the player queue being matched
- the backend's own active reservation count still leaves room

Recommended backend-side capacity formula:

- `effectiveAvailableSlots = availableAdmissionSlots - ACTIVE reservation count`

This is why reservation tracking belongs on the backend side even though Nexori reports visibility.

## Backend Implementation Rules

- authenticate every request with the bearer token
- validate trace headers against the body
- require a non-blank `stateUpdateId`
- require a non-blank `matchId`
- require a non-blank `externalMatchId`
- use `stateUpdateId` for snapshot idempotency
- use `admissionStateSequence` for stale/newer ordering
- consume `consumedAdmissionReservationIds` only when the snapshot is actually accepted
- do not reopen admission because players died or returned
- treat `unfilledInitialRosterCount` as diagnostic only, not as capacity

## Example Flow

1. A backend-driven match is launched with backfill enabled.
2. The arena/minigame server reports an open admission snapshot during placement.
3. The backend keeps that match and its `reportingServerConnectionAddress` in its open-match registry.
4. A later player joins the same synced queue from another lobby.
5. A lobby/queue server sends `/nexori/sync` with that queued player.
6. The backend chooses the existing arena match and returns a `BACKFILL` assignment through `/nexori/sync` to the lobby/queue server.
7. The backend uses the stored arena `reportingServerConnectionAddress` as the assignment `targetConnectionAddress`.
8. Nexori validates the backfill ticket and the player arrives on the arena/minigame server.
9. The arena/minigame server reports a new `/nexori/matches/state` snapshot with:
   - updated `admittedSlotCount`
   - updated `availableAdmissionSlots`
   - `consumedAdmissionReservationIds` containing that player's reservation id
10. Backend accepts the snapshot and marks that reservation consumed.
11. Later, the window expires or a rules mod explicitly closes admission.
12. Nexori sends one final closed snapshot with:
    - `admissionOpen=false`
    - `availableAdmissionSlots=0`
    - `admissionReportingClosed=true`
13. Backend removes the match from future backfill eligibility.
