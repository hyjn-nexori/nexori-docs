---
layout: home

hero:
  name: Nexori
  text: Backend-driven matchmaking for Hytale servers
  tagline: Keep Nexori standalone-friendly while letting external services own matchmaking, ranking, and player history.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Backend Flow
      link: /concepts/backend-driven-matchmaking

features:
  - title: Standalone First
    details: LOCAL_FIFO queues continue to work without any backend dependency.
  - title: Backend Driven
    details: BACKEND_DRIVEN queues send server snapshots to your backend and execute returned assignments.
  - title: Result Reporting
    details: Rules mods can submit completed match results without requiring matchmaking heartbeat on arena servers.
---

## Hello World

This documentation site is ready. Start by editing Markdown files under `docs/`.

```json
{
  "hello": "nexori",
  "docs": "vitepress"
}
```

