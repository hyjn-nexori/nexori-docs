# Nexori Docs

Documentation site for Nexori, built with VitePress.

## Requirements

- Node.js 20+
- npm

## Local Development

```powershell
npm install
npm run docs:dev
```

Then open the local URL printed by VitePress.

## Build

```powershell
npm run docs:build
npm run docs:preview
```

## Cloudflare Pages

Suggested production settings:

- Build command: `npm run docs:build`
- Output directory: `docs/.vitepress/dist`
- Custom domain: `docs.hyjn-nexori.com`
