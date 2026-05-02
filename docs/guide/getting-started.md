# Getting Started

Nexori supports two queue modes:

- `LOCAL_FIFO`: Nexori performs local queue matching.
- `BACKEND_DRIVEN`: Nexori keeps players in queue, sends a server sync to your backend, validates assignments, and launches matches through the existing travel flow.

## Local Docs

```powershell
npm install
npm run docs:dev
```

## Recommended Deployment

Use Cloudflare Pages with:

- Build command: `npm run docs:build`
- Output directory: `docs/.vitepress/dist`
- Custom domain: `docs.hyjn-nexori.com`

