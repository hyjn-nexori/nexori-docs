# Minigames And Queues

Nexori provides the infrastructure for queueing players and launching them into reusable arena/game definitions.

## Local FIFO

`LOCAL_FIFO` is the standalone mode.

Nexori keeps players in queue, forms matches locally, launches the selected arena/game, and returns players when the match is complete.

Use this when you want Nexori to work without any backend service.

## Backend Driven

`BACKEND_DRIVEN` keeps queue membership in Nexori but moves matchmaking decisions to your backend.

Your backend can decide:

- ELO or rating-based matches
- region preferences
- tournament brackets
- server load
- custom player grouping
- future backfill policies

Nexori still validates returned assignments and executes the launch.

## Built-In And Custom Minigames

Nexori can provide ready-to-use minigame infrastructure, but it also exposes a Public API for third-party rules mods.

A custom rules mod can:

- detect the active Nexori match
- verify `rulesEngineId`
- wait for player placement
- set player outcomes
- mark logical spectators
- submit the final result
- include custom minigame data for backend reporting
- return selected players to lobby

