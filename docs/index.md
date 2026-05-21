---
layout: home

hero:
  name: Nexori
  text: Backend-driven matchmaking for Hytale servers
  tagline: Keep Nexori standalone-friendly while letting external services own matchmaking, ranking, and player history.
  image:
    src: /images/nexori-logo-transparent.png
    alt: Nexori logo
  actions:
    - theme: brand
      text: Download
      link: https://www.curseforge.com/hytale/mods/nexori
    - theme: alt
      text: Nexori Features
      link: /features/overview
    - theme: alt
      text: Backend Integration
      link: /backend/configuration
    - theme: alt
      text: Third-Party Minigame Mods
      link: /public-api/integrating-third-party-minigames

features:
  - title: Standalone First
    details: "Start simple without a backend: Nexori can manage queues locally with FIFO-style matchmaking."
  - title: Backend Driven
    details: Let your backend take over queue matchmaking when you need ELO, regions, tournaments, load balancing, or custom assignment logic.
  - title: Minigame Mod API
    details: Third-party rules mods can use lifecycle callbacks and a small adapter layer to stay independent from Nexori while still reporting results cleanly.
---

<section class="nexori-mission">
  <p class="mission-kicker">Why Nexori Exists</p>
  <h2>Infrastructure for creators who want control.</h2>
  <p class="mission-lead">
    Nexori helps Hytale server owners build serious multiplayer experiences without giving up control of their business, backend, minigames, or revenue model.
  </p>

  <div class="mission-grid">
    <article>
      <span>Transparent</span>
      <h3>Source-available by design</h3>
      <p>Server teams can inspect how travel, queues, match launches, result reporting, and backend integration work before trusting Nexori in production.</p>
    </article>
    <article>
      <span>Creator-owned</span>
      <h3>No royalties or revenue share</h3>
      <p>You can monetize your own servers, run your own backend, design your own minigames, and keep your own economy.</p>
    </article>
    <article>
      <span>Ecosystem-first</span>
      <h3>Built to help Hytale servers grow</h3>
      <p>The goal is to make high-quality server development easier, safer, and more accessible for creators building ambitious content.</p>
    </article>
  </div>
</section>

<section class="nexori-support">
  <div>
    <p class="support-kicker">Support Nexori</p>
    <h2>Help Nexori keep growing.</h2>
    <p>
      Nexori is built to help more creators launch ambitious Hytale servers. If the project helps your server, your community, or your learning, donations are deeply appreciated and help keep development moving.
    </p>
  </div>
  <a class="support-button" href="https://www.paypal.com/donate/?business=9UXXL2D2WKAYS&no_recurring=0&item_name=Any+amount+helps+Nexori+grow.+Please+verify+you+came+from+CurseForge+or+the+official+hyjn-nexori.com+website.+Thank+you+always.&currency_code=USD" target="_blank" rel="noreferrer" aria-label="Donate with PayPal">
    <img src="/images/paypal.svg" alt="PayPal">
  </a>
</section>

<style>
.VPHomeHero .actions {
  width: max-content;
  max-width: min(920px, calc(100vw - 48px));
}

.VPHomeHero .action {
  flex-shrink: 0;
}

.nexori-mission {
  margin-top: 64px;
  padding-top: 40px;
  border-top: 1px solid var(--vp-c-divider);
}

.mission-kicker {
  margin: 0 0 16px;
  color: var(--vp-c-brand-1);
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.nexori-mission h2 {
  margin: 0;
  max-width: 720px;
  font-size: 1.55rem;
  line-height: 1.28;
}

.mission-lead {
  max-width: 820px;
  margin: 18px 0 28px;
  color: var(--vp-c-text-2);
  font-size: 1.08rem;
  line-height: 1.75;
}

.mission-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.mission-grid article {
  padding: 22px;
  border: 1px solid var(--vp-c-divider);
  border-left: 3px solid var(--vp-c-brand-1);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.mission-grid span {
  color: var(--vp-c-brand-1);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mission-grid h3 {
  margin: 10px 0 8px;
  font-size: 1.05rem;
}

.mission-grid p {
  margin: 0;
  color: var(--vp-c-text-2);
  line-height: 1.65;
}

.nexori-support {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  margin-top: 28px;
  padding: 26px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--vp-c-brand-1) 18%, transparent), transparent 58%),
    var(--vp-c-bg-soft);
}

.support-kicker {
  margin: 0 0 12px;
  color: var(--vp-c-brand-1);
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.nexori-support h2 {
  margin: 0;
  font-size: 1.35rem;
}

.nexori-support p:not(.support-kicker) {
  max-width: 760px;
  margin: 10px 0 0;
  color: var(--vp-c-text-2);
  line-height: 1.65;
}

.support-button {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 260px;
  height: 64px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #ffc439;
  text-decoration: none;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
  line-height: 1;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.support-button:hover {
  background: #f2ba36;
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);
}

.support-button img {
  display: block;
  width: 142px;
  height: auto;
  border: 0;
}

@media (max-width: 860px) {
  .mission-grid {
    grid-template-columns: 1fr;
  }

  .nexori-support {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
