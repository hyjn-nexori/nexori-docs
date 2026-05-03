# Server Layouts

Nexori can support small and larger layouts. The right shape depends on how much separation you want between lobby, minigames, and adventure content.

## Lobby Plus Arena Server

A common production-style setup is:

- one lobby server
- one or more arena/minigame servers

The lobby owns queue entry. The arena server owns match runtime, placement, completion, and return flow.

## Adventure Worlds

Nexori can also be useful even when you are not running minigames.

You can use portals and travel flows to connect:

- lobby worlds
- adventure worlds
- social hubs
- event worlds
- private or public destinations

## Mixed Networks

You can combine these ideas:

- a lobby with portals to adventure servers
- queues that launch minigame instances
- backend-driven ranked modes
- local casual queues
- custom third-party minigames using the Public API

Nexori's job is to keep the transport and orchestration layer consistent across those paths.
