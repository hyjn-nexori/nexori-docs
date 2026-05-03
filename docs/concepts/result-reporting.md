# Result Reporting

Result reporting is event-driven. Arena servers do not need to run matchmaking heartbeat just to report match results.

```mermaid
flowchart TD
    Z["Minigame is running"] --> A["Rules mod collects stats"]
    A --> B["Rules mod decides match is complete"]
    B --> C["NexoriMinigameApi.submitFinalMatchResult(...)"]
    C --> D["Validate outcomes"]
    D --> E["Complete match locally"]
    E --> F["Return selected players"]
    E --> G{"Result reporting configured?"}
    G -- "No" --> H["No backend request is sent"]
    G -- "Yes" --> I["Store durable pending result"]
    I --> J["POST /nexori/results"]
    J --> K{"Backend response"}
    K -- "ACCEPTED/DUPLICATE" --> L["Mark ACKNOWLEDGED"]
    K -- "Retryable error" --> M["Retry with backoff"]
    K -- "Permanent error" --> N["Mark FAILED_PERMANENT"]
```

## Important

`submitFinalMatchResult(...)` completes the match locally even when backend result reporting is disabled.

The rules mod should collect minigame-specific stats while the match is running, then pass them as `customData` when it submits the final result.

Return-to-lobby is intentionally separate. A rules mod can return all players after final result submission, return only eliminated players earlier, or keep eliminated players as logical spectators until the match ends.
