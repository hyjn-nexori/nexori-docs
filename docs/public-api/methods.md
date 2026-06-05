# Public API Methods

This page documents the public methods on `NexoriMinigameApi`. Each method is intentionally narrow: query match state, set player state, return a player, or submit the final result.

## Lifecycle Callbacks

Lifecycle callbacks let third-party minigame adapters react to Nexori-owned match transitions.

Use callbacks when your adapter should react to match creation, player arrival, placement, completion, and runtime cleanup. Keep callback handling inside your integration layer. The minigame core should receive neutral session calls or private minigame events, not Nexori API objects.

### `registerMatchLifecycleListener`

```java
NexoriListenerRegistration registerMatchLifecycleListener(
    String rulesEngineId,
    NexoriMatchLifecycleListener listener
)
```

| Argument | Meaning |
| --- | --- |
| `rulesEngineId` | Rules engine id this listener owns. |
| `listener` | Callback object that receives lifecycle events for that rules engine. |

Registers a listener for Nexori match lifecycle events.

Use this in an integration/adapter class, not in the gameplay core. Nexori filters callbacks by `rulesEngineId`, so one arena server can host several rules mods without every mod receiving every match.

```java
NexoriListenerRegistration registration =
    nexoriApi.registerMatchLifecycleListener(
        "capture_the_zone",
        new NexoriMatchLifecycleListener() {
            @Override
            public void onPlayerArrived(NexoriPlayerMatchLifecycleEvent event) {
                minigameService.addPlayerToSession(
                    event.match().matchId(),
                    event.playerUuid(),
                    event.playerName(),
                    event.eventAtEpochMs()
                );
            }
        }
    );
```

Close the registration during integration shutdown:

```java
registration.close();
```

### `NexoriListenerRegistration`

```java
public interface NexoriListenerRegistration extends AutoCloseable {
    @Override
    void close();
}
```

The registration handle unregisters the listener.

Call `close()` when the adapter shuts down, when your plugin unloads, or when you replace the listener. `close()` is designed to be idempotent.

### `NexoriMatchLifecycleListener`

```java
public interface NexoriMatchLifecycleListener {
    default void onMatchCreated(NexoriMatchLifecycleEvent event) {}
    default void onPlayerArrived(NexoriPlayerMatchLifecycleEvent event) {}
    default void onPlayerPlacementConfirmed(NexoriPlayerPlacementLifecycleEvent event) {}
    default void onMatchPlacementCompleted(NexoriMatchLifecycleEvent event) {}
    default void onMatchStartAllowed(NexoriMatchLifecycleEvent event) {}
    default void onMatchCancellationRequested(NexoriMatchLifecycleEvent event) {}
    default void onMatchCompleted(NexoriMatchLifecycleEvent event) {}
    default void onMatchRuntimeClosed(NexoriMatchLifecycleEvent event) {}
}
```

Each method has a default no-op implementation. Override only the callbacks your adapter needs.

| Callback | Meaning and adapter action |
| --- | --- |
| `onMatchCreated` | Match-level. Nexori created/orchestrated the local match runtime. Create or attach the minigame's local session/room. Do not start gameplay from this callback. |
| `onPlayerArrived` | Player-level. Nexori associated a player with the match after arrival on the arena server. Add that player to the minigame's local session. Do not start gameplay from this callback. |
| `onPlayerPlacementConfirmed` | Player-level. One player's initial placement reached a terminal placement outcome. Update individual ready/debug/HUD state if useful. Do not start gameplay from this callback; it is per-player. |
| `onMatchPlacementCompleted` | Match-level. All expected initial players were placed. Useful for readiness/debug state, but `onMatchStartAllowed` is the recommended gameplay unlock signal. |
| `onMatchStartAllowed` | Match-level. Nexori opened the start gate. Unlock/start gameplay from this callback. It can happen after placement completes or after the initial placement window closes with `minimumInitialPlayers` satisfied. |
| `onMatchCancellationRequested` | Match-level. Nexori initiated pre-game cancellation, such as initial placement window shortfall. Abort local setup, stop countdowns, hide HUDs, cancel timers, and clean local runtime state while Nexori handles cancellation/no-contest. |
| `onMatchCompleted` | Match-level. Nexori accepted or recorded local match completion. Usually no-op, log, or mark local state completed. Avoid submitting results from this callback. |
| `onMatchRuntimeClosed` | Match-level. Nexori removed/closed the local runtime. Clean up the minigame's local session memory. Do not start gameplay from this callback. |

Your minigame core should not call Nexori directly from these callbacks. The adapter should translate callbacks into neutral service methods such as `createSession(...)`, `addPlayer(...)`, `markPlacementComplete(...)`, or `closeSession(...)`.

`onPlayerArrived` is not the same as a raw Hytale connect event. It means Nexori knows the match id, queue id, arena id, rules engine id, and player association.

`onPlayerPlacementConfirmed` is individual per player. Do not start the match from it. Use `onMatchStartAllowed` to unlock position-sensitive gameplay.

`onMatchPlacementCompleted` tells you every expected initial player was placed. `onMatchStartAllowed` is broader: it also covers partial-roster starts after the initial placement window closes and the configured minimum initial player count was met.

`onMatchCompleted` usually arrives after your adapter has already called `submitFinalMatchResult(...)` and Nexori accepted or recorded completion. Treat it as confirmation/observation, not as a result-submission hook.

### `NexoriMatchLifecycleEvent`

```java
public record NexoriMatchLifecycleEvent(
    String matchId,
    String queueId,
    String arenaId,
    String assignmentId,
    String externalMatchId,
    String rulesEngineId,
    String matchResolutionTriggerId,
    List<UUID> expectedPlayerUuids,
    List<UUID> arrivedPlayerUuids,
    List<UUID> activePlayerUuids,
    List<UUID> spectatorPlayerUuids,
    List<UUID> requiredResultPlayerUuids,
    NexoriMatchPlacementState placementState,
    String reason,
    long createdAtEpochMs,
    long eventAtEpochMs
)
```

Immutable public snapshot for a match-level lifecycle event.

| Field | Meaning |
| --- | --- |
| `matchId` | Local Nexori match id. |
| `queueId` | Queue that launched or owns the match. |
| `arenaId` | Arena/game id. |
| `assignmentId` | Backend assignment id, when available. |
| `externalMatchId` | Backend-owned match id, when available. |
| `rulesEngineId` | Rules mod id that should control the match. |
| `matchResolutionTriggerId` | Deprecated legacy compatibility field. Usually `"none"`. Use `rulesEngineId` instead. |
| `expectedPlayerUuids` | Players expected by launch context. |
| `arrivedPlayerUuids` | Players that reached the arena runtime. |
| `activePlayerUuids` | Players still active in the match runtime. |
| `spectatorPlayerUuids` | Players marked as logical spectators. |
| `requiredResultPlayerUuids` | Players that must have an outcome before final submit. |
| `placementState` | Current placement snapshot for the match. |
| `reason` | Nexori lifecycle reason for the event. |
| `createdAtEpochMs` | Match creation time. |
| `eventAtEpochMs` | Event emission time. |

Lists are immutable snapshots. Do not mutate or store them as your only runtime state; copy the data you need into your own session model.

### `NexoriPlayerMatchLifecycleEvent`

```java
public record NexoriPlayerMatchLifecycleEvent(
    NexoriMatchLifecycleEvent match,
    UUID playerUuid,
    String playerName,
    String playerAssignmentId,
    String reason,
    long eventAtEpochMs
)
```

Immutable public snapshot for a player-scoped match lifecycle event.

| Field | Meaning |
| --- | --- |
| `match` | Match-level lifecycle snapshot. |
| `playerUuid` | Player UUID for this event. |
| `playerName` | Current player name when known. |
| `playerAssignmentId` | Backend/player assignment id when available. |
| `reason` | Nexori lifecycle reason for the player event. |
| `eventAtEpochMs` | Event emission time. |

Use this for player association events such as `onPlayerArrived`.

### `NexoriPlayerPlacementLifecycleEvent`

```java
public record NexoriPlayerPlacementLifecycleEvent(
    NexoriPlayerMatchLifecycleEvent player,
    NexoriPlayerPlacementOutcome placementOutcome,
    NexoriMatchPlacementState placementState,
    String worldName,
    String instanceTemplateId,
    long eventAtEpochMs
)
```

Immutable public snapshot for an individual player's initial placement lifecycle.

| Field | Meaning |
| --- | --- |
| `player` | Player-scoped lifecycle snapshot. |
| `placementOutcome` | Terminal placement outcome for this player. |
| `placementState` | Match placement snapshot at this point. |
| `worldName` | World name involved in placement when known. |
| `instanceTemplateId` | Instance template id involved in placement when known. |
| `eventAtEpochMs` | Event emission time. |

Use this for individual ready/debug/HUD state. Do not use it to start gameplay for the whole match.

### `NexoriPlayerPlacementOutcome`

```java
public enum NexoriPlayerPlacementOutcome {
    CONFIRMED,
    FALLBACK
}
```

| Value | Meaning |
| --- | --- |
| `CONFIRMED` | Nexori confirmed the player's initial placement. |
| `FALLBACK` | Nexori reached a terminal fallback placement path for that player. |

Both values are terminal for the individual player placement event. The match as a whole should still wait for `onMatchStartAllowed`.

## Match Lookup

The methods in this section are direct/simple queries. Use them for commands, diagnostics, admin tools, or integrations that intentionally call `NexoriMinigameApi` directly. Optional adapters should use lifecycle callbacks to populate their local session model.

### `findActiveMatchId`

```java
Optional<String> findActiveMatchId(UUID playerUuid)
```

| Argument | Meaning |
| --- | --- |
| `playerUuid` | Player UUID to check. |

Returns the active Nexori match id for the player, or `Optional.empty()` if the player is not currently in an active Nexori match.

Use this when you need to look up a player's active match from a command, admin tool, diagnostic flow, or direct integration.

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

Use this when a direct integration, command, or diagnostic tool needs a full active match snapshot.

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
| `rulesEngineId` | Rules mod id that should control the match. |
| `matchResolutionTriggerId` | Deprecated legacy compatibility field. Usually `"none"`. Use `rulesEngineId` instead. This exists only for older integrations and will be removed in a future API cleanup. |
| `expectedPlayerUuids` | Players expected by launch context. |
| `arrivedPlayerUuids` | Players that reached the arena runtime. |
| `activePlayerUuids` | Players still active in the match runtime. |
| `eliminatedPlayerUuids` | Players marked eliminated by Nexori/runtime state. |
| `spectatorPlayerUuids` | Players marked as logical spectators. |
| `afkPlayerUuids` | Players currently marked AFK in Nexori's local/runtime AFK state. |
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

Call this if you only need ownership and do not need the full `NexoriActiveMatchInfo` snapshot.

```java
boolean ownedByThisMod = nexoriApi.findRulesEngineId(matchId)
    .filter("skywars"::equals)
    .isPresent();
```

### `findMatchPlacementState`

```java
Optional<NexoriMatchPlacementState> findMatchPlacementState(String matchId)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |

Returns Nexori's initial placement snapshot.

Use this in direct integrations when you need the current placement/start-gate snapshot. Modern callback adapters should prefer lifecycle callbacks and use `onMatchStartAllowed` as the gameplay unlock signal.

```java
NexoriMatchPlacementState placement = nexoriApi.findMatchPlacementState(matchId).orElse(null);
if (placement == null || !placement.startGateOpen()) {
    return;
}
```

`NexoriMatchPlacementState`:

```java
public record NexoriMatchPlacementState(
    int expectedPlayers,
    int arrivedPlayers,
    int placedPlayers,
    boolean placementComplete,
    int minimumInitialPlayers,
    boolean initialPlacementWindowOpen,
    long initialPlacementWindowStartedAtEpochMs,
    long initialPlacementWindowExpiresAtEpochMs,
    long initialPlacementWindowClosedAtEpochMs,
    String initialPlacementWindowCloseReason,
    boolean startGateOpen,
    long startGateOpenedAtEpochMs,
    String startGateOpenReason
)
```

| Field | Meaning |
| --- | --- |
| `expectedPlayers` | Players Nexori expects for the match. |
| `arrivedPlayers` | Players that arrived at the arena runtime. |
| `placedPlayers` | Players that completed initial placement. |
| `placementComplete` | `true` once all expected initial players were placed. |
| `minimumInitialPlayers` | Minimum placed initial players required for the initial placement window to allow a partial-roster start. |
| `initialPlacementWindowOpen` | `true` while Nexori is still waiting for initial placement/window resolution. |
| `initialPlacementWindowStartedAtEpochMs` | Time the initial placement window opened, or `0`. |
| `initialPlacementWindowExpiresAtEpochMs` | Deadline for the initial placement window, or `0`. |
| `initialPlacementWindowClosedAtEpochMs` | Time the initial placement window closed, or `0`. |
| `initialPlacementWindowCloseReason` | Reason the initial placement window closed. |
| `startGateOpen` | `true` once gameplay may start. This can be true even when `placementComplete=false` if the window closed and `minimumInitialPlayers` was satisfied. |
| `startGateOpenedAtEpochMs` | Time the start gate opened, or `0`. |
| `startGateOpenReason` | Reason Nexori opened the start gate. |

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
    // Make sure each player has an accumulated WIN, LOSS, DISCONNECTED, or NO_CONTEST outcome.
}
```

`requiredPlayerUuids` is a stable union of:

- `expectedPlayerUuids`
- `arrivedPlayerUuids`
- `activePlayerUuids`
- `eliminatedPlayerUuids`

This prevents backfill players or later arrivals from being left out of the final player set the rules mod must resolve.

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
| `outcome` | `WIN`, `LOSS`, `DISCONNECTED`, or `NO_CONTEST`. |
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
| `NO_CONTEST` | Does not mark the player eliminated. Intended for match-cancel or no-contest outcomes. |
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

NexoriSetPlayerSpectatorResult setPlayerSpectator(
    String matchId,
    UUID playerUuid,
    boolean spectator,
    String reason,
    String spectatorModelId
)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |
| `playerUuid` | Player to update. |
| `spectator` | `true` to mark spectator, `false` to clear it. |
| `reason` | Short reason for logs/debugging. |
| `spectatorModelId` | Optional temporary spectator model id for the 5-argument overload. |

Stores logical spectator state for one player.

The 4-argument overload only stores logical spectator state. The 5-argument overload also lets Nexori attempt a temporary spectator model while the player is online. This is not a promise of full camera, invisibility, noclip, teleporting, or visual spectator controls.

Call this when your rules mod wants Nexori to know that a player is still in the match context but no longer actively playing.

```java
nexoriApi.setPlayerSpectator(
    matchId,
    playerUuid,
    true,
    "eliminated_can_watch"
);
```

This is logical state only unless you use the optional model-id overload and the model can be applied.

Status values:

| Value | Meaning |
| --- | --- |
| `UPDATED` | Spectator state was stored. |
| `MATCH_MISSING` | Match does not exist. |
| `PLAYER_MISSING` | Player does not belong to the match. |
| `MATCH_ALREADY_COMPLETED` | Match was already completed. |
| `INVALID_REASON` | Reason failed validation. |

## AFK Activity And Detection

AFK is local/runtime state exposed to minigame integrations. It appears in active match snapshots through `afkPlayerUuids`, dispatches optional callbacks, and may be included in final backend result reporting through `customData.nexoriAfk`.

This AFK API only affects local runtime state. It does not send live backend AFK checks or change the match cancellation policy.

### `registerAfkActivityListener`

```java
NexoriListenerRegistration registerAfkActivityListener(
    String rulesEngineId,
    NexoriAfkActivityListener listener
)
```

Registers AFK callbacks for one rules engine id.

```java
public interface NexoriAfkActivityListener {
    default void onPlayerAfkChanged(NexoriPlayerAfkChangedEvent event) {}
}
```

Use this when your minigame wants to react to Nexori's local AFK state changes without polling active match snapshots.

### `NexoriPlayerAfkChangedEvent`

```java
public record NexoriPlayerAfkChangedEvent(
    String matchId,
    String queueId,
    String arenaId,
    String rulesEngineId,
    UUID playerUuid,
    String playerName,
    boolean afk,
    long changedAtEpochMs,
    long idleMs,
    NexoriAfkActivitySource source
)
```

| Field | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |
| `queueId` | Queue that launched or owns the match. |
| `arenaId` | Arena/game id. |
| `rulesEngineId` | Rules mod id for callback routing. |
| `playerUuid` | Player whose AFK state changed. |
| `playerName` | Player name snapshot when known. |
| `afk` | New AFK state. |
| `changedAtEpochMs` | Event time. |
| `idleMs` | Player idle duration at the transition point. |
| `source` | Source of the AFK transition. |

Typical uses:

- update minigame HUD/state
- pause or mark a player in your own runtime
- mirror AFK status into mode-specific stats

### `NexoriAfkActivitySource`

| Value | Meaning |
| --- | --- |
| `UNKNOWN` | Source was not specified. |
| `IDLE_TIMEOUT` | Nexori's local inactivity detector marked the player AFK. |
| `PLAYER_INPUT` | Player input/activity marked the player active. |
| `INVENTORY_PACKET` | Inventory activity marked the player active. |
| `POLICY_CHANGE` | A policy change reset or changed AFK state. |
| `EXTERNAL_API` | A minigame integration changed AFK state through the public API. |

### `NexoriAfkDetectionPolicy`

```java
public record NexoriAfkDetectionPolicy(
    boolean enabled,
    int inactivityTimeoutSeconds
)
```

| Field | Meaning |
| --- | --- |
| `enabled` | Whether Nexori's built-in local detector should run for this scope. |
| `inactivityTimeoutSeconds` | Idle timeout before a player becomes AFK. Default `30`, minimum `5`, maximum `3600`. |

`NexoriAfkDetectionPolicy.defaults()` returns `enabled=false` and `inactivityTimeoutSeconds=30`. Runtime policies may be enabled at match or player scope. `inactivityTimeoutSeconds` is clamped/validated between `5` and `3600` seconds.

If a minigame wants full AFK control, it can disable built-in detection with policy overrides and then call `setPlayerAfk(...)` from its own logic.

### AFK Policy Overrides

```java
NexoriSetAfkDetectionPolicyResult setMatchAfkDetectionPolicy(
    NexoriSetMatchAfkDetectionPolicyRequest request
)

NexoriSetAfkDetectionPolicyResult clearMatchAfkDetectionPolicy(String matchId)

NexoriSetAfkDetectionPolicyResult setPlayerAfkDetectionPolicy(
    NexoriSetPlayerAfkDetectionPolicyRequest request
)

NexoriSetAfkDetectionPolicyResult clearPlayerAfkDetectionPolicy(
    String matchId,
    UUID playerUuid
)
```

Requests:

```java
public record NexoriSetMatchAfkDetectionPolicyRequest(
    String matchId,
    NexoriAfkDetectionPolicy policy
) {
}

public record NexoriSetPlayerAfkDetectionPolicyRequest(
    String matchId,
    UUID playerUuid,
    NexoriAfkDetectionPolicy policy
) {
}
```

Status values:

| Value | Meaning |
| --- | --- |
| `UPDATED` | Policy override was stored. |
| `CLEARED` | Policy override was cleared. |
| `MATCH_MISSING` | Match does not exist. |
| `PLAYER_MISSING` | Player does not belong to the match. |
| `MATCH_ALREADY_COMPLETED` | Match was already completed. |
| `INVALID_POLICY` | Request or policy was invalid. |
| `NOT_SUPPORTED` | API implementation does not support runtime AFK policy overrides. |

### `setPlayerAfk`

```java
NexoriSetPlayerAfkResult setPlayerAfk(
    NexoriSetPlayerAfkRequest request
)
```

Request:

```java
public record NexoriSetPlayerAfkRequest(
    String matchId,
    UUID playerUuid,
    boolean afk,
    String reason,
    boolean showHud
) {
}
```

`showHud` controls whether Nexori shows its AFK HUD when marking a player AFK externally. Set it to `false` if your minigame handles its own AFK feedback.

Status values:

| Value | Meaning |
| --- | --- |
| `UPDATED` | AFK state changed. |
| `UNCHANGED` | Player was already in the requested AFK state. |
| `MATCH_MISSING` | Match does not exist. |
| `PLAYER_MISSING` | Player does not belong to the match. |
| `MATCH_ALREADY_COMPLETED` | Match was already completed. |
| `INVALID_REQUEST` | Request, match id, or player UUID was invalid. |
| `NOT_SUPPORTED` | API implementation does not support external AFK control. |

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
| Winner | Requires at least one `WIN` unless all required players are `NO_CONTEST`. |
| Custom data | Must be a valid JSON object within limits. |

Result:

| Field | Meaning |
| --- | --- |
| `matchStatus` | Local match completion status. |
| `backendReportStatus` | Backend reporting status, separate from local completion. |
| `resultId` | Durable result id when backend reporting was queued or matched. |
| `message` | Human-readable detail for logs. |

`matchStatus` is the local acceptance state for the final result inside Nexori. `backendReportStatus` is separate and describes what happened with optional backend reporting. A match can complete locally even when backend reporting is disabled, missing an external match id, already submitted, or queued for retry.

`NexoriMatchCompletionStatus`:

| Value | Meaning |
| --- | --- |
| `ACCEPTED` | Nexori accepted the final result locally. |
| `ALREADY_SUBMITTED` | The match already has a submitted final result. |
| `MATCH_MISSING` | Nexori does not know that match id. |
| `INVALID_RESULT` | The submitted result failed local validation. |

`NexoriBackendReportStatus`:

| Value | Meaning |
| --- | --- |
| `QUEUED` | Backend result reporting was queued for sending. |
| `DISABLED` | Backend result reporting is disabled or not usable for this match. |
| `EXTERNAL_MATCH_MISSING` | The match completed locally, but has no backend-owned `externalMatchId` for result reporting. |
| `STORE_FAILED` | Nexori could not persist the pending backend report. |
| `ALREADY_SUBMITTED` | The same local result was already submitted. |
| `DUPLICATE_CONFLICT` | A different final result was already submitted for the match. |
| `NOT_ATTEMPTED` | Backend reporting was not attempted because local completion failed or the request was invalid. |

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

Result:

```java
public record NexoriCloseMatchAdmissionResult(
    NexoriCloseMatchAdmissionStatus status,
    String matchId,
    boolean closedLocally,
    String message
)
```

| Field | Meaning |
| --- | --- |
| `status` | Result status for the close request. |
| `matchId` | Normalized match id the request targeted. |
| `closedLocally` | `true` when Nexori closed admission in local runtime, even if backend reporting was disabled/unusable. |
| `message` | Human-readable detail for logs. |

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

## Current Result Methods

Nexori's public result API is intentionally explicit.

Use these result methods:

1. `setPlayerOutcome(...)`
2. `setPlayerSpectator(...)` when needed
3. `submitFinalMatchResult(...)`
4. `returnPlayerToLobby(...)` when players should leave the arena

## Legacy Compatibility

### `findMatchResolutionTriggerId` Deprecated

```java
@Deprecated(forRemoval = true)
Optional<String> findMatchResolutionTriggerId(String matchId)
```

| Argument | Meaning |
| --- | --- |
| `matchId` | Active Nexori match id. |

Returns `"none"` for active matches for older integrations that treated this field as manual/custom resolution. New mods should use `rulesEngineId` from `NexoriActiveMatchInfo` or `NexoriMatchLifecycleEvent` to identify the rules engine that owns the match.

Do not use this method for new ownership checks. It exists only for compatibility and will be removed in a future API cleanup.
