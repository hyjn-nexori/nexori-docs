# Minigame API

Rules mods should use Nexori's public minigame API to complete matches and optionally report results.

## Result Requirements

Use `findMatchResultRequirements(matchId)` before submitting a result. This tells the rules mod which players need outcomes.

## Submit Result

Use `submitMatchResult(...)` when the match is complete.

Outcomes supported in V1B:

- `WIN`
- `LOSS`
- `DISCONNECTED`

`DRAW` is intentionally not part of V1B.

