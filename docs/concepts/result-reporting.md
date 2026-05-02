# Result Reporting

Result reporting is event-driven. Arena servers do not need to run matchmaking heartbeat just to report match results.

```mermaid
flowchart TD
    A["Rules mod decides match is complete"] --> B["NexoriMinigameApi.submitMatchResult(...)"]
    B --> C["Nexori validates complete player outcomes"]
    C --> D["Nexori completes the match locally"]
    D --> E["Return-to-lobby flow runs"]
    D --> F{"Result reporting configured?"}
    F -- "No" --> G["No backend request is sent"]
    F -- "Yes" --> H["Store durable pending result"]
    H --> I["POST /nexori/results"]
    I --> J{"Backend response"}
    J -- "ACCEPTED/DUPLICATE" --> K["Mark ACKNOWLEDGED"]
    J -- "Retryable error" --> L["Retry with backoff"]
    J -- "Permanent error" --> M["Mark FAILED_PERMANENT"]
```

## Important

`submitMatchResult(...)` completes the match locally even when backend result reporting is disabled.

