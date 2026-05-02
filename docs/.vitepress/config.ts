import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "Nexori",
    description: "Backend-driven matchmaking and minigame infrastructure for Hytale servers.",
    cleanUrls: true,
    themeConfig: {
      logo: "/images/nexori-mark.svg",
      nav: [
        { text: "Guide", link: "/guide/getting-started" },
        { text: "Concepts", link: "/concepts/backend-driven-matchmaking" },
        { text: "Backend", link: "/backend/configuration" },
        { text: "Public API", link: "/public-api/minigame-api" }
      ],
      sidebar: [
        {
          text: "Guide",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" }
          ]
        },
        {
          text: "Concepts",
          items: [
            { text: "Backend-Driven Matchmaking", link: "/concepts/backend-driven-matchmaking" },
            { text: "Result Reporting", link: "/concepts/result-reporting" }
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
          text: "Public API",
          items: [
            { text: "Minigame API", link: "/public-api/minigame-api" }
          ]
        }
      ],
      socialLinks: [
        { icon: "github", link: "https://github.com/" }
      ],
      search: {
        provider: "local"
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

