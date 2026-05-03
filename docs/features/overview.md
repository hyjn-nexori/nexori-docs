# Nexori Features

Nexori is the safety, transport, and orchestration layer for Hytale servers that want portals, queues, minigames, arena instances, return-to-lobby flows, and optional backend-driven matchmaking.

It can stay simple, or it can become part of a larger server network.

## What You Can Build

| Setup | What Nexori Handles |
| --- | --- |
| One lobby server plus one minigame server | Secure travel from lobby to arena server, instance launch, placement, and match return. |
| Lobby plus adventure worlds | Portals that move players and player data between server worlds while preserving the transfer flow. |
| Lobby plus minigames plus adventure portals | A mixed network where minigames and adventure destinations live side by side. |
| Minigames without a backend | `LOCAL_FIFO` queues where Nexori matches players locally. |
| Minigames with your own backend | `BACKEND_DRIVEN` queues where your backend decides assignments, ELO, region, tournaments, or custom matchmaking. |
| Custom rules mods | Third-party minigames can use Nexori's Public API to integrate with match state, outcomes, return-to-lobby, and result reporting. |

## Nexori's Role

Nexori is not trying to own every game rule.

Nexori owns infrastructure:

- safe travel between servers
- portal and queue entry points
- minigame launch orchestration
- arena/game definitions
- instance/template launch context
- player arrival and placement handoff
- return-to-lobby
- local FIFO matchmaking
- backend-driven assignment execution
- optional result reporting

Your minigame or backend owns game-specific logic:

- ELO, ranking, tournaments, and matchmaking algorithms
- damage, kills, assists, objectives, beds broken, flags captured, or custom stats
- mode-specific winner/loser decisions
- spectator behavior and player lifecycle rules
- custom result data

## Start Simple

You can start with `LOCAL_FIFO` queues and no external backend. In the current in-game setup flow, minigame launches are configured from a lobby/source server into a destination arena server.

When you need more control, you can add:

- backend-driven queues
- result reporting
- custom minigame rules mods
- external ranking and player history systems

The important idea is that Nexori lets your setup grow without forcing every server to become complicated on day one.
