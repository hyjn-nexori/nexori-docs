# Public API Methods

This page documents the public methods on `NexoriMinigameApi`. Each method is intentionally narrow: query match state, set player state, return a player, or submit the final result.

## Match Lookup

### `findActiveMatchId`

```java
Optional<String> findActiveMatchId(UUID playerUuid)
```

| Argument | Meaning |
| --- | --- |
| `playerUuid` | Player UUID to check. |

Returns the active Nexori match id for the player, or `Optional.empty()` if the player is not currently in an active Nexori match.

Call this as the first gate before your tick/event logic touches a player.

```java
Optional<String> activeMatchId = nexoriApi.findActiveMatchId(playerUuid);
if (activeMatchId.isEmpty()) {
    return;
}
String matchId = activeMatchId.get();
```

### `findActivePlayerUuid`

```java
Optional<UUID> findActivePlayerUuid(String matchId, String playerToken)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |
| `playerToken` | Player UUID string or current username. |

Returns a player UUID inside the active match. Username matching is case-insensitive.

Call this when a command or UI event gives your mod player text instead of a UUID.

```java
UUID targetUuid = nexoriApi.findActivePlayerUuid(matchId, inputText).orElse(null);
if (targetUuid == null) {
    return;
}
```

## Match Snapshot

### `findActiveMatchInfo`

```java
Optional<NexoriActiveMatchInfo> findActiveMatchInfo(String matchId)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |

Returns the public runtime snapshot for the match.

Call this when creating or refreshing your own match runtime.

```java
NexoriActiveMatchInfo info = nexoriApi.findActiveMatchInfo(matchId).orElse(null);
if (info == null) {
    return;
}

if (!"capture_the_zone".equals(info.rulesEngineId())) {
    return;
}
```

`NexoriActiveMatchInfo` includes:

| Field | Meaning |
| --- | --- |
| `matchId` | Local Nexori match id. |
| `queueId` | Queue that launched or owns the match. |
| `arenaId` | Arena/game id. |
| `assignmentId` | Backend assignment id, when available. |
| `externalMatchId` | Backend-owned match id, when available. |
| `rulesEngineId` | Rules mod id that should control the match. Non-blank means rules-mod ownership in the recommended flow. |
| `matchResolutionTriggerId` | Resolution trigger configured for the arena. Useful for diagnostics and legacy/advanced flows. |
| `expectedPlayerUuids` | Players expected by launch context. |
| `arrivedPlayerUuids` | Players that reached the arena runtime. |
| `activePlayerUuids` | Players still active in the match runtime. |
| `eliminatedPlayerUuids` | Players marked eliminated by Nexori/runtime state. |
| `spectatorPlayerUuids` | Players marked as logical spectators. |
| `requiredResultPlayerUuids` | Players that must have an outcome before final submit. |
| `playerOutcomes` | Accumulated outcome states set by `setPlayerOutcome(...)`. |
| `expectedPlayerCount` | Expected player count. |
| `completedAtEpochMs` | Local completion time, or `0`. |
| `resultSubmittedAtEpochMs` | Accepted result submit time, or `0`. |

### `findRulesEngineId`

```java
Optional<String> findRulesEngineId(String matchId)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |

Returns the rules engine id for the match.

Call this if you only need ownership and do not need the full `NexoriActiveMatchInfo` snapshot. In the recommended setup, this is the main ownership gate for a rules mod.

```java
boolean ownedByThisMod = nexoriApi.findRulesEngineId(matchId)
    .filter("skywars"::equals)
    .isPresent();
```

### `findMatchResolutionTriggerId`

```java
Optional<String> findMatchResolutionTriggerId(String matchId)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |

Returns the active match resolution trigger id. `none` or blank means manual/custom resolution.

Most rules mods should not need this for normal ownership checks. Use `rulesEngineId` instead. This method is useful for diagnostics, admin tools, legacy integrations, or advanced flows that need to show which arena resolver is configured.

```java
String triggerId = nexoriApi.findMatchResolutionTriggerId(matchId).orElse("");
logger.atInfo().log("Match " + matchId + " trigger=" + triggerId);
```

### `findMatchPlacementState`

```java
Optional<NexoriMatchPlacementState> findMatchPlacementState(String matchId)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |

Returns Nexori's initial placement snapshot.

Call this before enabling position-sensitive gameplay.

```java
NexoriMatchPlacementState placement = nexoriApi.findMatchPlacementState(matchId).orElse(null);
if (placement == null || !placement.placementComplete()) {
    return;
}
```

`NexoriMatchPlacementState`:

| Field | Meaning |
| --- | --- |
| `expectedPlayers` | Players Nexori expects for the match. |
| `arrivedPlayers` | Players that arrived at the arena runtime. |
| `placedPlayers` | Players that completed initial placement. |
| `placementComplete` | `true` once initial placement is complete. |

### `findMatchResultRequirements`

```java
Optional<NexoriMatchResultRequirements> findMatchResultRequirements(String matchId)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |

Returns the player set required for final result completeness.

Call this when preparing to finalize a match.

```java
NexoriMatchResultRequirements requirements =
    nexoriApi.findMatchResultRequirements(matchId).orElse(null);
if (requirements == null) {
    return;
}

for (UUID playerUuid : requirements.requiredPlayerUuids()) {
    // Make sure each player has an accumulated WIN, LOSS, or DISCONNECTED outcome.
}
```

Required players are derived like this:

| Condition | Required set |
| --- | --- |
| `expectedPlayerUuids` is not empty | `expectedPlayerUuids` |
| `expectedPlayerUuids` is empty | `arrived + active + eliminated`, without duplicates |

## Player State

### `setPlayerOutcome`

```java
NexoriSetPlayerOutcomeResult setPlayerOutcome(
    String matchId,
    UUID playerUuid,
    NexoriMatchResultPlayerOutcome outcome,
    String reason
)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |
| `playerUuid` | Player receiving the outcome. |
| `outcome` | `WIN`, `LOSS`, or `DISCONNECTED`. |
| `reason` | Short player-level reason. |

Stores or replaces one player's accumulated outcome inside the active match runtime.

Call this when your rules mod decides a player's competitive state changed.

```java
NexoriSetPlayerOutcomeResult result = nexoriApi.setPlayerOutcome(
    matchId,
    eliminatedPlayerUuid,
    NexoriMatchResultPlayerOutcome.LOSS,
    "fell_into_void"
);

if (result.status() != NexoriSetPlayerOutcomeStatus.UPDATED) {
    logger.atWarning().log("Could not store outcome: " + result.message());
}
```

Notes:

| Rule | Behavior |
| --- | --- |
| Repeated calls before completion | The latest outcome replaces the previous one. |
| `WIN` | Does not mark the player eliminated. |
| `LOSS` or `DISCONNECTED` | Marks the player eliminated. |
| Completed match | Returns `MATCH_ALREADY_COMPLETED`. |
| Return-to-lobby | Not triggered by this method. |
| Backend reporting | Not triggered by this method. |

Status values:

| Value | Meaning |
| --- | --- |
| `UPDATED` | Outcome was stored. |
| `MATCH_MISSING` | Match does not exist. |
| `PLAYER_MISSING` | Player does not belong to the match. |
| `MATCH_ALREADY_COMPLETED` | Match was already completed. |
| `INVALID_OUTCOME` | Outcome was invalid. |
| `INVALID_REASON` | Reason failed validation. |

### `setPlayerSpectator`

```java
NexoriSetPlayerSpectatorResult setPlayerSpectator(
    String matchId,
    UUID playerUuid,
    boolean spectator,
    String reason
)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |
| `playerUuid` | Player to update. |
| `spectator` | `true` to mark spectator, `false` to clear it. |
| `reason` | Short reason for logs/debugging. |

Stores logical spectator state for one player.

Call this when your rules mod wants Nexori to know that a player is still in the match context but no longer actively playing.

```java
nexoriApi.setPlayerSpectator(
    matchId,
    playerUuid,
    true,
    "eliminated_can_watch"
);
```

This is logical state only. It does not promise camera mode, invisibility, noclip, teleporting, or visual spectator controls.

Status values:

| Value | Meaning |
| --- | --- |
| `UPDATED` | Spectator state was stored. |
| `MATCH_MISSING` | Match does not exist. |
| `PLAYER_MISSING` | Player does not belong to the match. |
| `MATCH_ALREADY_COMPLETED` | Match was already completed. |
| `INVALID_REASON` | Reason failed validation. |

## Player Return

### `returnPlayerToLobby`

```java
NexoriReturnPlayerResult returnPlayerToLobby(
    String matchId,
    UUID playerUuid,
    int delaySeconds,
    String reason
)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |
| `playerUuid` | Player to return. |
| `delaySeconds` | Delay before return. |
| `reason` | Short return reason. |

Schedules one player through Nexori's return-to-lobby flow.

Call this when your game wants one player, or all players in a loop, to leave the arena.

```java
for (UUID playerUuid : requirements.requiredPlayerUuids()) {
    nexoriApi.returnPlayerToLobby(
        matchId,
        playerUuid,
        5,
        "match_completed"
    );
}
```

This method only handles transport/return. It does not set outcomes, complete the match, or report results.

Status values:

| Value | Meaning |
| --- | --- |
| `SCHEDULED` | Return was scheduled. |
| `MATCH_MISSING` | Match does not exist. |
| `PLAYER_MISSING` | Player does not belong to the match. |
| `INVALID_DELAY` | Delay was invalid. |
| `INVALID_REASON` | Reason failed validation. |

## Final Result

### `submitFinalMatchResult`

```java
NexoriSubmitFinalMatchResultResult submitFinalMatchResult(
    NexoriSubmitFinalMatchResultRequest request
)
```

Request:

```java
public record NexoriSubmitFinalMatchResultRequest(
    String matchId,
    String reason,
    JsonObject customData
) {
}
```

| Field | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id to complete. |
| `reason` | Match-level completion reason. |
| `customData` | Minigame-owned JSON object forwarded to result reporting. |

Completes the match locally using accumulated player outcomes from `setPlayerOutcome(...)`.

Call this once, after every required result player has an outcome.

```java
JsonObject customData = new JsonObject();
customData.addProperty("mode", "mid_capture");
customData.addProperty("capturePointId", "mid");

JsonObject progressByPlayer = new JsonObject();
progressByPlayer.add(winnerUuid.toString(), winnerProgressJson);
customData.add("playerCaptureProgress", progressByPlayer);

NexoriSubmitFinalMatchResultResult result = nexoriApi.submitFinalMatchResult(
    new NexoriSubmitFinalMatchResultRequest(
        matchId,
        "mid_capture_point_captured",
        customData
    )
);
```

Nexori validates:

| Rule | Behavior |
| --- | --- |
| Match exists | Missing match returns `MATCH_MISSING`. |
| Match not already finalized | Same payload is idempotent; different payload is a duplicate conflict. |
| Completeness | Every required player must have an accumulated outcome. |
| Unknown outcomes | Outcomes for players outside the match are rejected. |
| Winner | V1 requires at least one `WIN`. |
| Custom data | Must be a valid JSON object within limits. |

Result:

| Field | Meaning |
| --- | --- |
| `matchStatus` | Local match completion status. |
| `backendReportStatus` | Backend reporting status, separate from local completion. |
| `resultId` | Durable result id when backend reporting was queued or matched. |
| `message` | Human-readable detail for logs. |

`submitFinalMatchResult(...)` does not return players to lobby. Use `returnPlayerToLobby(...)` separately.

## Admission Control

### `closeMatchAdmission`

```java
NexoriCloseMatchAdmissionResult closeMatchAdmission(
    NexoriCloseMatchAdmissionRequest request
)
```

Request:

```java
public record NexoriCloseMatchAdmissionRequest(
    String matchId,
    NexoriCloseMatchAdmissionReason reason,
    @Nullable String message
) {
}
```

| Field | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id to close for future backend admission. |
| `reason` | Why the rules mod is closing admission. |
| `message` | Optional human-readable detail for logs/debugging. |

Closes backend admission reporting for one active backend-driven match.

Call this when your game reaches a point where late joins should stop even if the configured backfill window has not expired yet.

Examples:

- the playable roster is now locked
- the round started and late joins would be unfair
- the game entered a boss/objective phase that should not accept new players
- an admin wants to force closure manually

```java
NexoriCloseMatchAdmissionResult result = nexoriApi.closeMatchAdmission(
    new NexoriCloseMatchAdmissionRequest(
        matchId,
        NexoriCloseMatchAdmissionReason.GAME_PHASE_LOCKED,
        "Capture phase has started."
    )
);

if (result.status() != NexoriCloseMatchAdmissionStatus.CLOSED
    && result.status() != NexoriCloseMatchAdmissionStatus.ALREADY_CLOSED) {
    logger.atWarning().log("Could not close admission: " + result.message());
}
```

`closeMatchAdmission(...)` does not:

- complete the match
- return players to lobby
- reopen later
- change admission capacity
- bypass ownership or backend-driven validation

It marks admission closed locally and, when match admission reporting is enabled, Nexori sends a closed snapshot through `/nexori/matches/state`.

Reasons:

| Value | Meaning |
| --- | --- |
| `MOD_REQUEST` | General rules-mod initiated close. |
| `GAME_PHASE_LOCKED` | Gameplay reached a phase where late joins should stop. |
| `ROSTER_LOCKED` | Team/roster lock means no more players should enter. |
| `ADMIN_FORCED` | Operator/admin forced the close. |

Status values:

| Value | Meaning |
| --- | --- |
| `CLOSED` | Admission was closed locally. |
| `ALREADY_CLOSED` | Match admission was already closed locally. |
| `MATCH_MISSING` | Match does not exist. |
| `MATCH_NOT_BACKEND_DRIVEN` | Match is active but not a backend-driven match. |
| `INVALID_REASON` | Request reason was invalid or missing. |
| `REPORTING_DISABLED` | Admission was closed locally, but backend reporting was disabled or unusable so the backend may not have been notified. |

### Custom Data Limits

`customData` is owned by the rules mod. Nexori validates it and forwards it to `/nexori/results` when reporting is enabled.

| Limit | Value |
| --- | --- |
| Root type | `JsonObject` |
| `null` custom data | Treated as `{}` |
| Serialized UTF-8 size | 32 KiB |
| Max depth | 8 |
| Total properties | 256 |
| Array length | 128 |
| Property name | 64 characters |
| String value | 1024 characters |

Nexori rejects invalid custom data instead of silently truncating it.

## Legacy Methods

### `submitMatchResult`

```java
@Deprecated
NexoriSubmitMatchResultResult submitMatchResult(NexoriSubmitMatchResultRequest request)
```

Legacy complete-result method that receives the player outcome list inside the request.

Existing mods may continue to use it. New mods should prefer `setPlayerOutcome(...)` plus `submitFinalMatchResult(...)`.

### `resolvePlayerOutcome`

```java
@Deprecated
NexoriResolvePlayerResult resolvePlayerOutcome(
    String matchId,
    UUID playerUuid,
    NexoriPlayerResolutionOutcome outcome,
    int returnDelaySeconds,
    String reason
)
```

Legacy per-player method that sets one outcome and schedules that player's return.

Existing mods may continue to use it. New mods should keep outcome and return separate with `setPlayerOutcome(...)` and `returnPlayerToLobby(...)`.
