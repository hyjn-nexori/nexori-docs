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
        { text: "Backend", link: "/backend/overview" },
        { text: "API Guide", link: "/public-api/minigame-api" },
        { text: "Javadoc", link: "/public-api/generated-reference" },
        { text: "Download", link: "https://www.curseforge.com/hytale/mods/nexori" }
      ],
      sidebar: [
        {
          text: "Backend Integration",
          items: [
            { text: "Overview", link: "/backend/overview" },
            { text: "Configuration", link: "/backend/configuration" },
            { text: "Sync Endpoint", link: "/backend/sync-endpoint" },
            { text: "Results Endpoint", link: "/backend/results-endpoint" },
            { text: "Match Admission State Endpoint", link: "/backend/match-admission-state-endpoint" }
          ]
        },
        {
          text: "API Guide",
          items: [
            { text: "Minigame API", link: "/public-api/minigame-api" },
            { text: "Integrating Third-Party Minigames", link: "/public-api/integrating-third-party-minigames" },
            { text: "Methods", link: "/public-api/methods" },
            { text: "Recommended Flow", link: "/public-api/recommended-flow" },
            { text: "Javadoc Reference", link: "/public-api/generated-reference" }
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
