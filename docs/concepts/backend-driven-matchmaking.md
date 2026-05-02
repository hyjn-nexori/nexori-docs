# Backend-Driven Matchmaking

Backend-driven matchmaking lets Nexori execute matches without owning the matchmaking algorithm.

```mermaid
sequenceDiagram
    participant Player
    participant Lobby as Nexori Lobby Server
    participant Backend
    participant Arena as Arena Server
    participant Rules as Rules Mod

    Player->>Lobby: Enters BACKEND_DRIVEN queue
    Lobby->>Backend: POST /nexori/sync with queue snapshot
    Backend->>Backend: Runs matchmaking algorithm
    Backend-->>Lobby: CREATE_MATCH assignment
    Lobby->>Lobby: Validates queue, players, arena, destination
    Lobby->>Backend: Sends LAUNCHED/REJECTED/FAILED ACK on next sync
    Lobby->>Arena: Secure travel with match identity
    Arena->>Arena: Tracks localMatchId, externalMatchId, assignmentId
    Rules->>Arena: Submits completed match result
    Arena->>Backend: POST /nexori/results
    Arena->>Player: Return-to-lobby flow
```

## Ownership

Nexori owns:

- Queue integration.
- Secure travel.
- Match environment lifecycle.
- Return-to-lobby.
- Result reporting transport.

The backend owns:

- Matchmaking decisions.
- Rating and ranking.
- Leaderboards.
- Tournaments.
- Player history.

The rules mod owns:

- Who wins or loses.
- When the match ends.
- Mode-specific stats.
- Objectives and loadouts.

