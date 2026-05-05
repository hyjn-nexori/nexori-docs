import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "Nexori",
    description: "Backend-driven matchmaking and minigame infrastructure for Hytale servers.",
    cleanUrls: true,
    themeConfig: {
      logo: "/images/nexori-logo-transparent.png",
      nav: [
        { text: "Nexori Features", link: "/features/overview" },
        { text: "Concepts", link: "/concepts/backend-driven-matchmaking" },
        { text: "Backend", link: "/backend/configuration" },
        { text: "Public API", link: "/public-api/minigame-api" },
        { text: "Download", link: "https://www.curseforge.com/hytale/mods/nexori" }
      ],
      sidebar: [
        {
          text: "Nexori Features",
          items: [
            { text: "Overview", link: "/features/overview" },
            { text: "Server Layouts", link: "/features/server-layouts" },
            { text: "Portals And Travel", link: "/features/portals-travel" },
            { text: "Minigames And Queues", link: "/features/minigames-queues" },
            { text: "Backend Options", link: "/features/backend-options" }
          ]
        },
        {
          text: "Concepts",
          items: [
            { text: "Backend-Driven Matchmaking", link: "/concepts/backend-driven-matchmaking" },
            { text: "Result Reporting", link: "/concepts/result-reporting" },
            { text: "Rules Mod Ownership", link: "/concepts/rules-mod-ownership" }
          ]
        },
        {
          text: "Backend Integration",
          items: [
            { text: "Configuration", link: "/backend/configuration" },
            { text: "Sync Endpoint", link: "/backend/sync-endpoint" },
            { text: "Results Endpoint", link: "/backend/results-endpoint" }
          ]
        },
        {
          text: "Releases",
          items: [
            { text: "Nexori 2.2.0", link: "/releases/2.2.0" }
          ]
        },
        {
          text: "Public API",
          items: [
            { text: "Minigame API", link: "/public-api/minigame-api" },
            { text: "Methods", link: "/public-api/methods" },
            { text: "Recommended Flow", link: "/public-api/recommended-flow" }
          ]
        },
        {
          text: "Legal",
          items: [
            { text: "License", link: "/legal/license" },
            { text: "License FAQ", link: "/legal/license-faq" },
            { text: "Trademarks", link: "/legal/trademarks" }
          ]
        }
      ],
      socialLinks: [
        { icon: "github", link: "https://github.com/hyjn-nexori/nexori-plugin" }
      ],
      search: {
        provider: "local"
      },
      footer: {
        message: 'Join the <a href="https://discord.gg/c2HpvAzU" target="_blank" rel="noreferrer">Nexori Discord</a> · <a href="/legal/license">License</a> · <a href="/legal/license-faq">License FAQ</a> · <a href="/legal/trademarks">Trademarks</a>',
        copyright: "Copyright &copy; 2026 Janiel Joel Núñez Quintana. Nexori is source-available software, not open source."
      }
    },
    markdown: {
      theme: {
        light: "github-light",
        dark: "github-dark"
      }
    },
    mermaid: {
      theme: "default"
    }
  })
);
