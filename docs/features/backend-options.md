# Backend Options

Nexori does not require a backend.

You can use Nexori standalone with local queues and local match launches. When you need external control, Nexori can integrate with your own backend.

## Without A Backend

Use this for:

- casual queues
- local minigames
- small server setups
- simple testing
- modes that do not need rankings or external history

`LOCAL_FIFO` queues continue to work without any backend dependency.

## With A Backend

Use this when you want your own service to own decisions like:

- matchmaking algorithms
- ELO or Glicko
- ranked queues
- tournaments
- leaderboards
- player history
- region-aware routing
- load-aware match placement

Nexori syncs state to your backend with `POST /nexori/sync`, and your backend returns assignments in Nexori's expected format.

## Result Reporting

Result reporting is separate from matchmaking sync.

When enabled, Nexori sends completed match results to `POST /nexori/results`. For third-party rules mods, the mod decides the final result through the Public API and can pass custom minigame data at final submit time.

