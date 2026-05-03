# Portals And Travel

Portals are one of Nexori's main player-facing entry points.

They can send players to:

- another world
- another server
- a queue
- a lobby return destination
- an adventure destination
- a minigame launch flow

## Safe Travel

Nexori treats travel as infrastructure. The goal is not only to move a player, but to move them with enough context for the destination server to understand why they arrived.

That context can include:

- source server
- portal id
- queue id
- arena/game id
- match identity
- return-to-lobby information

## Return-To-Lobby

Minigames need a clean way to send players back after a match.

Nexori can schedule return-to-lobby separately from result submission. This separation is important for modes where eliminated players may stay as spectators, use a return item, or leave later.

